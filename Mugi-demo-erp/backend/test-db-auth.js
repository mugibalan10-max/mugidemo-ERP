const { Pool } = require('pg');
require('dotenv').config();

const passwords = ['', 'postgres', 'admin', 'password', '123456'];

async function findWorkingPassword() {
  console.log("🔍 Testing common PostgreSQL passwords...");
  
  for (const pwd of passwords) {
    const config = {
      user: 'postgres',
      host: 'localhost',
      database: 'postgres', // Connect to default DB first to check auth
      password: pwd,
      port: 5432,
    };

    const pool = new Pool(config);
    
    try {
      const client = await pool.connect();
      console.log(`\n✅ SUCCESS! The password for user 'postgres' is: "${pwd}"`);
      console.log("--------------------------------------------------");
      console.log(`Please update your .env file:`);
      console.log(`DB_PASSWORD=${pwd}`);
      console.log(`DATABASE_URL="postgresql://postgres:${pwd}@localhost:5432/mugi_erp?schema=public"`);
      console.log("--------------------------------------------------");
      client.release();
      await pool.end();
      return;
    } catch (err) {
      console.log(`❌ Tried "${pwd}": ${err.message}`);
      await pool.end();
    }
  }

  console.log("\n❌ All common passwords failed.");
  console.log("💡 Please check your PostgreSQL installation and find the password you set during setup.");
}

findWorkingPassword();
