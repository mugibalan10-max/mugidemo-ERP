const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { prisma } = require('../lib/prisma');
require('dotenv').config();

// GET all users (Admin only view)
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                roleName: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error fetching users" });
    }
});

// POST Create new user
router.post('/users', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Check if user exists
        const userExists = await prisma.user.findUnique({
            where: { email }
        });
        if (userExists) {
            return res.status(400).json({ error: "User with this email already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                roleName: role || 'employee'
            },
            select: {
                id: true,
                name: true,
                email: true,
                roleName: true
            }
        });

        res.status(201).json(newUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error creating user" });
    }
});

module.exports = router;
