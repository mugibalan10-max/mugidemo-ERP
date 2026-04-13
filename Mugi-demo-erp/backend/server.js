const express = require("express");
const cors = require("cors");
const { prisma, pool } = require("./lib/prisma");
const tallyService = require("./services/tallyService");
const automationService = require("./services/automationService");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection check
prisma.$connect()
  .then(() => console.log("✅ Database Connected successfully via Prisma"))
  .catch(err => {
    console.error("❌ Database connection error:", err.message);
    console.log("💡 Tip: Ensure PostgreSQL is running and credentials in .env are correct.");
  });
app.get("/api/dashboard/stats", async (req, res) => {
    try {
        const customerCount = await prisma.customer.count();
        const leadCount = await prisma.lead.count();
        const convertedLeads = await prisma.lead.count({ where: { status: 'Converted' } });
        
        // Sum total from invoices
        const salesData = await prisma.invoice.aggregate({
            _sum: { total: true }
        });

        // Finance Automation metrics (Step 7)
        const unpaidInvoices = await prisma.invoice.count({
            where: { status: 'Unpaid' }
        });

        const outstandingData = await prisma.invoice.aggregate({
            where: { status: 'Unpaid' },
            _sum: { total: true }
        });

        // Inventory Alerts
        const products = await prisma.product.findMany();
        const lowStockProducts = products.filter(p => p.quantity < p.minStock);
        
        // Tally Sync Metrics
        const tallySynced = await prisma.syncQueue.count({ where: { status: 'Success' } });
        const tallyPending = await prisma.syncQueue.count({ where: { status: 'Pending Retry' } });
        
        res.json({
            totalCustomers: customerCount,
            totalLeads: leadCount,
            convertedLeads: convertedLeads,
            totalSales: salesData._sum.total || 0,
            unpaidInvoices,
            totalOutstanding: outstandingData._sum.total || 0,
            inventoryAlerts: lowStockProducts.length,
            lowStockItems: lowStockProducts.slice(0, 5),
            tallySynced,
            tallyPending,
            conversionRate: leadCount > 0 ? ((convertedLeads / leadCount) * 100).toFixed(1) + "%" : "0%"
        });
    } catch (err) {
        res.status(500).send("Stats Error");
    }
});

app.get("/api/customers", async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { id: 'desc' }
        });
        res.json(customers);
    } catch (err) {
        res.status(500).send("Error fetching customers");
    }
});

// Invoices API - FULL AUTOMATION WORKFLOW
app.post("/api/invoices", async (req, res) => {
  try {
    const { customer_name, subtotal, gst_percent } = req.body;

    // Automation: Auto Calculations
    const gst_p = Number(gst_percent) || 18;
    const sub_t = Number(subtotal) || 0;
    const gst_amount = (sub_t * gst_p) / 100;
    const total = sub_t + gst_amount;

    // Automation: Auto Generate Invoice Number
    const invoice_no = "INV-" + Date.now();

    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Invoice Record
        const invoice = await tx.invoice.create({
            data: {
                invoiceNo: invoice_no,
                customerName: customer_name,
                subtotal: sub_t,
                gstPercent: gst_p,
                gstAmount: gst_amount,
                total: total
            }
        });

        // 2. Create Payment Entry (Updated to match schema)
        await tx.payment.create({
            data: {
                invoiceNo: invoice_no,
                customerName: customer_name,
                amount: total,
                status: "Pending"
            }
        });

        // 3. Add Invoice Activity Log
        await tx.activityLog.create({
            data: {
                module: "Invoicing",
                action: "Generation",
                targetId: invoice.id,
                message: `Invoice ${invoice_no} generated for ${customer_name}. Total: ₹${total}`
            }
        });

        // 4. Prepare Record for Tally Sync Queue
        const syncEntry = await tx.syncQueue.create({
            data: {
                module: "Invoice",
                recordId: invoice.id,
                status: "Pending Retry", // Default state
                syncType: "Tally"
            }
        });

        return { invoice, syncEntry };
    });

    // 🚀 Automation: Instant Tally Push
    let tallyStatus = "Pending Retry";
    try {
        const xml = tallyService.generateSalesXML(result.invoice);
        await tallyService.sendToTally(xml);
        
        // 5. Handle Tally Success Response
        await prisma.syncQueue.update({
            where: { id: result.syncEntry.id },
            data: { status: "Success" }
        });
        tallyStatus = "Success";
    } catch (tallyErr) {
        console.warn("Tally Background Sync Delayed:", tallyErr.message);
    }

        res.json({ 
        message: "✅ Invoice Workflow Automated Successfully", 
        invoice_no: result.invoice.invoiceNo, 
        total: result.invoice.total,
        syncStatus: tallyStatus
    });

    // 🔥 Trigger ERP Brain Automation
    await automationService.runAutomation({
        type: "INVOICE_CREATED",
        data: { invoiceNo: result.invoice.invoiceNo, total: result.invoice.total }
    });
  } catch (err) {
    console.error("Workflow Error:", err.message);
    res.status(500).json({ error: "Failed to process automated invoice workflow" });
  }
});

