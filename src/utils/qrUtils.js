const QRCode = require('qrcode');

// Generate QR code for medicine
async function generateMedicineQR(medicineData) {
    try {
        const qrData = {
            id: medicineData._id,
            name: medicineData.name,
            manufacturer: medicineData.manufacturer,
            batchNumber: medicineData.batchNumber,
            manufactureDate: medicineData.manufactureDate,
            expiryDate: medicineData.expiryDate
        };

        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 300
        });

        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}

// Parse QR code data
function parseQRData(qrData) {
    try {
        return JSON.parse(qrData);
    } catch (error) {
        console.error('Error parsing QR data:', error);
        throw new Error('Invalid QR code data');
    }
}

module.exports = {
    generateMedicineQR,
    parseQRData
}; 