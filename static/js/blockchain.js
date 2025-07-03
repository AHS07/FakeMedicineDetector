/**
 * Blockchain integration for the Fake Medicine Detection System
 * This script handles the frontend connection to the Ethereum blockchain
 * using Web3.js and MetaMask for user transactions.
 */

// Initialize Web3
let web3;
let medicineContract;
let userAccount;
const CONTRACT_ADDRESS = ''; // Will be filled from the server

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize blockchain connection
    await connectBlockchain();
    
    // Setup blockchain-related UI elements
    setupBlockchainUI();
});

// Connect to blockchain via MetaMask or other providers
async function connectBlockchain() {
    // Check if MetaMask is installed
    if (window.ethereum) {
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Create Web3 instance
            web3 = new Web3(window.ethereum);
            
            // Get user's Ethereum address
            const accounts = await web3.eth.getAccounts();
            userAccount = accounts[0];
            
            // Display user account
            const accountDisplay = document.getElementById('account-display');
            if (accountDisplay) {
                accountDisplay.textContent = userAccount;
                accountDisplay.classList.add('connected');
            }
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', function (accounts) {
                userAccount = accounts[0];
                if (accountDisplay) {
                    accountDisplay.textContent = userAccount || 'Not connected';
                    if (userAccount) {
                        accountDisplay.classList.add('connected');
                    } else {
                        accountDisplay.classList.remove('connected');
                    }
                }
            });
            
            // Fetch contract data from the server
            const response = await fetch('/api/blockchain/contract-info');
            const contractData = await response.json();
            
            if (contractData.success) {
                // Initialize contract
                medicineContract = new web3.eth.Contract(
                    contractData.abi,
                    contractData.address
                );
                
                // Store contract address for later use
                CONTRACT_ADDRESS = contractData.address;
                
                console.log('Blockchain connection successful');
                return true;
            } else {
                console.error('Failed to get contract info:', contractData.error);
                return false;
            }
            
        } catch (error) {
            console.error('Error connecting to blockchain:', error);
            return false;
        }
    } else {
        console.warn('MetaMask not installed');
        
        // Show MetaMask installation prompt
        const web3Status = document.getElementById('web3-status');
        if (web3Status) {
            web3Status.innerHTML = `
                <div class="alert alert-warning">
                    <p><strong>MetaMask not detected!</strong></p>
                    <p>To interact with the blockchain, please install 
                    <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</a>.</p>
                </div>
            `;
        }
        return false;
    }
}

// Set up UI elements related to blockchain functionality
function setupBlockchainUI() {
    // Register medicine with blockchain button
    const registerOnChainBtn = document.getElementById('register-on-chain');
    if (registerOnChainBtn) {
        registerOnChainBtn.addEventListener('click', async function() {
            if (!medicineContract) {
                alert('Blockchain connection not established');
                return;
            }
            
            try {
                const medicineForm = document.getElementById('medicineForm');
                const medicineId = document.getElementById('medicine-id').value;
                const name = document.getElementById('medicineName').value;
                const batchNumber = document.getElementById('batchNumber').value;
                const manufactureDate = new Date(document.getElementById('manufactureDate').value).getTime() / 1000;
                const expiryDate = new Date(document.getElementById('expiryDate').value).getTime() / 1000;
                const description = document.getElementById('description').value || '';
                
                // Show loading indicator
                const statusArea = document.getElementById('blockchain-status');
                if (statusArea) {
                    statusArea.innerHTML = '<p class="loading">Submitting to blockchain...</p>';
                }
                
                // Call contract method
                await medicineContract.methods.registerMedicine(
                    medicineId,
                    name,
                    batchNumber,
                    Math.floor(manufactureDate),
                    Math.floor(expiryDate),
                    description
                ).send({ from: userAccount });
                
                if (statusArea) {
                    statusArea.innerHTML = '<p class="success-text">Successfully registered on blockchain!</p>';
                }
                
                // Optional: Trigger server sync
                await fetch('/api/blockchain/sync-medicine', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ medicineId })
                });
                
            } catch (error) {
                console.error('Blockchain transaction error:', error);
                const statusArea = document.getElementById('blockchain-status');
                if (statusArea) {
                    statusArea.innerHTML = `<p class="error-text">Transaction failed: ${error.message}</p>`;
                }
            }
        });
    }
    
    // Report fake medicine button
    const reportFakeBtn = document.getElementById('report-fake');
    if (reportFakeBtn) {
        reportFakeBtn.addEventListener('click', async function() {
            if (!medicineContract) {
                alert('Blockchain connection not established');
                return;
            }
            
            const medicineId = document.getElementById('verified-medicine-id').value;
            if (!medicineId) {
                alert('No medicine ID to report');
                return;
            }
            
            try {
                // Show loading indicator
                const statusArea = document.getElementById('report-status');
                if (statusArea) {
                    statusArea.innerHTML = '<p class="loading">Submitting report to blockchain...</p>';
                }
                
                // Call contract method
                await medicineContract.methods.reportFakeMedicine(medicineId)
                    .send({ from: userAccount });
                
                if (statusArea) {
                    statusArea.innerHTML = '<p class="success-text">Successfully reported as fake!</p>';
                }
                
                // Refresh verification data
                await verifyMedicineOnChain(medicineId);
                
            } catch (error) {
                console.error('Blockchain transaction error:', error);
                const statusArea = document.getElementById('report-status');
                if (statusArea) {
                    statusArea.innerHTML = `<p class="error-text">Report failed: ${error.message}</p>`;
                }
            }
        });
    }
}

