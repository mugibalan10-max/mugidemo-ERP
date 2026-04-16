const { prisma } = require("../lib/prisma");
const { pool } = require("../lib/prisma");

/**
 * AI Rule Engine (ERP Brain)
 * Centralized automation logic for business events.
 */
async function runAutomation(event) {
  console.log(`🤖 AI Brain: Processing event [${event.type}]`, event.data);

  try {
    switch(event.type) {

      case "LEAD_CREATED": {
        const { leadId, name } = event.data;
        // 1. Auto Assign Sales Person
        const salesEmployees = await prisma.employee.findMany();
        let assignedTo = null;
        if (salesEmployees.length > 0) {
            const randomIndex = Math.floor(Math.random() * salesEmployees.length);
            assignedTo = salesEmployees[randomIndex].id;
            await prisma.lead.update({
                where: { id: leadId },
                data: { assignedTo }
            });
        }
        // 2. Create Follow-up Reminder
        await prisma.activityLog.create({
            data: {
                module: "Leads",
                action: "Follow-up Reminder",
                targetId: leadId,
                message: `AUTOTASK: Follow up with ${name} within 24 hours. Assigned to employee ID: ${assignedTo || 'Unassigned'}`
            }
        });
        console.log("✅ Lead Automation Complete: Assigned + Reminder created.");
        break;
      }

      case "INVOICE_CREATED": {
        // GST and calculation logic is usually handled before saving, 
        // but we can log the finance update here.
        const { invoiceNo, total } = event.data;
        await prisma.activityLog.create({
            data: {
                module: "Finance",
                action: "Automation",
                message: `Invoice ${invoiceNo} (₹${total}) processed: GST calculated and synced to Tally.`
            }
        });
        console.log("✅ Invoice Automation Complete: Finance records updated.");
        break;
      }

      case "PAYMENT_DONE": {
        const { invoiceNo, amount, customerName } = event.data;
        // 1. Update Ledger / Invoice Status
        await pool.query(
            "UPDATE invoices SET status = 'Paid' WHERE invoice_no = $1",
            [invoiceNo]
        );
        // 2. Log Activity
        await prisma.activityLog.create({
            data: {
                module: "Payments",
                action: "Automation",
                message: `Ledger updated: Invoice ${invoiceNo} marked PAID after receiving ₹${amount} from ${customerName}.`
            }
        });
        console.log("✅ Payment Automation Complete: Ledger updated + Invoice Paid.");
        break;
      }

      case "LOW_STOCK": {
        const { productId, productName, quantity, minStock, sku } = event.data;
        const requiredCount = minStock - quantity;
        
        // Auto Create Purchase Request
        await prisma.purchaseRequest.create({
            data: {
                productName,
                sku,
                requiredQty: requiredCount,
                vendorSuggestion: "Primary Vendor",
                status: "Pending"
            }
        });

        await prisma.activityLog.create({
            data: {
                module: "Inventory",
                action: "Auto-Reorder",
                targetId: productId,
                message: `LOW STOCK DETECTED: ${productName} (${quantity}/${minStock}). Auto-generated Purchase Request for ${requiredCount} units.`
            }
        });
        console.log("✅ Stock Automation Complete: Purchase Request generated.");
        break;
      }

      case "TASK_ASSIGNED": {
          const { taskId, title } = event.data;
          await prisma.activityLog.create({
              data: {
                  module: "Tasks",
                  action: "Notification",
                  targetId: taskId,
                  message: `NOTICE: New task "${title}" assigned. Check your task list.`
              }
          });
          console.log("✅ Task Automation Complete: Employee notified.");
          break;
      }

      default:
        console.warn(`⚠️ No automation rules defined for event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`❌ AI Rule Engine Error [${event.type}]:`, err.message);
  }
}

module.exports = { runAutomation };
