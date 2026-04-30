const axios = require("axios");
const xml2js = require("xml2js");
require("dotenv").config();

const sendToTally = async (xmlData) => {
  const ports = [9999, 9000];
  let lastError = null;

  for (const port of ports) {
    const url = `http://127.0.0.1:${port}`;
    try {
      console.log("\n" + "=".repeat(50));
      console.log(`🚀 [PRO-DEBUG] SENDING TO TALLY AT ${url}:`);
      console.log(xmlData);
      console.log("=".repeat(50) + "\n");

      const response = await axios.post(url, xmlData, {
        headers: { "Content-Type": "text/xml" },
        timeout: 5000
      });

      // 🔥 SANITIZE XML (Remove invalid control characters and their numeric references)
      const sanitizedData = response.data.toString()
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g, "")
        .replace(/&#(x[0-9a-fA-F]+|[0-9]+);/g, (match, capture) => {
            const charCode = capture.startsWith('x') ? parseInt(capture.slice(1), 16) : parseInt(capture, 10);
            if ((charCode >= 0 && charCode <= 31 && charCode !== 9 && charCode !== 10 && charCode !== 13) || (charCode >= 127 && charCode <= 159)) {
                return "";
            }
            return match;
        });

      console.log("\n" + "-".repeat(50));
      console.log(`✅ [PRO-DEBUG] RESPONSE FROM PORT ${port}:`);
      console.log(sanitizedData);
      console.log("-".repeat(50) + "\n");

      return sanitizedData;
    } catch (err) {
      lastError = err;
      console.log(`⚠️  Port ${port} attempt failed: ${err.message}`);
    }
  }
  
  throw new Error(`Tally Connection Failed on all ports (9999, 9000). Last Error: ${lastError.message}`);
};

const getDataFromTally = async (xmlData) => {
    try {
        console.log("📤 Fetching from Tally (POST):\n", xmlData);
        const response = await axios.post(TALLY_URL, xmlData, {
            headers: { "Content-Type": "text/xml" }
        });
        console.log("📥 Raw Tally Response:\n", response.data.toString().slice(0, 200) + "...");
        const parser = new xml2js.Parser({ explicitArray: false });
        return await parser.parseStringPromise(response.data);
    } catch (err) {
        console.error("❌ Tally Fetch Error:", err.message);
        throw new Error("Failed to fetch data from Tally: " + err.message);
    }
};

module.exports = { sendToTally, getDataFromTally };
