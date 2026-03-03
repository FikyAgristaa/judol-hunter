/**
 * Web Crawler
 */

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const logger = require("../logger");

puppeteer.use(StealthPlugin());

class Crawler {
  constructor() {
    this.browser = null;
    this.maxDepth = parseInt(process.env.CRAWL_DEPTH) || 3;
    this.timeout = parseInt(process.env.CRAWL_TIMEOUT) || 30000;
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--window-size=1920x1080",
        ],
      });
      logger.info("Browser launched");
    }
  }

  async crawl(url) {
    await this.init();

    const page = await this.browser.newPage();
    const result = {
      url,
      timestamp: new Date().toISOString(),
      html: null,
      screenshot: null,
      metadata: {},
    };

    try {
      await page.setViewport({ width: 1920, height: 1080 });

      logger.debug(`Crawling: ${url}`);
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: this.timeout,
      });

      result.metadata.title = await page.title();

      const screenshotPath = await this.takeScreenshot(page, url);
      result.screenshot = screenshotPath;

      result.html = await page.content();
      result.metadata = await this.extractMetadata(page, result.html);

      logger.info(`Crawled: ${url}`);
    } catch (error) {
      logger.error(`Error crawling ${url}:`, error);
      result.error = error.message;
    } finally {
      await page.close();
    }

    return result;
  }

  async takeScreenshot(page, url) {
    const filename = crypto.createHash("md5").update(url).digest("hex");
    const screenshotPath = path.join(
      process.cwd(),
      "data",
      "screenshots",
      `${filename}.png`,
    );

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: "png",
    });

    return screenshotPath;
  }

  async extractMetadata(page, html) {
    const metadata = {};

    metadata.meta = await page.evaluate(() => {
      const meta = {};
      document.querySelectorAll("meta").forEach((tag) => {
        const name = tag.getAttribute("name") || tag.getAttribute("property");
        const content = tag.getAttribute("content");
        if (name && content) {
          meta[name] = content;
        }
      });
      return meta;
    });

    metadata.links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a"))
        .map((a) => a.href)
        .filter((href) => href && href.startsWith("http"));
    });

    return metadata;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info("Browser closed");
    }
  }
}

module.exports = new Crawler();
