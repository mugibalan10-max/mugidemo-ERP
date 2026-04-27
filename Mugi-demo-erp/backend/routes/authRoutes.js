const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

// --- Shared Login Logic ---
const loginHandler = async (req, res) => {
    console.log("POST Auth Request:", req.body);
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Request body is missing. Ensure Content-Type is application/json" });
        }
        
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find user with Role and Permissions
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Flatten permissions: ["module:action", ...]
        const permissions = (user.role?.permissions || []).map(p => 
            `${p.permission.moduleName}:${p.permission.action}`
        );

        // Generate Token
        const token = jwt.sign(
            { 
                id: user.id, 
                role: user.role?.name || 'employee',
                permissions: permissions 
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role?.name || 'employee',
                permissions: permissions
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
};

// --- Mount both endpoints to avoid 404 confusion ---
router.post('/', loginHandler);       // Matches POST /api/auth
router.post('/login', loginHandler);  // Matches POST /api/auth/login

module.exports = router;