// Verify a medicine directly on the blockchain
async function verifyMedicineOnChain(medicineId) {
    if (!medicineContract) {
        console.error('Blockchain connection not established');
        return null;
    }
    
    try {
        // Call contract method
        const result = await medicineContract.methods.verifyMedicine(medicineId).call();
        
        // Format result
        return {
            isVerified: result.isVerified,
            isFakeReported: result.isFakeReported,
            medicineId: result.medicineId,
            name: result.name,
            batchNumber: result.batchNumber,
            manufacturerName: result.manufacturerName,
            manufacturingDate: new Date(result.manufacturingDate * 1000),
            expiryDate: new Date(result.expiryDate * 1000),
            reportCount: result.reportCount,
            description: result.description
        };
        
    } catch (error) {
        console.error('Error verifying medicine on blockchain:', error);
        return null;
    }
}

// Get manufacturer information from the blockchain
async function getManufacturerInfo(manufacturerAddress) {
    if (!medicineContract) {
        console.error('Blockchain connection not established');
        return null;
    }
    
    try {
        // Call contract method
        const result = await medicineContract.methods.getManufacturerInfo(manufacturerAddress).call();
        
        // Format result
        return {
            name: result.name,
            licenseNumber: result.licenseNumber,
            isVerified: result.isVerified,
            registrationDate: new Date(result.registrationDate * 1000)
        };
        
    } catch (error) {
        console.error('Error getting manufacturer info:', error);
        return null;
    }
}

// Helper function to convert Unix timestamp to readable date
function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
}

/**
 * blockchain.js - Frontend JavaScript for blockchain functionality
 * 
 * Provides functions to interact with the blockchain API endpoints
 */

// Utility functions for API calls
const fetchJson = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Blockchain Status
const checkBlockchainStatus = async () => {
  return await fetchJson('/api/blockchain/status');
};

// Manufacturer functions
const registerManufacturer = async (name, licenseNumber) => {
  return await fetchJson('/api/manufacturers/register', {
    method: 'POST',
    body: JSON.stringify({
      name: name,
      license_number: licenseNumber
    })
  });
};

const verifyManufacturer = async (address) => {
  return await fetchJson(`/api/manufacturers/verify/${address}`, {
    method: 'POST'
  });
};

const getManufacturerInfo = async (address) => {
  return await fetchJson(`/api/manufacturers/${address}`);
};

// Medicine functions
const registerMedicine = async (medicineData) => {
  return await fetchJson('/api/medicines/register', {
    method: 'POST',
    body: JSON.stringify(medicineData)
  });
};

const verifyMedicine = async (medicineId) => {
  return await fetchJson(`/api/medicines/verify/${medicineId}`);
};

const reportFakeMedicine = async (medicineId) => {
  return await fetchJson(`/api/medicines/report/${medicineId}`, {
    method: 'POST'
  });
};

