/**
 * Database Connection
 */

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "judolhunter",
  user: process.env.DB_USER || "judoluser",
  password: process.env.DB_PASS || "JudolHunter123!",
  max: process.env.DB_POOL_MAX || 20,
  idleTimeoutMillis: process.env.DB_POOL_IDLE || 10000,
});

pool.on("connect", () => {
  console.log("Database connected");
});

pool.on("error", (err) => {
  console.error("Database error:", err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
