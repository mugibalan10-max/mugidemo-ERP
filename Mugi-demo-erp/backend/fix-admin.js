const { prisma } = require('./lib/prisma');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function fixAdmin() {
    console.log("🛠️ Fixing Admin account...");
    try {
        const email = "admin@mugi.com";
        const password = "password123";

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update or Upsert
        await prisma.user.upsert({
            where: { email },
            update: { password: hashedPassword },
            create: {
                name: "Mugi Admin",
                email: email,
                password: hashedPassword,
                roleName: "admin"
            }
        });

        console.log("-----------------------------------------");
        console.log("✅ ACCOUNT READY!");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log("-----------------------------------------");
    } catch (err) {
        console.error("❌ Fix failed:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdmin();
