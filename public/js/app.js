// Global variables
let currentUser = null;
let API_URL = '';

// Get API URL from the server
async function getApiUrl() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        API_URL = data.apiUrl;
    } catch (error) {
        // Fallback to default URL if server config endpoint is not available
        const port = window.location.port || '3000';
        API_URL = `${window.location.protocol}//${window.location.hostname}:${port}/api`;
    }
}

// Initialize app
async function initializeApp() {
    await getApiUrl();
    const token = localStorage.getItem('token');
    if (token) {
        await fetchUserProfile(token);
    }
}

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const medicineForm = document.getElementById('medicineForm');
const verificationForm = document.getElementById('verificationForm');
const authMessage = document.getElementById('authMessage');
const mainContent = document.getElementById('mainContent');
const manufacturerSection = document.getElementById('manufacturerSection');
const verificationResults = document.getElementById('verificationResults');

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            handleLoginSuccess(result);
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Error logging in');
    }
});

// Register Form Handler
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
        company: formData.get('company')
    };

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            handleLoginSuccess(result);
            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error registering user');
    }
});

// Medicine Registration Form Handler
medicineForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(medicineForm);
    const data = {
        name: formData.get('name'),
        manufacturer: formData.get('manufacturer'),
        batchNumber: formData.get('batchNumber'),
        manufactureDate: formData.get('manufactureDate'),
        expiryDate: formData.get('expiryDate')
    };

    try {
        const response = await fetch(`${API_URL}/medicines/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            alert('Medicine registered successfully');
            medicineForm.reset();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Medicine registration error:', error);
        alert('Error registering medicine');
    }
});

// Medicine Verification Form Handler
verificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(verificationForm);
    const medicineId = formData.get('medicineId');
    const imageFile = formData.get('image');

    try {
        // First, get medicine details
        const detailsResponse = await fetch(`${API_URL}/medicines/${medicineId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!detailsResponse.ok) {
            throw new Error('Medicine not found');
        }

        const medicineDetails = await detailsResponse.json();

        // Create form data for verification
        const verificationData = new FormData();
        verificationData.append('image', imageFile);

        // Verify medicine
        const verifyResponse = await fetch(`${API_URL}/medicines/verify/${medicineId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: verificationData
        });

        const verificationResult = await verifyResponse.json();
        displayVerificationResults(medicineDetails, verificationResult);
    } catch (error) {
        console.error('Verification error:', error);
        alert('Error verifying medicine');
    }
});

// Utility Functions
function handleLoginSuccess(data) {
    localStorage.setItem('token', data.token);
    currentUser = data.user;
    updateUIForUser();
    bootstrap.Modal.getInstance(document.getElementById('loginModal'))?.hide();
}

function updateUIForUser() {
    document.getElementById('loginNav').classList.add('d-none');
    document.getElementById('registerNav').classList.add('d-none');
    document.getElementById('logoutNav').classList.remove('d-none');
    authMessage.classList.add('d-none');
    mainContent.classList.remove('d-none');

    if (currentUser.role === 'manufacturer') {
        manufacturerSection.classList.remove('d-none');
    } else {
        manufacturerSection.classList.add('d-none');
    }
}

async function fetchUserProfile(token) {
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUIForUser();
        } else {
            localStorage.removeItem('token');
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        localStorage.removeItem('token');
    }
}

function displayVerificationResults(medicine, verificationResult) {
    const resultsDiv = document.getElementById('verificationResults');
    const nameElement = document.getElementById('medicineName');
    const statusElement = document.getElementById('verificationStatus');
    const detailsElement = document.getElementById('medicineDetails');

    nameElement.textContent = medicine.name;
    statusElement.textContent = `Status: ${verificationResult.medicine.verificationStatus}`;
    statusElement.className = verificationResult.medicine.verificationStatus === 'verified' 
        ? 'verification-success' 
        : 'verification-failed';

    detailsElement.innerHTML = `
        <div class="medicine-details">
            <p><strong>Manufacturer:</strong> ${medicine.manufacturer}</p>
            <p><strong>Batch Number:</strong> ${medicine.batchNumber}</p>
            <p><strong>Manufacture Date:</strong> ${new Date(medicine.manufactureDate).toLocaleDateString()}</p>
            <p><strong>Expiry Date:</strong> ${new Date(medicine.expiryDate).toLocaleDateString()}</p>
            <p><strong>AI Verification Score:</strong> ${(verificationResult.medicine.aiVerificationScore * 100).toFixed(2)}%</p>
        </div>
    `;

    if (medicine.qrCode) {
        const qrImage = document.createElement('img');
        qrImage.src = medicine.qrCode;
        qrImage.className = 'qr-code';
        detailsElement.appendChild(qrImage);
    }

    resultsDiv.classList.remove('d-none');
}

// Logout Handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    currentUser = null;
    location.reload();
}); 