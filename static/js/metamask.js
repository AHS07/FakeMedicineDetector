/**
 * MetaMask integration for the Fake Medicine Detection System
 * This script handles connecting to MetaMask
 */

// Global variables
let web3;
let accounts = [];
let isConnected = false;

// Detect if MetaMask is installed
const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
};

// Connect to MetaMask
const connectMetaMask = async () => {
    if (!isMetaMaskInstalled()) {
        alert('MetaMask is not installed. Please install MetaMask to use this feature.');
        return;
    }
    
    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        console.log('Connected account:', account);
        
        // Update UI
        updateConnectButton(account);
        
        // Send wallet address to server
        await sendWalletAddressToServer(account);
        
        return account;
    } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        alert('Failed to connect to MetaMask. Please try again.');
    }
};

// Send wallet address to server
const sendWalletAddressToServer = async (walletAddress) => {
    try {
        const response = await fetch('/api/blockchain/connect-metamask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ wallet_address: walletAddress })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            console.error('Error sending wallet address to server:', data.error);
        }
    } catch (error) {
        console.error('Error sending wallet address to server:', error);
    }
};

// Disconnect from MetaMask
const disconnectMetaMask = async () => {
    try {
        // Send request to server to disconnect
        const response = await fetch('/api/blockchain/disconnect-metamask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Reset the UI
            resetConnectButton();
            console.log('Disconnected from MetaMask');
        } else {
            console.error('Error disconnecting from server:', data.error);
        }
    } catch (error) {
        console.error('Error disconnecting from MetaMask:', error);
    }
};

// Update UI for connected state
const updateConnectButton = (account) => {
    const connectButton = document.getElementById('metamask-connect');
    const disconnectButton = document.getElementById('metamask-disconnect');
    
    if (connectButton) connectButton.style.display = 'none';
    if (disconnectButton) disconnectButton.style.display = 'flex';
    
    // Update network info
    updateNetworkInfo();
};

// Reset UI for disconnected state
const resetConnectButton = () => {
    const connectButton = document.getElementById('metamask-connect');
    const disconnectButton = document.getElementById('metamask-disconnect');
    
    if (connectButton) connectButton.style.display = 'flex';
    if (disconnectButton) disconnectButton.style.display = 'none';
};

// Format address for display (0x1234...5678)
const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Update network information
const updateNetworkInfo = async () => {
    if (!isMetaMaskInstalled() || !window.ethereum) return;
    
    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const networkBadge = document.getElementById('network-badge');
        
        if (networkBadge) {
            let networkName = 'Unknown Network';
            
            // Map chain IDs to network names
            switch (chainId) {
                case '0x1':
                    networkName = 'Ethereum Mainnet';
                    break;
                case '0x3':
                    networkName = 'Ropsten Testnet';
                    break;
                case '0x4':
                    networkName = 'Rinkeby Testnet';
                    break;
                case '0x5':
                    networkName = 'Goerli Testnet';
                    break;
                case '0xaa36a7':
                    networkName = 'Sepolia Testnet';
                    break;
                case '0x539': // Usually Ganache defaults to this
                    networkName = 'Ganache Local';
                    break;
                default:
                    if (chainId === '0x' + Number(1337).toString(16)) {
                        networkName = 'Ganache Local';
                    } else {
                        networkName = `Chain ID: ${chainId}`;
                    }
            }
            
            networkBadge.textContent = networkName;
        }
    } catch (error) {
        console.error('Error getting network information:', error);
    }
};

// Add simple connect button to header if not present
function addConnectButtonIfMissing() {
    // Check if we need to add the connect button
    if (!document.getElementById('metamask-connect')) {
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            const connectButton = document.createElement('button');
            connectButton.id = 'metamask-connect';
            connectButton.innerHTML = '<i class="fas fa-plug"></i> Connect';
            
            // Insert before disconnect button
            const disconnectButton = document.getElementById('metamask-disconnect');
            if (disconnectButton) {
                headerRight.insertBefore(connectButton, disconnectButton);
            } else {
                headerRight.prepend(connectButton);
            }
            
            // Add event listener
            connectButton.addEventListener('click', connectMetaMask);
        }
    }
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add connect button if missing
    addConnectButtonIfMissing();
    
    // Set up button event listeners
    const connectButton = document.getElementById('metamask-connect');
    const disconnectButton = document.getElementById('metamask-disconnect');
    
    if (connectButton) {
        connectButton.addEventListener('click', connectMetaMask);
    }
    
    if (disconnectButton) {
        disconnectButton.addEventListener('click', disconnectMetaMask);
    }
    
    // Check if already connected
    checkMetaMaskConnection();
    
    // Set up event listeners for MetaMask
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                resetConnectButton(); // User disconnected
            } else {
                updateConnectButton(accounts[0]); // User switched accounts
                sendWalletAddressToServer(accounts[0]);
            }
        });
        
        window.ethereum.on('chainChanged', () => {
            updateNetworkInfo(); // Network changed
        });
    }
});

// Check if already connected to MetaMask
const checkMetaMaskConnection = async () => {
    if (!isMetaMaskInstalled()) return;
    
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            console.log('Already connected to MetaMask:', accounts[0]);
            updateConnectButton(accounts[0]);
        }
    } catch (error) {
        console.error('Error checking MetaMask connection:', error);
    }
};

// Make some functions available globally
window.MetaMask = {
    connect: connectMetaMask,
    disconnect: disconnectMetaMask,
    isConnected: async () => {
        if (!isMetaMaskInstalled()) return false;
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            return accounts.length > 0;
        } catch (error) {
            console.error('Error checking if connected:', error);
            return false;
        }
    }
}; 