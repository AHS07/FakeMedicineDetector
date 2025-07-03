# Blockchain Integration for Medicine Verification

This document provides instructions for setting up and running the blockchain integration for the medicine verification system.

## Overview

The system uses an Ethereum blockchain (deployed on Ganache for development) to register and verify medicines. The integration includes:

- Smart contract for medicine and manufacturer management
- Python service for interacting with the blockchain
- Flask API endpoints for frontend integration
- Frontend JavaScript for user interactions

## Prerequisites

- Python 3.7+
- Node.js and npm
- Ganache (Ethereum development blockchain)
- Truffle (for smart contract deployment)
- Web3.py library

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install flask web3 python-dotenv

# Install Node.js dependencies
cd blockchain
npm install
```

### 2. Configure Environment

Create a `.env` file in the root of the project with the following variables:

```
FLASK_APP=app.py
FLASK_DEBUG=True
BLOCKCHAIN_URL=http://127.0.0.1:7545
BLOCKCHAIN_OWNER_PRIVATE_KEY=<your-private-key>
```

Replace `<your-private-key>` with the private key of the first account from Ganache.

### 3. Start Ganache

Start Ganache either through the GUI application or using the CLI:

```bash
ganache-cli -p 7545
```

### 4. Deploy Smart Contract

```bash
cd blockchain
truffle migrate --reset
```

This will deploy the smart contract to your local Ganache instance and create a `contract.json` file with the ABI and address.

### 5. Run the Application

```bash
flask run
```

Visit `http://localhost:5000/blockchain` to access the blockchain functionality.

## Usage Guide

### Manufacturer Registration and Verification

1. Navigate to the "Manufacturer" tab
2. Fill in the manufacturer registration form and submit
3. The owner account (first Ganache account) can verify manufacturers
4. Enter manufacturer's address and click "Check Status"
5. If unverified, click "Request Verification"

### Medicine Registration

1. Navigate to the "Register Medicine" tab
2. Fill in the medicine details (must be a verified manufacturer)
3. Submit the form to register the medicine on the blockchain

### Medicine Verification

1. Navigate to the "Verify Medicine" tab
2. Enter the medicine ID
3. View the verification results

## Troubleshooting

### Connection Issues

If you're having trouble connecting to Ganache, check:

1. Ganache is running on the correct port
2. The `BLOCKCHAIN_URL` in your `.env` file matches the Ganache URL
3. Your web3 configuration is correctly loading from environment variables

### Contract Deployment Issues

If the contract doesn't deploy correctly:

1. Check Truffle is installed globally: `npm install -g truffle`
2. Ensure Ganache is running before deployment
3. Verify `truffle-config.js` has the correct network settings

### Transaction Failures

If transactions fail:

1. Ensure the sending account has enough ETH for gas
2. Check if the sending account has the right permissions
3. Review the transaction parameters for validity

## Testing

Run the provided test scripts to verify your setup:

```bash
# Test blockchain connection
python test_blockchain.py

# Test integration with Flask
python test_integration.py
```

## Security Considerations

For production deployment:

1. Never store private keys in code or public repositories
2. Use a secure environment variable management system
3. Implement proper authentication and authorization
4. Consider using a secure Ethereum node provider
5. Implement additional input validation and error handling 