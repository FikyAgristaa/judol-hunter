/**
 * Judol Hunter Dashboard
 */

const express = require("express");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const cors = require("cors");
const { Pool } = require("pg");
const logger = require("../logger");

const app = express();
const PORT = process.env.PORT || 50001;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "judolhunter",
  user: process.env.DB_USER || "judoluser",
  password: process.env.DB_PASS || "JudolHunter123!",
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/stats", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM dashboard_summary");
    res.json(result.rows[0] || {});
  } catch (error) {
    logger.error("Stats API error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/websites/recent", async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const result = await pool.query(
      `
            SELECT id, url, domain, status, ai_score, created_at
            FROM websites
            ORDER BY created_at DESC
            LIMIT $1
        `,
      [limit],
    );
    res.json(result.rows);
  } catch (error) {
    logger.error("Websites API error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/payments/recent", async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const result = await pool.query(
      `
            SELECT pa.*, w.url as website_url
            FROM payment_accounts pa
            JOIN websites w ON pa.website_id = w.id
            ORDER BY pa.created_at DESC
            LIMIT $1
        `,
      [limit],
    );
    res.json(result.rows);
  } catch (error) {
    logger.error("Payments API error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports/recent", async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const result = await pool.query(
      `
            SELECT r.*, w.url as website_url
            FROM reports r
            JOIN websites w ON r.website_id = w.id
            ORDER BY r.created_at DESC
            LIMIT $1
        `,
      [limit],
    );
    res.json(result.rows);
  } catch (error) {
    logger.error("Reports API error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Dashboard running on port ${PORT}`);
});

module.exports = app;