app.get("/api/invoices", async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Fetch sync statuses
        const syncStatuses = await prisma.syncQueue.findMany({
            where: { module: "Invoice" }
        });

        // Map statuses to invoices
        const result = invoices.map(inv => {
            const sync = syncStatuses.find(s => s.recordId === inv.id);
            return {
                ...inv,
                syncStatus: sync ? sync.status : "Not Queued"
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch invoices" });
    }
});

// Step 3 — Payment Automation Flow
app.post("/api/payments", async (req, res) => {
  try {
    const { invoice_no, customer_name, amount } = req.body;

    // 1. Save DB (Payment Record)
    await pool.query(
      `INSERT INTO payments (invoice_no, customer_name, amount, status)
       VALUES ($1,$2,$3,'Completed')`,
      [invoice_no, customer_name, amount]
    );

    // 🔥 Trigger ERP Brain Automation (Mark Invoice Paid + Update Ledger)
    await automationService.runAutomation({
        type: "PAYMENT_DONE",
        data: { invoiceNo: invoice_no, amount, customerName: customer_name }
    });

    // 4. Tally Sync (Automation)
    let tallySynced = false;
    try {
        const xml = tallyService.generateReceiptXML({ amount }, customer_name);
        await tallyService.sendToTally(xml);
        
        await prisma.activityLog.create({
            data: {
                module: "Tally",
                action: "Payment Sync",
                message: `Payment for ${invoice_no} successfully synced to Tally.`
            }
        });
        tallySynced = true;
    } catch (tallyErr) {
        console.warn("Tally Payment Sync Delayed:", tallyErr.message);
    }

    res.json({
        message: "✅ Payment Recorded & Automation Flow Completed",
        invoice_no,
        tallySynced
    });
  } catch (err) {
    console.error("Payment Flow Error:", err.message);
    res.status(500).json({ error: "Failed to process payment automation flow" });
  }
});

// Step 4 — Update Invoice Status (Standalone)
app.put("/api/invoice/payment", async (req, res) => {
  try {
    const { invoice_no } = req.body;

    await pool.query(
      "UPDATE invoices SET status = 'Paid' WHERE invoice_no = $1",
      [invoice_no]
    );

    res.send("Invoice Updated");
  } catch (err) {
    console.error("Invoice Update Error:", err.message);
    res.status(500).send("Error updating invoice status");
  }
});

// Step 5 — Ledger Concept (Balance Calculation)
app.get("/api/ledger/balance/:customerName", async (req, res) => {
  try {
    const { customerName } = req.params;

    // Sum all invoices for this customer
    const invoices = await prisma.invoice.aggregate({
      where: { customerName: customerName },
      _sum: { total: true }
    });

    // Sum all payments for this customer
    const payments = await prisma.payment.findMany({
      where: { customerName: customerName }
    });
    
    const totalPaid = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const totalInvoiced = Number(invoices._sum.total) || 0;
    const balance = totalInvoiced - totalPaid;

    res.json({
      customerName,
      totalInvoiced,
      totalPaid,
      balance,
      status: balance <= 0 ? "Clear" : "Outstanding"
    });
  } catch (err) {
    console.error("Ledger Error:", err.message);
    res.status(500).send("Error calculating balance");
  }
});

// Step 6 — Tally Sync Flow (Explicit Sync)
app.post("/api/tally/sync-payment", async (req, res) => {
  try {
    const { paymentId } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) }
    });

    if (!payment) return res.status(404).send("Payment record not found");

    // Create Receipt Voucher XML
    const xml = tallyService.generateReceiptXML(payment, payment.customerName);
    
    // Push to Tally
    const tallyResponse = await tallyService.sendToTally(xml);

    res.json({
      message: "✅ Payment synced to Tally successfully",
      tallyResponse
    });
  } catch (err) {
    console.error("Tally Sync Error:", err.message);
    res.status(500).json({ error: "Tally sync failed", details: err.message });
  }
});

