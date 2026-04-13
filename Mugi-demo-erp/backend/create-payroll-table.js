const { Client } = require('pg');
require('dotenv').config();

async function createPayrollTable() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL. Creating payroll table...");

    const payrollQuery = `
      CREATE TABLE IF NOT EXISTS payroll (
        id SERIAL PRIMARY KEY,
        employee_id INT,
        month VARCHAR(20),
        year INT,
        basic_salary NUMERIC(10,2),
        deductions NUMERIC(10,2),
        bonus NUMERIC(10,2),
        net_salary NUMERIC(10,2),
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(payrollQuery);
    console.log("✅ Table 'payroll' created successfully.");
  } catch (err) {
    console.error("❌ Error creating payroll table:", err.message);
  } finally {
    await client.end();
  }
}

createPayrollTable();
