document.addEventListener('DOMContentLoaded', function() {
    const medicineRegForm = document.getElementById('medicineRegForm');
    const qrCodeDisplay = document.getElementById('qrCodeDisplay');

    // Medicine Registration Handler
    medicineRegForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/medicine/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: document.getElementById('medicineName').value,
                    manufacturer: document.getElementById('manufacturer').value,
                    batchNumber: document.getElementById('batchNumber').value,
                    manufactureDate: document.getElementById('manufactureDate').value,
                    expiryDate: document.getElementById('expiryDate').value
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to register medicine');
            }

            // Display QR Code
            qrCodeDisplay.innerHTML = `
                <h3>QR Code Generated</h3>
                <img src="${data.medicine.qrCodeUrl}" alt="Medicine QR Code">
                <p>Medicine ID: ${data.medicine.id}</p>
                <p>Name: ${data.medicine.name}</p>
                <p>Manufacturer: ${data.medicine.manufacturer}</p>
                <p>Batch: ${data.medicine.batchNumber}</p>
            `;

            // Clear form
            medicineRegForm.reset();
            
        } catch (error) {
            alert(error.message);
        }
    });

    // Medicine Verification Handler
    window.verifyMedicine = async function(medicineId) {
        try {
            const response = await fetch('/api/medicine/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: medicineId })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify medicine');
            }

            const medicine = data.medicine;
            const scanResult = document.getElementById('scanResult');
            
            scanResult.innerHTML = `
                <div class="result-card ${medicine.verified ? 'verified' : 'unverified'}">
                    <h3>${medicine.verified ? 'Authentic Medicine' : 'Unverified Medicine'}</h3>
                    <p>Name: ${medicine.name}</p>
                    <p>Manufacturer: ${medicine.manufacturer}</p>
                    <p>Batch Number: ${medicine.batchNumber}</p>
                    <p>Manufacture Date: ${new Date(medicine.manufactureDate).toLocaleDateString()}</p>
                    <p>Expiry Date: ${new Date(medicine.expiryDate).toLocaleDateString()}</p>
                    <p>Status: ${medicine.verified ? 'Verified by Manufacturer' : 'Not Verified by Manufacturer'}</p>
                </div>
            `;
            
        } catch (error) {
            const scanResult = document.getElementById('scanResult');
            scanResult.innerHTML = `
                <div class="result-card error">
                    <h3>Error</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    };
});

// Medicine verification functionality
function verifyMedicine(medicineData) {
    fetch('/api/medicine/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(medicineData)
    })
    .then(response => response.json())
    .then(data => {
        const resultDiv = document.getElementById('scanResult');
        if (data.success) {
            const medicine = data.medicine;
            resultDiv.innerHTML = `
                <div class="success-message">
                    <h3>Medicine Verified ✓</h3>
                    <p><strong>${medicine.name}</strong> by ${medicine.manufacturer}</p>
                    <p>Batch: ${medicine.batch_number}</p>
                    <p>Manufacture Date: ${new Date(medicine.manufacture_date).toLocaleDateString()}</p>
                    <p>Expiry Date: ${new Date(medicine.expiry_date).toLocaleDateString()}</p>
                </div>
            `;

            // Add to verification history
            addToHistory(medicine);
        } else {
            showError(data.error || 'Failed to verify medicine');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showError('Failed to verify medicine');
    });
}

function showError(message) {
    const resultDiv = document.getElementById('scanResult');
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="error-message">
                <h3>Verification Failed ✗</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

function addToHistory(medicine) {
    const historyList = document.getElementById('historyList');
    if (historyList) {
        const template = document.getElementById('verificationTemplate');
        if (template) {
            const clone = template.content.cloneNode(true);
            
            clone.querySelector('.verification-status').classList.add('verified');
            clone.querySelector('.verification-status').textContent = 'Verified ✓';
            clone.querySelector('.medicine-name').textContent = medicine.name;
            clone.querySelector('.manufacturer').textContent = medicine.manufacturer;
            clone.querySelector('.batch-number').textContent = medicine.batch_number;
            clone.querySelector('.verification-time').textContent = new Date().toLocaleString();

            historyList.prepend(clone);
        }
    }
} 