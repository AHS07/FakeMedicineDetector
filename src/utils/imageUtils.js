const Jimp = require('jimp');
const path = require('path');
const { createWorker } = require('tesseract.js');
const { ocrConfig } = require('../config/aiConfig');

// Process and save uploaded image
async function processImage(imageBuffer, filename) {
    try {
        const image = await Jimp.read(imageBuffer);
        const processedImage = image
            .resize(800, 800)
            .quality(90);
        
        const outputPath = path.join(process.env.UPLOAD_PATH, filename);
        await processedImage.writeAsync(outputPath);
        return outputPath;
    } catch (error) {
        console.error('Error processing image:', error);
        throw error;
    }
}

// Extract text from image using OCR
async function extractTextFromImage(imagePath) {
    const worker = await createWorker();
    try {
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        await worker.setParameters({
            tessedit_ocr_engine_mode: ocrConfig.oem,
            tessedit_pageseg_mode: ocrConfig.psm,
        });

        const { data: { text } } = await worker.recognize(imagePath);
        await worker.terminate();
        return text;
    } catch (error) {
        await worker.terminate();
        console.error('OCR Error:', error);
        throw error;
    }
}

// Extract batch number and expiry date from text
function extractMedicineInfo(text) {
    const batchMatch = text.match(/Batch\s*No\.?\s*:?\s*([A-Z0-9]+)/i);
    const expiryMatch = text.match(/Expiry\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
    
    return {
        batchNumber: batchMatch ? batchMatch[1] : null,
        expiryDate: expiryMatch ? expiryMatch[1] : null,
        fullText: text
    };
}

module.exports = {
    processImage,
    extractTextFromImage,
    extractMedicineInfo
}; 