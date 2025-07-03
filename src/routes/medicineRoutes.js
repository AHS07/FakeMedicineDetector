const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const { 
    registerMedicine, 
    verifyMedicine, 
    getMedicineDetails,
    getVerificationHistory
} = require('../controllers/medicineController');
const multer = require('multer');

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

// Register new medicine (manufacturers only)
router.post('/register', 
    auth, 
    checkRole('manufacturer'), 
    registerMedicine
);

// Verify medicine (distributors and manufacturers)
router.post('/verify/:medicineId', 
    auth, 
    checkRole('manufacturer', 'distributor'), 
    upload.single('image'), 
    verifyMedicine
);

// Get medicine details (all authenticated users)
router.get('/:medicineId', 
    auth, 
    getMedicineDetails
);

// Get verification history
router.get('/:medicineId/history', 
    auth, 
    getVerificationHistory
);

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File is too large. Maximum size is 5MB'
            });
        }
    }
    next(error);
});

module.exports = router; 