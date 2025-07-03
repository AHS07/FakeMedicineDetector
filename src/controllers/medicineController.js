const Medicine = require('../models/Medicine');
const { processImage, extractTextFromImage, extractMedicineInfo } = require('../utils/imageUtils');
const { generateMedicineQR } = require('../utils/qrUtils');
const imageVerifier = require('../ai/imageVerification');
const path = require('path');

// Register new medicine
const registerMedicine = async (req, res) => {
    try {
        const {
            name,
            manufacturer,
            batchNumber,
            manufactureDate,
            expiryDate
        } = req.body;

        // Check if medicine with batch number already exists
        const existingMedicine = await Medicine.findOne({ batchNumber });
        if (existingMedicine) {
            return res.status(400).json({ message: 'Medicine with this batch number already exists' });
        }

        // Create new medicine instance
        const medicine = new Medicine({
            name,
            manufacturer,
            batchNumber,
            manufactureDate,
            expiryDate
        });

        // Generate QR code
        const qrCode = await generateMedicineQR(medicine);
        medicine.qrCode = qrCode;

        // Save medicine
        await medicine.save();

        res.status(201).json({
            message: 'Medicine registered successfully',
            medicine
        });
    } catch (error) {
        console.error('Error registering medicine:', error);
        res.status(500).json({ message: 'Error registering medicine', error: error.message });
    }
};

// Verify medicine using AI and OCR
const verifyMedicine = async (req, res) => {
    try {
        const { medicineId } = req.params;
        const imageFile = req.file;

        if (!imageFile) {
            return res.status(400).json({ message: 'No image provided' });
        }

        // Find medicine
        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        // Process and save image
        const processedImagePath = await processImage(
            imageFile.buffer,
            `${medicineId}-${Date.now()}${path.extname(imageFile.originalname)}`
        );

        // Extract text using OCR
        const extractedText = await extractTextFromImage(processedImagePath);
        const { batchNumber, expiryDate } = extractMedicineInfo(extractedText);

        // Verify image using AI
        const aiVerification = await imageVerifier.verifyImage(processedImagePath);

        // Update medicine with verification results
        medicine.ocrData = {
            batchNumber,
            expiryDate,
            extractedText
        };

        medicine.aiVerificationScore = aiVerification.score;
        medicine.verificationStatus = aiVerification.isAuthentic ? 'verified' : 'rejected';

        await medicine.save();

        res.json({
            message: 'Medicine verification completed',
            medicine,
            verificationDetails: {
                aiScore: aiVerification.score,
                ocrMatch: {
                    batchNumber: batchNumber === medicine.batchNumber,
                    expiryDate: expiryDate === medicine.expiryDate.toISOString().split('T')[0]
                }
            }
        });
    } catch (error) {
        console.error('Error verifying medicine:', error);
        res.status(500).json({ message: 'Error verifying medicine', error: error.message });
    }
};

// Get medicine details
const getMedicineDetails = async (req, res) => {
    try {
        const { medicineId } = req.params;
        const medicine = await Medicine.findById(medicineId);

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        res.json(medicine);
    } catch (error) {
        console.error('Error fetching medicine details:', error);
        res.status(500).json({ message: 'Error fetching medicine details', error: error.message });
    }
};

// Get verification history
const getVerificationHistory = async (req, res) => {
    try {
        const { medicineId } = req.params;
        const medicine = await Medicine.findById(medicineId)
            .select('verificationHistory')
            .sort('-verificationHistory.verifiedAt');

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        res.json(medicine.verificationHistory);
    } catch (error) {
        console.error('Error fetching verification history:', error);
        res.status(500).json({ message: 'Error fetching verification history', error: error.message });
    }
};

module.exports = {
    registerMedicine,
    verifyMedicine,
    getMedicineDetails,
    getVerificationHistory
}; 