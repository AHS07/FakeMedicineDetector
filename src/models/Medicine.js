const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    manufacturer: {
        type: String,
        required: true,
        trim: true
    },
    batchNumber: {
        type: String,
        required: true,
        unique: true
    },
    manufactureDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    qrCode: {
        type: String,
        unique: true
    },
    imageUrl: {
        type: String
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    aiVerificationScore: {
        type: Number,
        min: 0,
        max: 1
    },
    ocrData: {
        batchNumber: String,
        expiryDate: String,
        extractedText: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
medicineSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Medicine', medicineSchema); 