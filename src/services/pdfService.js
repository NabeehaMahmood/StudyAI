// backend/src/services/pdfService.js
// Extracts text from uploaded PDF files using pdf-parse

const fs = require('fs');
const pdfParse = require('pdf-parse');
const logger = require('../utils/logger');

/**
 * Extract text content from a PDF file.
 * @param {string} filePath - Absolute path to the PDF
 * @returns {Promise<{ text: string, pageCount: number }>}
 */
async function extractTextFromPDF(filePath) {
  const startTime = Date.now();

  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);

  const elapsed = Date.now() - startTime;
  logger.info(`PDF parsed: ${data.numpages} pages, ${data.text.length} chars in ${elapsed}ms`);

  return {
    text: data.text,
    pageCount: data.numpages,
  };
}

module.exports = { extractTextFromPDF };