// HR Step 2 — Backend API (Employees)
app.post("/api/employees", async (req, res) => {
  try {
    const { name, email, role, salary } = req.body;

    await pool.query(
      "INSERT INTO employees (name,email,role,salary) VALUES ($1,$2,$3,$4)",
      [name, email, role, salary]
    );

    res.send("Employee Added");
  } catch (err) {
    console.error("Employee Error:", err.message);
    res.status(500).send("Error adding employee");
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany();
    res.json(employees);
  } catch (err) {
    res.status(500).send("Error fetching employees");
  }
});

// HR Step 3 — Task Assignment (AI Automation Rule Incorporated)
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, assigned_to } = req.body;

    const result = await pool.query(
      "INSERT INTO tasks (title, assigned_to) VALUES ($1,$2) RETURNING id",
      [title, assigned_to]
    );
    const taskId = result.rows[0].id;

    // 🔥 Trigger ERP Brain Automation (Notifications)
    await automationService.runAutomation({
        type: "TASK_ASSIGNED",
        data: { taskId, title }
    });

    res.json({ message: "Task Assigned & Employee Notified", taskId });
  } catch (err) {
    console.error("Task Error:", err.message);
    res.status(500).send("Error assigning task");
  }
});

app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await pool.query(`
      SELECT t.*, e.name as employee_name 
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.id
      ORDER BY t.id DESC
    `);
    res.json(tasks.rows);
  } catch (err) {
    console.error("Fetch Tasks Error:", err.message);
    res.status(500).send("Error fetching tasks");
  }
});

// HR Step 4 — Payroll Logic
app.post("/api/payroll/calculate", async (req, res) => {
  try {
    const { employeeId, month, year, bonus, manualDeductions } = req.body;

    // 1. Get Employee Basic Salary
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) }
    });

    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const basicSalary = Number(employee.salary);

    // 2. Calculate Deductions (Based on Absent days for specifically the month/year)
    // Create start and end dates for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const attendance = await prisma.attendance.findMany({
        where: {
            employeeId: parseInt(employeeId),
            status: 'Absent',
            date: {
                gte: startDate,
                lte: endDate
            }
        }
    });
    
    const absentDays = attendance.length;
    const perDaySalary = basicSalary / 30;
    const autoDeductions = absentDays * perDaySalary;
    const totalDeductions = autoDeductions + (Number(manualDeductions) || 0);

    // 3. Formula: Net = Basic - Deductions + Bonus
    const bonusAmt = Number(bonus) || 0;
    const netSalary = basicSalary - totalDeductions + bonusAmt;

    // 4. Save to DB
    const payrollRecord = await prisma.payroll.create({
      data: {
        employeeId: parseInt(employeeId),
        month,
        year: parseInt(year),
        basicSalary,
        deductions: totalDeductions,
        bonus: bonusAmt,
        netSalary,
        status: "Calculated"
      }
    });

    res.json({
      message: "✅ Payroll Calculated Successfully",
      payroll: payrollRecord,
      breakdown: {
        absentDays,
        autoDeductions,
        manualDeductions: Number(manualDeductions) || 0
      }
    });
  } catch (err) {
    console.error("Payroll Error:", err.message);
    res.status(500).json({ error: "Failed to calculate payroll" });
  }
});

app.get("/api/payroll", async (req, res) => {
  try {
    const records = await prisma.payroll.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: "Error fetching payroll history" });
  }
});

// HR Step 5 — Automation Flows (Task & Leave)

// Update Task Status
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    // Automation: Log HR Tracking
    await prisma.activityLog.create({
      data: {
        module: "HR",
        action: "Task Update",
        targetId: task.id,
        message: `Task "${task.title}" updated to ${status}.`
      }
    });

    res.json({ message: "Task Updated", task });
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Apply for Leave / Record Attendance
app.post("/api/attendance", async (req, res) => {
  try {
    const { employeeId, status, date } = req.body;

    const record = await prisma.attendance.create({
      data: {
        employeeId: parseInt(employeeId),
        status, // 'Present', 'Absent', 'Leave Request'
        date: date ? new Date(date) : new Date()
      }
    });

    res.json({ message: "Attendance/Leave Record Created", record });
  } catch (err) {
    res.status(500).json({ error: "Failed to record attendance" });
  }
});

// Approve/Reject Leave
app.put("/api/attendance/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved Leave', 'Rejected Leave'

    const record = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    // Automation: Log Approval for Payroll
    await prisma.activityLog.create({
      data: {
        module: "HR",
        action: "Leave Approval",
        targetId: record.id,
        message: `Leave request for employee ${record.employeeId} set to ${status}.`
      }
    });

    res.json({ message: "Leave Status Updated", record });
  } catch (err) {
    res.status(500).json({ error: "Failed to update leave status" });
  }
});

