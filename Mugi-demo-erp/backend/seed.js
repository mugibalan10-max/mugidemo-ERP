const { prisma } = require('./lib/prisma');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedAdmin() {
    console.log("🌱 Seeding default Admin user...");
    try {
        const name = "Mugi Admin";
        const email = "admin@mugi.com";
        const password = "password123";
        const role = "admin";

        // Check if user exists
        const userExists = await prisma.user.findUnique({
            where: { email }
        });

        if (userExists) {
            console.log("ℹ️ Admin user already exists. Skipping seeding.");
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role
            }
        });

        console.log("-----------------------------------------");
        console.log("✅ SEED SUCCESSFUL!");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log("-----------------------------------------");
    } catch (err) {
        console.error("❌ Seed failed:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmin();
