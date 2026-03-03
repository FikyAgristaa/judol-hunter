/**
 * Judol Hunter - Main Entry Point
 */

require("dotenv").config();
const logger = require("./logger");
const hunter = require("./hunter");
const db = require("./database/connection");

async function main() {
  logger.info("Starting Judol Hunter System...");

  try {
    await db.query("SELECT 1");
    logger.info("Database connected");

    await hunter.start();
    logger.info("Hunter module started");

    require("./dashboard/server");
    logger.info("Dashboard started");
  } catch (error) {
    logger.error("Failed to start:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  logger.info("Shutting down...");
  hunter.stop();
  await db.pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down...");
  hunter.stop();
  await db.pool.end();
  process.exit(0);
});

main();