app.get("/api/attendance", async (req, res) => {
    try {
        const list = await prisma.attendance.findMany({
            orderBy: { date: 'desc' }
        });
        res.json(list);
    } catch (err) {
        res.status(500).send("Error fetching attendance");
    }
});

// Bulk Attendance (Step 5 Improvement)
app.post("/api/attendance/bulk", async (req, res) => {
    try {
        const { records } = req.body; // Array of { employeeId, status, date }

        const result = await prisma.attendance.createMany({
            data: records.map(r => ({
                employeeId: parseInt(r.employeeId),
                status: r.status,
                date: r.date ? new Date(r.date) : new Date()
            }))
        });

        res.json({ message: `✅ ${result.count} Attendance records created`, count: result.count });
    } catch (err) {
        console.error("Bulk Attendance Error:", err.message);
        res.status(500).json({ error: "Failed to record bulk attendance" });
    }
});

// Step 3 — Reports Module (Backend)
app.get("/api/reports/invoices", async (req, res) => {
  try {
    const data = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching invoice report");
  }
});

app.get("/api/reports/payments", async (req, res) => {
  try {
    const data = await prisma.payment.findMany({ orderBy: { paymentDate: 'desc' } });
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching payment report");
  }
});

app.get("/api/reports/employees", async (req, res) => {
  try {
    const data = await prisma.employee.findMany({ orderBy: { id: 'asc' } });
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching employee report");
  }
});

app.get("/api/reports/products", async (req, res) => {
  try {
    const data = await prisma.product.findMany({ orderBy: { productName: 'asc' } });
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching product report");
  }
});

// Manual Tally Sync API - Step 5
app.post("/api/tally/sync", async (req, res) => {
  try {
    const { invoiceId } = req.body;
    
    // 1. Fetch Invoice
    const invoice = await prisma.invoice.findUnique({ where: { id: parseInt(invoiceId) } });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    // 2. Generate XML & Send
    const xml = tallyService.generateSalesXML(invoice);
    const tallyResponse = await tallyService.sendToTally(xml);

    // 3. Status Update (Optional but good)
    await prisma.syncQueue.updateMany({
        where: { recordId: invoiceId, module: "Invoice" },
        data: { status: "Synced" }
    });

    res.json({ message: "Manual sync successful", tallyResponse });
  } catch (err) {
    console.error("Manual Sync Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Products API - WITH AUTOMATION
app.post("/api/products", async (req, res) => {
  try {
    const { product_name, sku, quantity, min_stock, price } = req.body;
    
    const qty = parseInt(quantity) || 0;
    const min = parseInt(min_stock) || 10;
    const prc = parseFloat(price) || 0;

    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Product
        const newProduct = await tx.product.create({
            data: {
                productName: product_name,
                sku,
                quantity: qty,
                minStock: min,
                price: prc
            }
        });

        // 5. Queue for Tally Stock Sync
        await tx.syncQueue.create({
            data: {
                module: "Stock",
                recordId: newProduct.id,
                status: "Pending Retry",
                syncType: "Tally"
            }
        });

        return newProduct;
    });

    // 🔥 Trigger ERP Brain Automation if stock is low
    if (result.quantity < result.minStock) {
        await automationService.runAutomation({
            type: "LOW_STOCK",
            data: { 
                productId: result.id, 
                productName: result.productName, 
                quantity: result.quantity, 
                minStock: result.minStock,
                sku: result.sku
            }
        });
    }

    // 🚀 Automation: Instant Tally Stock Push
    try {
        const xml = tallyService.generateStockXML(result);
        await tallyService.sendToTally(xml);
        await prisma.syncQueue.updateMany({
            where: { recordId: result.id, module: "Stock" },
            data: { status: "Success" }
        });
    } catch (err) {
        console.warn("Tally Stock Sync Delayed");
    }

    res.json({ message: "Product Added & Synced", product: result });
  } catch (err) {
    console.error("Product Error:", err.message);
    res.status(500).send("Error adding product");
  }
});

// Manual Stock Sync
app.post("/api/tally/sync-stock", async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
        const xml = tallyService.generateStockXML(product);
        const result = await tallyService.sendToTally(xml);
        res.json({ message: "Stock synced", result });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (err) {
    res.status(500).send("Error fetching products");
  }
});

// Admin Routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Auth Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Leads Routes
const leadRoutes = require('./routes/leadRoutes');
app.use('/api/leads', leadRoutes);

// Server Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
