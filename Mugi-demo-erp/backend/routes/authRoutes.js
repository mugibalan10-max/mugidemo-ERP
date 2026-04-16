const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

// POST Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, role: user.roleName },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.roleName
            }
        });

    } catch (err) {
        console.error("DEBUG: Login Error:", err);
        res.status(500).json({ 
            error: "Server error during login", 
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

module.exports = router;
