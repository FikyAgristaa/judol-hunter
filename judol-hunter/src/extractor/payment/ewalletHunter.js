/**
 * E-Wallet Hunter
 */

const logger = require("../../logger");

class EwalletHunter {
  constructor() {
    this.ewalletPatterns = {
      OVO: /(?:OVO|ovo)[:\s]*([0-9]{10,14})/gi,
      DANA: /(?:DANA|dana)[:\s]*([0-9]{10,14})/gi,
      GoPay: /(?:GoPay|gopay|Go-Pay)[:\s]*([0-9]{10,14})/gi,
      LinkAja: /(?:LinkAja|linkaja)[:\s]*([0-9]{10,14})/gi,
      ShopeePay: /(?:ShopeePay|shopeepay|spay)[:\s]*([0-9]{10,14})/gi,
    };
  }

  async hunt(page) {
    logger.debug("Hunting for e-wallet accounts...");

    const wallets = [];
    const content = await page.content();

    for (const [wallet, pattern] of Object.entries(this.ewalletPatterns)) {
      const matches = content.matchAll(pattern);

      for (const match of matches) {
        const number = this.cleanNumber(match[1]);

        wallets.push({
          ewallet_type: wallet.toLowerCase(),
          ewallet_number: number,
          confidence: this.calculateConfidence(match[0], number),
          source: "html",
        });
      }
    }

    const qris = await this.huntQRIS(page);
    wallets.push(...qris);

    return wallets;
  }

  cleanNumber(number) {
    return number.replace(/[^0-9]/g, "");
  }

  calculateConfidence(context, number) {
    let confidence = 75;

    if (number.length >= 10 && number.length <= 14) {
      confidence += 15;
    }
    if (context.toLowerCase().includes("pembayaran")) {
      confidence += 5;
    }
    if (context.toLowerCase().includes("via")) {
      confidence += 5;
    }

    return Math.min(confidence, 100);
  }

  async huntQRIS(page) {
    const qrisData = [];

    try {
      const qrisImages = await page.evaluate(() => {
        const images = [];
        document.querySelectorAll("img").forEach((img) => {
          const src = img.src.toLowerCase();
          if (src.includes("qris") || src.includes("qrcode")) {
            images.push({
              src: img.src,
              alt: img.alt,
              width: img.width,
              height: img.height,
            });
          }
        });
        return images;
      });

      for (const img of qrisImages) {
        qrisData.push({
          ewallet_type: "qris",
          qris_data: img.src,
          confidence: 80,
          source: "image",
          metadata: img,
        });
      }
    } catch (error) {
      logger.error("Error hunting QRIS:", error);
    }

    return qrisData;
  }
}

module.exports = new EwalletHunter();
