// Page load initialization
console.log('✅ Main.js loaded successfully!');
console.log('Medicine registration form found:', !!document.getElementById('medicineRegForm'));

// DOM Elements
const welcomeSection = document.getElementById('welcomeSection');
const medicineRegSection = document.getElementById('medicineRegSection');
const scannerSection = document.getElementById('scannerSection');
const authForms = document.getElementById('authForms');
const generateQRSection = document.getElementById('generateQR');
const registerLink = document.getElementById('registerLink');
const medicineRegForm = document.getElementById('medicineRegForm');
const learnMoreBtn = document.getElementById('learnMoreBtn');
const registrationResult = document.getElementById('registrationResult');
const generateQRLink = document.getElementById('generateQRLink');
const qrGenerateForm = document.getElementById('qrGenerateForm');
const findMedicineForm = document.getElementById('findMedicineForm');
const findTabBtn = document.getElementById('findTabBtn');
const registerTabBtn = document.getElementById('registerTabBtn');
const findTab = document.getElementById('findTab');
const registerTab = document.getElementById('registerTab');
const quickRegistrationForm = document.getElementById('quickRegistrationForm');
const licenseVerificationSection = document.getElementById('licenseVerificationSection');

// Navigation Event Listeners
document.getElementById('scanLink').addEventListener('click', () => showSection('scannerSection'));
// RegisterLink is handled in HTML for auth check
generateQRLink.addEventListener('click', () => showSection('generateQR'));
// LoginBtn is handled in index.html

// Show/Hide Sections
function showSection(sectionId) {
    // Hide all sections first
    const sections = ['welcomeSection', 'medicineRegSection', 'scannerSection', 'authForms', 'generateQR'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Show the requested section
    const element = document.getElementById(sectionId);
    if (element) {
        element.style.display = 'block';
    }
}

// Helper to debug any issues with the form
function debugForm() {
    console.log('Medicine form elements:');
    const inputs = ['medicineName', 'manufacturer', 'batchNumber', 'mfgDate', 'expDate'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        console.log(`${id}: ${el ? 'Found' : 'NOT FOUND'}, Value: ${el ? el.value : 'N/A'}`);
    });
    
    console.log('Form element:', medicineRegForm);
    console.log('Current user:', firebase.auth().currentUser);
}

// Medicine Registration
registerLink.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Register link clicked');
    // Check if user is logged in
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        alert('Please login to register a medicine');
        showAuthForms(true);
        return;
    }
    showSection('medicineRegSection');
});

