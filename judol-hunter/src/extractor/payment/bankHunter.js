/**
 * Bank Account Hunter
 */

const logger = require("../../logger");

class BankHunter {
  constructor() {
    this.bankPatterns = {
      BCA: /(?:BCA|Bank Central Asia)[:\s]*([0-9]{8,10})/gi,
      BNI: /(?:BNI|Bank Negara Indonesia)[:\s]*([0-9]{8,12})/gi,
      BRI: /(?:BRI|Bank Rakyat Indonesia)[:\s]*([0-9]{10,15})/gi,
      Mandiri: /(?:Mandiri|Bank Mandiri)[:\s]*([0-9]{10,13})/gi,
      CIMB: /(?:CIMB|CIMB Niaga)[:\s]*([0-9]{8,14})/gi,
      Danamon: /(?:Danamon|Bank Danamon)[:\s]*([0-9]{8,12})/gi,
      Permata: /(?:Permata|Bank Permata)[:\s]*([0-9]{8,12})/gi,
      Maybank: /(?:Maybank|Bank Maybank)[:\s]*([0-9]{8,12})/gi,
    };
  }

  async hunt(page) {
    logger.debug("Hunting for bank accounts...");

    const accounts = [];
    const content = await page.content();

    for (const [bank, pattern] of Object.entries(this.bankPatterns)) {
      const matches = content.matchAll(pattern);

      for (const match of matches) {
        const accountNumber = this.cleanAccountNumber(match[1]);

        accounts.push({
          bank_name: bank,
          account_number: accountNumber,
          confidence: this.calculateConfidence(match[0], accountNumber),
          source: "html",
        });
      }
    }

    return accounts;
  }

  cleanAccountNumber(number) {
    return number.replace(/[^0-9]/g, "");
  }

  calculateConfidence(context, number) {
    let confidence = 70;

    if (number.length >= 8 && number.length <= 15) {
      confidence += 10;
    }
    if (context.toLowerCase().includes("transfer")) {
      confidence += 10;
    }
    if (context.toLowerCase().includes("deposit")) {
      confidence += 10;
    }

    return Math.min(confidence, 100);
  }
}

module.exports = new BankHunter();
