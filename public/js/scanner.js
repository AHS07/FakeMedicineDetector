// DOM Elements
const scannerSection = document.getElementById('scannerSection');
const scanLink = document.getElementById('scanLink');
const startScanBtn = document.getElementById('startScanBtn');
const qrReader = document.getElementById('qr-reader');
const scanResult = document.getElementById('scan-result');

// Show/Hide Scanner
function showScanner(show) {
    scannerSection.style.display = show ? 'block' : 'none';
    if (!show) {
        stopScanner();
    }
}

// Initialize QR Scanner
let html5QrcodeScanner = null;

function initializeScanner() {
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: {width: 250, height: 250} }
        );
    }
    
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }
}

// QR Code Callbacks
function onScanSuccess(decodedText, decodedResult) {
    console.log('Code scanned = ', decodedText);
    stopScanner();
    
    // Display result
    scanResult.innerHTML = `
        <div class="card">
            <h3>Scan Result</h3>
            <p>Medicine ID: ${decodedText}</p>
            <button class="btn btn-primary" onclick="verifyMedicine('${decodedText}')">
                Verify Medicine
            </button>
        </div>
    `;
}

function onScanFailure(error) {
    // console.warn('QR code scan failed = ', error);
}

// Verify Medicine
async function verifyMedicine(medicineId) {
    try {
        // Get medicine details from Firestore
        const db = getFirestore();
        const medicineRef = doc(db, 'medicines', medicineId);
        const medicineDoc = await getDoc(medicineRef);

        if (medicineDoc.exists()) {
            const medicineData = medicineDoc.data();
            displayMedicineDetails(medicineData);
        } else {
            alert('Medicine not found in database!');
        }
    } catch (error) {
        console.error('Verification error:', error);
        alert('Failed to verify medicine: ' + error.message);
    }
}

// Display Medicine Details
function displayMedicineDetails(medicine) {
    scanResult.innerHTML = `
        <div class="card">
            <h3>Medicine Details</h3>
            <p><strong>Name:</strong> ${medicine.name}</p>
            <p><strong>Manufacturer:</strong> ${medicine.manufacturer}</p>
            <p><strong>Batch Number:</strong> ${medicine.batchNumber}</p>
            <p><strong>Manufacturing Date:</strong> ${new Date(medicine.mfgDate).toLocaleDateString()}</p>
            <p><strong>Expiry Date:</strong> ${new Date(medicine.expDate).toLocaleDateString()}</p>
            <p class="verification-status">✅ This medicine is verified as authentic</p>
            <button class="btn btn-primary" onclick="showScanner(true)">
                Scan Another
            </button>
        </div>
    `;
}

// Event Listeners
scanLink.addEventListener('click', (e) => {
    e.preventDefault();
    showScanner(true);
    initializeScanner();
});

startScanBtn.addEventListener('click', () => {
    showScanner(true);
    initializeScanner();
}); 