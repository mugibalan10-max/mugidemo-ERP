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

module.exports = router;
