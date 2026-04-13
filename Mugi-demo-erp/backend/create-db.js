const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: 'postgres', // Connect to default DB
  };

  const client = new Client(config);
  
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL. Checking for database...");
    
    const dbName = process.env.DB_NAME || 'mugi_erp';
    const checkQuery = `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`;
    const res = await client.query(checkQuery);

    if (res.rowCount === 0) {
      console.log(`🚀 Creating database "${dbName}"...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created successfully!`);
    } else {
      console.log(`ℹ️ Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error("❌ Error creating database:", err.message);
  } finally {
    await client.end();
  }
}

createDatabase();
