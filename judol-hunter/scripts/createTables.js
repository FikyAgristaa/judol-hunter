const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "judolhunter",
  user: process.env.DB_USER || "judoluser",
  password: process.env.DB_PASS || "JudolHunter123!",
});

async function createTables() {
  try {
    console.log("Creating database tables...");

    const sql = fs.readFileSync(
      path.join(__dirname, "createTables.sql"),
      "utf8",
    );
    await pool.query(sql);

    console.log("Tables created successfully!");

    const result = await pool.query("SELECT * FROM dashboard_summary");
    console.log("Dashboard summary ready:", result.rows[0]);
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    await pool.end();
  }
}

createTables();
