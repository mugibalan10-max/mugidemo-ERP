const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { prisma } = require("../lib/prisma");
const { protect } = require("../middleware/auth.middleware");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// STEP 1: Create Razorpay Order
router.post("/create-order", protect, async (req, res) => {
  try {
    const { invoiceId } = req.body;
    
    // 1. Fetch Invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
      include: { customer: true }
    });

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    if (invoice.status === "Paid") return res.status(400).json({ error: "Invoice already paid" });

    // 2. Create Razorpay Order (Amount in Paise)
    const options = {
      amount: Math.round(Number(invoice.total) * 100), 
      currency: "INR",
      receipt: `receipt_${invoice.invoiceNo}`,
    };

    const order = await razorpay.orders.create(options);

    // 3. Store Order Info in Payments table (as Pending)
    await prisma.payment.create({
      data: {
        invoiceNo: invoice.invoiceNo,
        customerId: invoice.customerId,
        amount: invoice.total,
        status: "Pending",
        orderId: order.id,
        method: "Razorpay"
      }
    });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      customer: {
        name: invoice.customer?.name,
        email: invoice.customer?.email,
        phone: invoice.customer?.phone
      }
    });

  } catch (err) {
    console.error("Razorpay Order Error:", err);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

// STEP 2 & 3 happen on frontend (Checkout & Success)

// STEP 4: Verify Payment Signature
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, invoice_id } = req.body;

    // 1. Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // 2. Database Updates in a Transaction
      await prisma.$transaction(async (tx) => {
        // Update Payment Record
        await tx.payment.updateMany({
          where: { orderId: razorpay_order_id },
          data: {
            status: "Success",
            paymentId: razorpay_payment_id,
            signature: razorpay_signature
          }
        });

        // Mark Invoice as Paid
        const updatedInvoice = await tx.invoice.update({
          where: { id: parseInt(invoice_id) },
          data: { status: "Paid" },
          include: { items: true }
        });

        // Reduce Stock (Business Logic)
        for (const item of updatedInvoice.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } }
          });
        }

        // Activity Log
        await tx.activityLog.create({
          data: {
            module: "Payments",
            action: "RAZORPAY_SUCCESS",
            targetId: updatedInvoice.id,
            message: `Payment successful for Invoice ${updatedInvoice.invoiceNo}. Amount: ₹${updatedInvoice.total}`
          }
        });
      });

      res.json({ status: "success", message: "Payment verified and inventory updated" });
    } else {
      res.status(400).json({ status: "failure", message: "Invalid signature" });
    }

  } catch (err) {
    console.error("Payment Verification Error:", err);
    res.status(500).json({ error: "Internal server error during verification" });
  }
});

// WEBHOOK Support
router.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const isValid = Razorpay.validateWebhookSignature(
      JSON.stringify(req.body),
      signature,
      secret
    );

    if (!isValid) return res.status(400).send("Invalid signature");

    const event = req.body.event;
    const payload = req.body.payload.payment.entity;

    if (event === "payment.captured") {
        // Handle background capture if needed
        console.log("Payment Captured via Webhook:", payload.id);
    }

    res.status(200).send("OK");
  } catch (err) {
    res.status(500).send("Webhook error");
  }
});

module.exports = router;
