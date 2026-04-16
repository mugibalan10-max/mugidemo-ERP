const axios = require("axios");
const xml2js = require("xml2js");
require("dotenv").config();

const TALLY_URL = process.env.TALLY_URL || "http://localhost:9000";

const sendToTally = async (xmlData) => {
  try {
    const response = await axios.post(TALLY_URL, xmlData, {
      headers: { "Content-Type": "text/xml" }
    });
    return response.data;
  } catch (err) {
    console.error("Tally Client Error:", err.message);
    throw new Error("Tally Connection Failed: Ensure Tally is running on " + TALLY_URL);
  }
};

const getDataFromTally = async (xmlData) => {
    try {
        const response = await axios.post(TALLY_URL, xmlData, {
            headers: { "Content-Type": "text/xml" }
        });
        const parser = new xml2js.Parser({ explicitArray: false });
        return await parser.parseStringPromise(response.data);
    } catch (err) {
        console.error("Tally Fetch Error:", err.message);
        throw new Error("Failed to fetch data from Tally");
    }
};

module.exports = { sendToTally, getDataFromTally };
