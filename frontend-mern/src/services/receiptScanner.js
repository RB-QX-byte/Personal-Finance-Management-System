import Tesseract from 'tesseract.js';
import { scanReceipt as aiScanReceipt } from './aiService';

/**
 * Receipt scanning service
 * Uses Tesseract.js for OCR and AI for data extraction
 */

/**
 * Scan receipt image and extract transaction data
 * @param {File|string} imageFile - Image file or base64 data URL
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Extracted transaction data
 */
export const scanReceiptImage = async (imageFile, onProgress = null) => {
  try {
    // Step 1: OCR processing with Tesseract
    const ocrResult = await performOCR(imageFile, onProgress);

    if (!ocrResult || !ocrResult.text) {
      throw new Error('Failed to extract text from receipt');
    }

    // Step 2: AI extraction using backend
    const extractedData = await aiScanReceipt(ocrResult.text);

    return {
      success: true,
      ocrText: ocrResult.text,
      confidence: ocrResult.confidence,
      extractedData: extractedData.data,
      rawOCR: ocrResult
    };
  } catch (error) {
    console.error('Receipt scan error:', error);
    throw error;
  }
};

/**
 * Perform OCR on image using Tesseract.js
 * @param {File|string} image - Image file or data URL
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} OCR result with text and confidence
 */
export const performOCR = async (image, onProgress = null) => {
  try {
    const result = await Tesseract.recognize(
      image,
      'eng',
      {
        logger: onProgress ? (m) => {
          if (m.status === 'recognizing text') {
            onProgress(m.progress);
          }
        } : undefined
      }
    );

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words,
      lines: result.data.lines
    };
  } catch (error) {
    console.error('OCR error:', error);
    throw error;
  }
};

/**
 * Validate image file before scanning
 * @param {File} file - Image file to validate
 * @returns {Object} Validation result {valid: boolean, error: string}
 */
export const validateReceiptImage = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.'
    };
  }

  return { valid: true, error: null };
};

/**
 * Convert File to base64 data URL
 * @param {File} file - Image file
 * @returns {Promise<string>} Base64 data URL
 */
export const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Preprocess image before OCR (enhance contrast, resize, etc.)
 * @param {File} file - Original image file
 * @returns {Promise<string>} Processed image data URL
 */
export const preprocessImage = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;

      img.onload = () => {
        // Create canvas for image processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Resize if too large (max 2000px width)
        const maxWidth = 2000;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Enhance contrast (simple approach)
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Increase contrast
        const factor = 1.2;
        const intercept = 128 * (1 - factor);

        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i] * factor + intercept;     // Red
          data[i + 1] = data[i + 1] * factor + intercept; // Green
          data[i + 2] = data[i + 2] * factor + intercept; // Blue
        }

        ctx.putImageData(imageData, 0, 0);

        // Convert to data URL
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = reject;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Quick scan with preprocessing for better accuracy
 * @param {File} file - Receipt image file
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Extracted transaction data
 */
export const quickScan = async (file, onProgress = null) => {
  try {
    // Validate first
    const validation = validateReceiptImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Preprocess for better OCR
    if (onProgress) onProgress(0.1);
    const processedImage = await preprocessImage(file);

    if (onProgress) onProgress(0.2);

    // Perform OCR and extraction
    return await scanReceiptImage(processedImage, (progress) => {
      if (onProgress) {
        // Scale progress from 0.2 to 1.0
        onProgress(0.2 + progress * 0.8);
      }
    });
  } catch (error) {
    console.error('Quick scan error:', error);
    throw error;
  }
};

/**
 * Extract specific fields from OCR text (fallback if AI fails)
 * @param {string} text - OCR extracted text
 * @returns {Object} Extracted fields
 */
export const extractFieldsFromText = (text) => {
  const result = {
    merchant: null,
    amount: null,
    date: null,
    items: []
  };

  // Extract amount (look for currency patterns)
  const amountPattern = /(?:[$€£¥₹]|USD|EUR|GBP|JPY|INR)\s*(\d+[.,]\d{2})/gi;
  const amounts = text.match(amountPattern);
  if (amounts && amounts.length > 0) {
    // Usually the largest amount is the total
    const numbers = amounts.map(a => parseFloat(a.replace(/[^0-9.]/g, '')));
    result.amount = Math.max(...numbers);
  }

  // Extract date (various formats)
  const datePattern = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}/g;
  const dates = text.match(datePattern);
  if (dates && dates.length > 0) {
    result.date = dates[0];
  }

  // Try to extract merchant name (usually in first few lines)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    result.merchant = lines[0].trim();
  }

  return result;
};

export default {
  scanReceiptImage,
  performOCR,
  validateReceiptImage,
  fileToDataURL,
  preprocessImage,
  quickScan,
  extractFieldsFromText
};
