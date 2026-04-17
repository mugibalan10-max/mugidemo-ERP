const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/prisma");

router.get("/invoices", async (req, res) => {
  try {
    const data = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching invoice report");
  }
});

router.get("/payments", async (req, res) => {
  try {
    const data = await prisma.payment.findMany({ orderBy: { paymentDate: 'desc' } });
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching payment report");
  }
});

router.get("/employees", async (req, res) => {
  try {
    const data = await prisma.employee.findMany({ orderBy: { id: 'asc' } });
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching employee report");
  }
});

router.get("/products", async (req, res) => {
  try {
    const data = await prisma.product.findMany({ orderBy: { productName: 'asc' } });
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching product report");
  }
});

router.get("/payroll", async (req, res) => {
  try {
    const data = await prisma.payroll.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching payroll report");
  }
});

router.get("/logs", async (req, res) => {
  try {
    const data = await prisma.activityLog.findMany({ 
      orderBy: { createdAt: 'desc' },
      take: 100 
    });
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching automation logs");
  }
});

router.get("/tally-sync", async (req, res) => {
  try {
    const data = await prisma.syncQueue.findMany({
      orderBy: { createdAt: "desc" },
      take: 100
    });
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching tally sync logs");
  }
});

router.get("/quarterly", async (req, res) => {
  try {
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    
    const invoices = await prisma.invoice.aggregate({
      where: { createdAt: { gte: quarterStart } },
      _sum: { total: true },
      _count: true
    });

    const collections = await prisma.payment.aggregate({
      where: { paymentDate: { gte: quarterStart }, status: 'Success' },
      _sum: { amount: true }
    });

    res.json({
      success: true,
      period: `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`,
      summary: {
        totalRevenue: invoices._sum.total || 0,
        invoiceCount: invoices._count || 0,
        totalCollected: collections._sum.amount || 0,
        outstanding: (invoices._sum.total || 0) - (collections._sum.amount || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
