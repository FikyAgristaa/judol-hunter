/**
 * JUDOL HUNTER - Main Hunter Module
 */

const cron = require("node-cron");
const { googleDork } = require("./googleDork");
const { crawler } = require("./crawler");
const logger = require("../logger");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "judolhunter",
  user: process.env.DB_USER || "judoluser",
  password: process.env.DB_PASS || "JudolHunter123!",
});

class JudolHunter {
  constructor() {
    this.isRunning = false;
    this.stats = {
      totalFound: 0,
      todayFound: 0,
      lastRun: null,
    };
  }

  async start() {
    logger.info("Judol Hunter started");
    this.isRunning = true;

    cron.schedule(process.env.HUNTER_SCHEDULE || "0 */6 * * *", () => {
      this.hunt();
    });

    this.hunt();
  }

  async hunt() {
    if (!this.isRunning) return;

    logger.info("Starting hunting session...");
    const startTime = Date.now();

    try {
      const dorkResults = await googleDork.search();
      const validUrls = this.validateUrls(dorkResults);

      for (const url of validUrls) {
        await this.processUrl(url);
      }

      this.stats.lastRun = new Date();
      this.stats.totalFound += validUrls.length;
      this.stats.todayFound += validUrls.length;

      const duration = (Date.now() - startTime) / 1000;
      logger.info(
        `Hunting completed in ${duration}s. Found ${validUrls.length} new URLs.`,
      );

      await this.saveStats();
    } catch (error) {
      logger.error("Hunting error:", error);
    }
  }

  validateUrls(urls) {
    const seen = new Set();
    return urls.filter((url) => {
      if (seen.has(url)) return false;
      if (!url.startsWith("http")) return false;
      seen.add(url);
      return true;
    });
  }

  async processUrl(url) {
    try {
      logger.debug(`Processing: ${url}`);
      const crawlResult = await crawler.crawl(url);
      await this.saveToDatabase(crawlResult);
    } catch (error) {
      logger.error(`Error processing ${url}:`, error);
    }
  }

  async saveToDatabase(result) {
    const query = `
            INSERT INTO websites (url, domain, html_snapshot, screenshot_path, metadata, status)
            VALUES ($1, $2, $3, $4, $5, 'pending')
            ON CONFLICT (url) DO NOTHING
            RETURNING id
        `;

    const values = [
      result.url,
      new URL(result.url).hostname,
      result.html,
      result.screenshot,
      JSON.stringify(result.metadata || {}),
    ];

    try {
      const dbResult = await pool.query(query, values);
      if (dbResult.rows.length > 0) {
        logger.info(`Saved to database: ${result.url}`);
      }
    } catch (err) {
      logger.error("Database error:", err);
    }
  }

  async saveStats() {
    const query = `
            INSERT INTO statistics (date, websites_found)
            VALUES (CURRENT_DATE, $1)
            ON CONFLICT (date) DO UPDATE
            SET websites_found = statistics.websites_found + $1,
                updated_at = CURRENT_TIMESTAMP
        `;

    await pool.query(query, [this.stats.todayFound]);
  }

  stop() {
    this.isRunning = false;
    logger.info("Judol Hunter stopped");
  }
}

module.exports = new JudolHunter();
