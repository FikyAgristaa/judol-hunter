/**
 * Google Dorking Engine
 */

const axios = require("axios");
const { JSDOM } = require("jsdom");
const logger = require("../logger");

class GoogleDork {
  constructor() {
    this.userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    ];

    this.queries = [
      'inurl:?id= "slot gacor"',
      'intitle:"judi online" "deposit pulsa"',
      '"bonus new member 100%" "slot"',
      'site:.id "slot gacor"',
      'site:.id "judi online terpercaya"',
      'site:.id "bandar togel"',
      '"deposit via dana" "slot"',
      '"withdraw ovo" "judi"',
      '"cashback 100%" "slot"',
      'inurl:/?p= "slot online"',
    ];
  }

  async search() {
    const allUrls = [];

    for (const query of this.queries) {
      try {
        logger.debug(`Searching: ${query}`);
        const urls = await this.executeSearch(query);
        allUrls.push(...urls);
        await this.sleep(2000);
      } catch (error) {
        logger.error(`Error searching ${query}:`, error.message);
      }
    }

    return [...new Set(allUrls)];
  }

  async executeSearch(query) {
    const urls = [];
    const userAgent =
      this.userAgents[Math.floor(Math.random() * this.userAgents.length)];

    try {
      const response = await axios.get("https://www.google.com/search", {
        params: { q: query, num: 50 },
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html",
          "Accept-Language": "en-US,en;q=0.5",
        },
        timeout: 10000,
      });

      const dom = new JSDOM(response.data);
      const links = dom.window.document.querySelectorAll("a");

      links.forEach((link) => {
        const href = link.href;
        if (href && href.startsWith("http") && !href.includes("google.com")) {
          urls.push(href);
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 429) {
        logger.warn("Rate limited, waiting...");
        await this.sleep(60000);
      } else {
        throw error;
      }
    }

    return urls;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new GoogleDork();
