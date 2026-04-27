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
                role: {
                  select: {
                    name: true
                  }
                },
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Flatten the role for the response
        const formattedUsers = users.map(u => ({
          ...u,
          roleName: u.role?.name || 'No Role'
        }));
        res.json(formattedUsers);
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

        // Find role by name or default to 'Employee'
        const roleRecord = await prisma.role.findUnique({
          where: { name: role || 'Employee' }
        });

        // Insert user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                roleId: roleRecord ? roleRecord.id : null
            },
            include: {
                role: true
            }
        });

        res.status(201).json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            roleName: newUser.role?.name || 'No Role'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error creating user" });
    }
});

module.exports = router;
