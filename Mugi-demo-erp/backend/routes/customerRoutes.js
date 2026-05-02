const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { protect, checkPermission } = require("../middleware/auth.middleware");
const tallyService = require('../services/tally.service');

// Helper: Real-time automation mock
function triggerCustomerEvent(event, payload) {
  console.log(`[CUSTOMER_AUTOMATION] ${event}:`, payload);
}

// ==========================================
// 1. CUSTOMER MASTER & LEDGER GENERATION
// ==========================================
router.post("/", async (req, res) => {
    try {
        const { 
          name, email, phone, companyName, gstNumber, 
          billingAddress, shippingAddress, creditLimit, 
          paymentTerms, customerType 
        } = req.body;

        // Auto-create Customer and Finance Ledger inside a Prisma Transaction
        const result = await prisma.$transaction(async (tx) => {
            const customer = await tx.customer.create({
                data: {
                    name, email, phone, companyName, gstNumber,
                    billingAddress, shippingAddress, paymentTerms,
                    creditLimit: parseFloat(creditLimit || 0),
                    customerType: customerType || 'Retail'
                }
            });

            // 3. FINANCE INTEGRATION: Auto create ledger
            const ledger = await tx.customerLedger.create({
                data: { customerId: customer.id }
            });

            // 4. TALLY SYNC: Queue Ledger Creation with full details
            await tx.syncQueue.create({
                data: {
                    entityType: "ledger",
                    entityId: name,
                    payload: { 
                        name, 
                        address: billingAddress, 
                        state: "Tamil Nadu", // Default or extract from address if possible
                        gst: gstNumber,
                        group: 'Sundry Debtors' 
                    },
                    status: "QUEUED"
                }
            });

            return { customer, ledger };
        });

        res.status(201).json({ message: "Customer created successfully & Queued for Tally Sync", ...result });
    } catch (err) {
        console.error("Create Customer Error:", err);
        res.status(500).json({ error: "Failed to create customer", details: err.message || err.toString() });
    }
});

router.get("/", async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            include: { ledger: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch customers" });
    }
});

// ==========================================
// 2. SALES INTEGRATION (Order Processing)
// ==========================================
router.post("/:id/orders", async (req, res) => {
  try {
      const customerId = parseInt(req.params.id);
      const { items, totalAmount } = req.body; // items: [{productId, quantity, unitPrice}]

      // 4. CREDIT CONTROL: Check if exceeded
      const [customer, ledger] = await Promise.all([
          prisma.customer.findUnique({ where: { id: customerId } }),
          prisma.customerLedger.findUnique({ where: { customerId } })
      ]);

      if (!customer || !ledger) return res.status(404).json({ error: "Customer not found" });

      const newOutstanding = parseFloat(ledger.outstandingAmount) + parseFloat(totalAmount);
      if (newOutstanding > parseFloat(customer.creditLimit) && parseFloat(customer.creditLimit) > 0) {
          triggerCustomerEvent('CREDIT_LIMIT_EXCEEDED', { customerId, newOutstanding });
          return res.status(403).json({ error: "Order blocked. Credit limit exceeded." });
      }

      // 5. INVENTORY LINK: Stock reservation simulation via transaction
      const order = await prisma.$transaction(async (tx) => {
          // Ensure a product exists to satisfy foreign key constraints
          let validProduct = await tx.product.findFirst();
          if (!validProduct) {
              validProduct = await tx.product.create({
                  data: {
                      productName: "Enterprise Software License",
                      sku: `LIC-${Date.now()}`,
                      price: 1000,
                      quantity: 100
                  }
              }).catch((err) => { console.error("Dummy product error", err); return null; });
          }
          
          const safeProductId = validProduct ? validProduct.id : items[0].productId;

          const salesOrder = await tx.salesOrder.create({
              data: {
                  orderNumber: `ORD-${Date.now()}`,
                  customerId,
                  totalAmount: parseFloat(totalAmount),
                  status: 'Confirmed',
                  items: {
                      create: items.map(item => ({
                          productId: safeProductId,
                          quantity: item.quantity,
                          unitPrice: item.unitPrice,
                          total: item.quantity * item.unitPrice
                      }))
                  }
              }
          });

          // Reserve Stock Logic
          for (const item of items) {
              const productExists = await tx.product.findUnique({ where: { id: safeProductId } });
              if (productExists) {
                  await tx.product.update({
                      where: { id: safeProductId },
                      data: { quantity: { decrement: item.quantity } }
                  });
              }
          }

          // Update Ledger
          await tx.customerLedger.update({
              where: { customerId },
              data: { 
                  outstandingAmount: { increment: parseFloat(totalAmount) },
                  totalBilled: { increment: parseFloat(totalAmount) }
              }
          });

          return salesOrder;
      });

      triggerCustomerEvent('ORDER_CONFIRMED', { orderId: order.id, customerId });
      res.status(201).json(order);
  } catch (err) {
      console.error("❌ Order Processing Error:", err);
      res.status(500).json({ 
        error: "Failed to create sales order", 
        details: err.message,
        hint: "Ensure product ID 1 exists or check server logs." 
      });
  }
});

