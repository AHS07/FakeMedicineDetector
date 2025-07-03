// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const medicineForm = document.getElementById('medicineForm');
const verifySection = document.getElementById('verifySection');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const showLoginLink = document.getElementById('showLogin');
const showRegisterLink = document.getElementById('showRegister');

const registerAccountType = document.getElementById('registerAccountType');
const industryFields = document.getElementById('industryFields');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    // Show/Hide Forms
    loginBtn.addEventListener('click', () => showForm('loginForm'));
    registerBtn.addEventListener('click', () => showForm('registerForm'));
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showForm('loginForm');
    });
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showForm('registerForm');
    });

    // Toggle Industry Fields
    registerAccountType.addEventListener('change', () => {
        industryFields.style.display = 
            registerAccountType.value === 'industry' ? 'block' : 'none';
    });

    // Form Submissions
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
    document.getElementById('medicineFormElement').addEventListener('submit', handleMedicineRegistration);
    document.getElementById('scanQR').addEventListener('click', handleQRScan);
});

// Show/Hide Forms Function
function showForm(formId) {
    // Hide all forms
    [loginForm, registerForm, medicineForm, verifySection].forEach(form => {
        if (form) form.style.display = 'none';
    });
    
    // Show selected form
    const selectedForm = document.getElementById(formId);
    if (selectedForm) selectedForm.style.display = 'block';
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const accountType = document.getElementById('loginAccountType').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, accountType })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Show appropriate form based on account type
            if (accountType === 'industry') {
                showForm('medicineForm');
            } else {
                showForm('verifySection');
            }
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Handle Registration
async function handleRegister(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        accountType: document.getElementById('registerAccountType').value
    };

    if (formData.accountType === 'industry') {
        formData.company = document.getElementById('companyName').value;
        formData.licenseNumber = document.getElementById('licenseNumber').value;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Registration successful! Please login.');
            showForm('loginForm');
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

// Handle Medicine Registration
async function handleMedicineRegistration(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('medicineName').value,
        manufacturer: document.getElementById('manufacturer').value,
        batchNumber: document.getElementById('batchNumber').value,
        manufactureDate: document.getElementById('manufactureDate').value,
        expiryDate: document.getElementById('expiryDate').value
    };

    try {
        const response = await fetch('/api/medicine/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Medicine registered successfully!');
            document.getElementById('medicineFormElement').reset();
        } else {
            alert(data.error || 'Medicine registration failed');
        }
    } catch (error) {
        console.error('Medicine registration error:', error);
        alert('Medicine registration failed. Please try again.');
    }
}

// Handle QR Code Scanning
async function handleQRScan() {
    const fileInput = document.getElementById('qrInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a QR code image');
        return;
    }

    const formData = new FormData();
    formData.append('qr_code', file);

    try {
        const response = await fetch('/api/medicine/verify', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (response.ok) {
            displayVerificationResult(data.medicine);
        } else {
            alert(data.error || 'Verification failed');
        }
    } catch (error) {
        console.error('QR verification error:', error);
        alert('Verification failed. Please try again.');
    }
}

// Display Verification Result
function displayVerificationResult(medicine) {
    const resultDiv = document.getElementById('verificationResult');
    resultDiv.innerHTML = `
        <h3>Verification Result</h3>
        <p><strong>Name:</strong> ${medicine.name}</p>
        <p><strong>Manufacturer:</strong> ${medicine.manufacturer}</p>
        <p><strong>Batch Number:</strong> ${medicine.batchNumber}</p>
        <p><strong>Manufacture Date:</strong> ${medicine.manufactureDate}</p>
        <p><strong>Expiry Date:</strong> ${medicine.expiryDate}</p>
        <p><strong>Status:</strong> <span class="success">Verified ✓</span></p>
    `;
} 