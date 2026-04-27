const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { protect, checkPermission } = require("../middleware/auth.middleware");

// GET all customers
router.get("/", protect, checkPermission('customers', 'view'), async (req, res) => {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { id: 'desc' }
        });
        res.json(customers);
    } catch (err) {
        console.error("Fetch Customers Error:", err.message);
        res.status(500).json({ error: "Failed to fetch customers" });
    }
});

// GET single customer by ID
router.get("/:id", protect, checkPermission('customers', 'view'), async (req, res) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }
        res.json(customer);
    } catch (err) {
        console.error("Fetch Customer Error:", err.message);
        res.status(500).json({ error: "Server error while fetching customer" });
    }
});

// POST Create new customer
router.post("/", protect, checkPermission('customers', 'manage'), async (req, res) => {
    try {
        const { name, email, phone, gstNumber, address } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Name and Email are required fields" });
        }

        const newCustomer = await prisma.customer.create({
            data: { 
                name, 
                email, 
                phone, 
                gstNumber, 
                address 
            }
        });

        res.status(201).json({ message: "Customer created successfully", customer: newCustomer });
    } catch (err) {
        console.error("Create Customer Error:", err.message);
        res.status(500).json({ error: "Failed to create customer. Email might be duplicate." });
    }
});

module.exports = router;