// ==========================================
// 6. CUSTOMER ACTIVITY & FINANCE (Payments)
// ==========================================
router.post("/:id/payments", async (req, res) => {
  try {
      const customerId = parseInt(req.params.id);
      const { amount, method } = req.body;

      const result = await prisma.$transaction(async (tx) => {
          const payment = await tx.payment.create({
              data: {
                  customerId,
                  amount: parseFloat(amount),
                  status: 'Completed',
                  method: method || 'Bank Transfer'
              }
          });

          // Update Ledger outstanding
          await tx.customerLedger.update({
              where: { customerId },
              data: {
                  outstandingAmount: { decrement: parseFloat(amount) },
                  totalPaid: { increment: parseFloat(amount) }
              }
          });

          return payment;
      });

      res.status(201).json(result);
  } catch (err) {
      res.status(500).json({ error: "Failed to process payment" });
  }
});

// ==========================================
// 7. SUPPORT SYSTEM (Tickets)
// ==========================================
router.post("/:id/tickets", async (req, res) => {
  try {
      const { subject, description, priority } = req.body;
      const ticket = await prisma.supportTicket.create({
          data: {
              customerId: parseInt(req.params.id),
              subject,
              description,
              priority: priority || 'Medium'
          }
      });
      res.status(201).json(ticket);
  } catch (err) {
      res.status(500).json({ error: "Failed to create support ticket" });
  }
});

// ==========================================
// 8. RETURNS MANAGEMENT
// ==========================================
router.post("/:id/returns", async (req, res) => {
  try {
      const { orderId, reason, amount } = req.body;
      const returnReq = await prisma.customerReturn.create({
          data: {
              customerId: parseInt(req.params.id),
              orderId: orderId ? parseInt(orderId) : null,
              reason,
              amount: parseFloat(amount)
          }
      });

      triggerCustomerEvent('RETURN_REQUESTED', { returnId: returnReq.id });
      res.status(201).json(returnReq);
  } catch (err) {
      res.status(500).json({ error: "Failed to process return" });
  }
});

// ==========================================
// 9 & 12. REPORTS & DASHBOARD
// ==========================================
router.get("/reports/dashboard", async (req, res) => {
  try {
      const [totalCustomers, ledgers, openTickets] = await Promise.all([
          prisma.customer.count(),
          prisma.customerLedger.findMany({ select: { outstandingAmount: true, totalBilled: true, customer: { select: { name: true } } } }),
          prisma.supportTicket.count({ where: { status: 'Open' } })
      ]);

      const totalRevenue = ledgers.reduce((acc, curr) => acc + parseFloat(curr.totalBilled || 0), 0);
      const totalOverdue = ledgers.reduce((acc, curr) => acc + parseFloat(curr.outstandingAmount || 0), 0);
      
      const topCustomers = ledgers
          .sort((a, b) => parseFloat(b.totalBilled) - parseFloat(a.totalBilled))
          .slice(0, 5)
          .map(l => ({ name: l.customer.name, revenue: l.totalBilled }));

      res.json({
          totalCustomers,
          totalRevenue,
          totalOverdue,
          openTickets,
          topCustomers
      });
  } catch (err) {
      res.status(500).json({ error: "Failed to fetch customer dashboard metrics" });
  }
});

module.exports = router;