// Medicine Registration Handler
medicineRegForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Medicine registration form submitted');
    debugForm();

    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('Please login first');
        }

        // Check if user is an industry account
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        if (!userDoc.exists || userDoc.data().accountType !== 'industry') {
            throw new Error('Only industry accounts can register medicines');
        }

        // Check if license is verified
        const userData = userDoc.data();
        if (!userData.license || userData.license.status !== 'approved') {
            throw new Error('Your license must be verified before registering medicines');
        }

        // Get form data
        const medicineData = {
            name: document.getElementById('medicineName').value,
            manufacturer: document.getElementById('manufacturer').value || userData.company,
            batchNumber: document.getElementById('batchNumber').value,
            mfgDate: document.getElementById('mfgDate').value,
            expDate: document.getElementById('expDate').value,
            registeredBy: user.uid,
            companyName: userData.company,
            licenseNumber: userData.license.number,
            registeredAt: new Date().toISOString(),
            status: 'active',
            // Blockchain fields (to be used later)
            blockchainTxHash: null,
            blockNumber: null,
            contractAddress: null
        };

        console.log('Registering medicine:', medicineData);

        // Save to Firestore
        const docRef = await firebase.firestore().collection('medicines').add(medicineData);
        console.log('Medicine registered with ID:', docRef.id);

        // Generate QR Code data with additional info
        const qrData = {
            id: docRef.id,
            name: medicineData.name,
            batchNumber: medicineData.batchNumber,
            manufacturer: medicineData.manufacturer,
            companyName: userData.company,
            licenseNumber: userData.license.number
        };

        // Convert to QR code
        const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrData));

        // Show success message
        registrationResult.innerHTML = `
            <div class="success-message">
                <h3>Medicine Registered Successfully! 🎉</h3>
                <div class="medicine-details">
                    <p><strong>Medicine ID:</strong> ${docRef.id}</p>
                    <p><strong>Name:</strong> ${medicineData.name}</p>
                    <p><strong>Manufacturer:</strong> ${medicineData.manufacturer}</p>
                    <p><strong>Batch Number:</strong> ${medicineData.batchNumber}</p>
                    <p><strong>Manufacturing Date:</strong> ${new Date(medicineData.mfgDate).toLocaleDateString()}</p>
                    <p><strong>Expiry Date:</strong> ${new Date(medicineData.expDate).toLocaleDateString()}</p>
                    <p><strong>Company:</strong> ${userData.company}</p>
                    <p><strong>License:</strong> ${userData.license.number}</p>
                    <p class="blockchain-status">⏳ Blockchain verification pending...</p>
                </div>
                <div class="qr-container">
                    <img src="${qrCodeData}" alt="Medicine QR Code">
                    <button onclick="downloadQR('${qrCodeData}', '${medicineData.name}')" class="btn btn-primary">
                        Download QR Code
                    </button>
                </div>
            </div>
        `;

        // Clear form
        e.target.reset();

    } catch (error) {
        console.error('Registration error:', error);
        registrationResult.innerHTML = `
            <div class="error-message">
                <h3>Registration Failed ❌</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
});

// Generate QR Code for Existing Medicine
qrGenerateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const medicineId = document.getElementById('medicineId').value.trim();
        if (!medicineId) {
            throw new Error('Medicine ID is required');
        }
        
        // Fetch medicine details
        const docRef = firebase.firestore().collection('medicines').doc(medicineId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            throw new Error('Medicine not found with this ID');
        }
        
        const medicineData = doc.data();
        
        // Generate QR Code data with additional info
        const qrData = {
            id: doc.id,
            name: medicineData.name,
            batchNumber: medicineData.batchNumber,
            manufacturer: medicineData.manufacturer
        };
        
        // Convert to QR code
        const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrData));
        
        // Display the result
        document.getElementById('qrGenerateResult').innerHTML = `
            <div class="success-message">
                <h3>QR Code Generated Successfully</h3>
                <div class="medicine-details">
                    <p><strong>Medicine ID:</strong> ${doc.id}</p>
                    <p><strong>Name:</strong> ${medicineData.name}</p>
                    <p><strong>Manufacturer:</strong> ${medicineData.manufacturer}</p>
                    <p><strong>Batch Number:</strong> ${medicineData.batchNumber}</p>
                    <p><strong>Manufacturing Date:</strong> ${new Date(medicineData.mfgDate).toLocaleDateString()}</p>
                    <p><strong>Expiry Date:</strong> ${new Date(medicineData.expDate).toLocaleDateString()}</p>
                </div>
                <div class="qr-container">
                    <img src="${qrCodeData}" alt="Medicine QR Code">
                    <button onclick="downloadQR('${qrCodeData}', '${medicineData.name}')" class="btn btn-primary">
                        Download QR Code
                    </button>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('QR Generation error:', error);
        document.getElementById('qrGenerateResult').innerHTML = `
            <div class="error-message">
                <h3>QR Generation Failed ❌</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
});

// Find Medicine by Details
findMedicineForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const name = document.getElementById('findMedicineName').value.trim();
        const manufacturer = document.getElementById('findManufacturer').value.trim();
        const batchNumber = document.getElementById('findBatchNumber').value.trim();
        
        if (!name && !manufacturer && !batchNumber) {
            throw new Error('Please enter at least one search criteria');
        }
        
        // Build the query
        let query = firebase.firestore().collection('medicines');
        
        if (name) {
            query = query.where('name', '==', name);
        }
        if (manufacturer) {
            query = query.where('manufacturer', '==', manufacturer);
        }
        if (batchNumber) {
            query = query.where('batchNumber', '==', batchNumber);
        }
        
        // Execute the query
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            throw new Error('No medicines found matching your criteria');
        }
        
        // Display results
        let resultsHTML = '<div class="search-results"><h3>Search Results</h3>';
        
        snapshot.forEach(doc => {
            const medicine = doc.data();
            resultsHTML += `
                <div class="medicine-item">
                    <h4>${medicine.name}</h4>
                    <p><strong>ID:</strong> ${doc.id}</p>
                    <p><strong>Manufacturer:</strong> ${medicine.manufacturer}</p>
                    <p><strong>Batch Number:</strong> ${medicine.batchNumber}</p>
                    <button onclick="generateQRForMedicine('${doc.id}')" class="btn btn-primary">
                        Generate QR Code
                    </button>
                </div>
            `;
        });
        
        resultsHTML += '</div>';
        document.getElementById('findMedicineResult').innerHTML = resultsHTML;
        
    } catch (error) {
        console.error('Find Medicine error:', error);
        document.getElementById('findMedicineResult').innerHTML = `
            <div class="error-message">
                <h3>Search Failed ❌</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
});

// Generate QR for medicine found in search
window.generateQRForMedicine = async function(medicineId) {
    document.getElementById('medicineId').value = medicineId;
    qrGenerateForm.dispatchEvent(new Event('submit'));
    window.scrollTo(0, document.getElementById('qrGenerateResult').offsetTop);
};

// Download QR Code
window.downloadQR = function(dataUrl, medicineName) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${medicineName.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Learn More Button
learnMoreBtn.addEventListener('click', () => {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
    });
});