// DOM interaction functions
document.addEventListener('DOMContentLoaded', () => {
  // Check blockchain connection status
  const statusElement = document.getElementById('blockchain-status');
  if (statusElement) {
    checkBlockchainStatus()
      .then(data => {
        statusElement.textContent = data.connected ? 'Connected' : 'Disconnected';
        statusElement.className = data.connected ? 'status-connected' : 'status-disconnected';
      })
      .catch(error => {
        statusElement.textContent = 'Error checking connection';
        statusElement.className = 'status-error';
      });
  }
  
  // Medicine registration form
  const medicineForm = document.getElementById('medicine-register-form');
  if (medicineForm) {
    medicineForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const formData = new FormData(medicineForm);
      const medicineData = {
        medicine_id: formData.get('medicine_id'),
        name: formData.get('name'),
        batch_number: formData.get('batch_number'),
        manufacturing_date: Math.floor(new Date(formData.get('manufacturing_date')).getTime() / 1000),
        expiry_date: Math.floor(new Date(formData.get('expiry_date')).getTime() / 1000),
        description: formData.get('description')
      };
      
      try {
        const result = await registerMedicine(medicineData);
        
        // Show success message
        const messageElement = document.getElementById('medicine-result');
        if (messageElement) {
          messageElement.textContent = `Medicine registered successfully. Transaction: ${result.tx_hash}`;
          messageElement.className = 'success-message';
        }
        
        // Reset form
        medicineForm.reset();
      } catch (error) {
        // Show error message
        const messageElement = document.getElementById('medicine-result');
        if (messageElement) {
          messageElement.textContent = `Error: ${error.message}`;
          messageElement.className = 'error-message';
        }
      }
    });
  }
  
  // Medicine verification form
  const verifyForm = document.getElementById('medicine-verify-form');
  if (verifyForm) {
    verifyForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const formData = new FormData(verifyForm);
      const medicineId = formData.get('medicine_id');
      
      try {
        const result = await verifyMedicine(medicineId);
        
        // Display medicine details
        const detailsElement = document.getElementById('medicine-details');
        if (detailsElement && result.success) {
          const medicine = result.medicine;
          
          // Format dates for display
          const mfgDate = new Date(medicine.manufacturingDate * 1000).toLocaleDateString();
          const expDate = new Date(medicine.expiryDate * 1000).toLocaleDateString();
          
          detailsElement.innerHTML = `
            <div class="medicine-detail ${medicine.isFakeReported ? 'fake-reported' : ''}">
              <h3>${medicine.name}</h3>
              <p><strong>ID:</strong> ${medicine.medicineId}</p>
              <p><strong>Batch:</strong> ${medicine.batchNumber}</p>
              <p><strong>Manufacturer:</strong> ${medicine.manufacturerName}</p>
              <p><strong>Manufacturing Date:</strong> ${mfgDate}</p>
              <p><strong>Expiry Date:</strong> ${expDate}</p>
              <p><strong>Description:</strong> ${medicine.description}</p>
              <p><strong>Verification Status:</strong> 
                <span class="${medicine.isVerified ? 'verified' : 'unverified'}">
                  ${medicine.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </p>
              ${medicine.isFakeReported ? 
                `<p class="fake-warning">This medicine has been reported as potentially fake ${medicine.reportCount} times.</p>` : 
                ''
              }
            </div>
          `;
        }
      } catch (error) {
        // Show error message
        const detailsElement = document.getElementById('medicine-details');
        if (detailsElement) {
          detailsElement.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
        }
      }
    });
  }
  
  // Report fake medicine button
  const reportButtons = document.querySelectorAll('.report-fake-btn');
  reportButtons.forEach(button => {
    button.addEventListener('click', async (event) => {
      const medicineId = button.getAttribute('data-medicine-id');
      
      if (confirm(`Are you sure you want to report medicine ${medicineId} as fake?`)) {
        try {
          const result = await reportFakeMedicine(medicineId);
          alert('Report submitted successfully.');
          // Refresh medicine details
          if (document.getElementById('medicine-verify-form')) {
            document.getElementById('medicine-verify-form').dispatchEvent(new Event('submit'));
          }
        } catch (error) {
          alert(`Error reporting medicine: ${error.message}`);
        }
      }
    });
  });
}); 