// Add some CSS for the QR code container
const style = document.createElement('style');
style.textContent = `
    .qr-code-container {
        text-align: center;
        margin: 20px 0;
    }
    .qr-code-container img {
        max-width: 200px;
        margin-bottom: 10px;
    }
`;
document.head.appendChild(style);

// Initialize Firebase Auth State Observer
firebase.auth().onAuthStateChanged((user) => {
    console.log('Auth state changed:', user ? 'logged in' : 'logged out');
    if (user) {
        // User is signed in
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('registerLink').style.display = 'block';
    } else {
        // User is signed out
        document.getElementById('loginBtn').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('registerLink').style.display = 'none';
        showSection('welcomeSection');
    }
});

// Tab Switching
findTabBtn.addEventListener('click', () => {
    findTabBtn.classList.add('active');
    registerTabBtn.classList.remove('active');
    findTab.style.display = 'block';
    registerTab.style.display = 'none';
});

registerTabBtn.addEventListener('click', () => {
    registerTabBtn.classList.add('active');
    findTabBtn.classList.remove('active');
    registerTab.style.display = 'block';
    findTab.style.display = 'none';
});

// Quick Registration Form Handler
quickRegistrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Quick registration form submitted');

    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('Please login first');
        }

        // Check if user is an industry account
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        if (!userDoc.exists || userDoc.data().accountType !== 'industry') {
            throw new Error('Only industry accounts can register medicines');
        }

        // Check if license is verified
        const userData = userDoc.data();
        if (!userData.license || userData.license.status !== 'approved') {
            throw new Error('Your license must be verified before registering medicines');
        }

        // Get form data
        const medicineData = {
            name: document.getElementById('quickMedicineName').value,
            manufacturer: document.getElementById('quickManufacturer').value || userData.company,
            batchNumber: document.getElementById('quickBatchNumber').value,
            mfgDate: document.getElementById('quickMfgDate').value,
            expDate: document.getElementById('quickExpDate').value,
            registeredBy: user.uid,
            companyName: userData.company,
            licenseNumber: userData.license.number,
            registeredAt: new Date().toISOString(),
            status: 'active',
            // Blockchain fields (to be used later)
            blockchainTxHash: null,
            blockNumber: null,
            contractAddress: null
        };

        console.log('Quick registering medicine:', medicineData);

        // Save to Firestore
        const docRef = await firebase.firestore().collection('medicines').add(medicineData);
        console.log('Medicine registered with ID:', docRef.id);

        // Generate QR Code data with additional info
        const qrData = {
            id: docRef.id,
            name: medicineData.name,
            batchNumber: medicineData.batchNumber,
            manufacturer: medicineData.manufacturer,
            companyName: userData.company,
            licenseNumber: userData.license.number
        };

        // Convert to QR code
        const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrData));

        // Show success message
        document.getElementById('qrGenerateResult').innerHTML = `
            <div class="success-message">
                <h3>Medicine Registered Successfully! 🎉</h3>
                <div class="medicine-details">
                    <p><strong>Medicine ID:</strong> ${docRef.id}</p>
                    <p><strong>Name:</strong> ${medicineData.name}</p>
                    <p><strong>Manufacturer:</strong> ${medicineData.manufacturer}</p>
                    <p><strong>Batch Number:</strong> ${medicineData.batchNumber}</p>
                    <p><strong>Manufacturing Date:</strong> ${new Date(medicineData.mfgDate).toLocaleDateString()}</p>
                    <p><strong>Expiry Date:</strong> ${new Date(medicineData.expDate).toLocaleDateString()}</p>
                    <p><strong>Company:</strong> ${userData.company}</p>
                    <p><strong>License:</strong> ${userData.license.number}</p>
                    <p class="blockchain-status">⏳ Blockchain verification pending...</p>
                </div>
                <div class="qr-container">
                    <img src="${qrCodeData}" alt="Medicine QR Code">
                    <button onclick="downloadQR('${qrCodeData}', '${medicineData.name}')" class="btn btn-primary">
                        Download QR Code
                    </button>
                </div>
            </div>
        `;

        // Clear form
        e.target.reset();

    } catch (error) {
        console.error('Quick registration error:', error);
        document.getElementById('qrGenerateResult').innerHTML = `
            <div class="error-message">
                <h3>Registration Failed ❌</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
});

// For testing purposes: Auto-approve the license
window.approveMyLicense = async function() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('Please login first');
        }
        
        await firebase.firestore().collection('users').doc(user.uid).update({
            'license.status': 'approved',
            'license.verified': true
        });
        
        alert('Your license has been approved for testing purposes.');
        location.reload();
    } catch (error) {
        console.error('Error approving license:', error);
        alert('Error: ' + error.message);
    }
}; 