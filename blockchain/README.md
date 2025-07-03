# Blockchain Component for Fake Medicine Detection System

This directory contains the blockchain component of the Fake Medicine Detection System, which uses Ethereum smart contracts to provide a secure and transparent way to verify the authenticity of medicines.

## Overview

The blockchain component provides:

- Secure registration of manufacturers
- Verification of manufacturer licenses
- Registration of medicines with verifiable data
- Authentication checking for medicines
- Reporting of potentially fake medicines
- Immutable audit trail of all operations

## Smart Contract Architecture

The main contract `MedicineRegistry.sol` implements:

- Manufacturer registration and verification
- Medicine registration with manufacturer verification
- Medicine verification by ID
- Fraud reporting system with threshold-based marking
- Robust security features including pausing, ownership management

## Development Setup

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Ganache (for local blockchain)
- Truffle (for development, testing and deployment)

### Installation

1. Install dependencies:
```bash
cd blockchain
npm install
```

2. Start Ganache:
```bash
# If installed globally
ganache

# Or use the Ganache app
```

3. Compile contracts:
```bash
npm run compile
```

4. Run tests:
```bash
npm test
```

5. Deploy to local network:
```bash
npm run migrate
```

## Configuration

The blockchain component can be configured through environment variables in the `.env` file at the project root:

```
# Blockchain Configuration
BLOCKCHAIN_URL=http://127.0.0.1:7545
BLOCKCHAIN_OWNER_PRIVATE_KEY=your_private_key_here
INFURA_PROJECT_ID=your_infura_project_id_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

## Deployment

### Test Networks

To deploy to a test network (e.g., Sepolia):

1. Update `.env` with your private key and Infura project ID
2. Run:
```bash
npm run migrate:sepolia
```

### Production Deployment

For production deployment:

1. Uncomment the mainnet configuration in `truffle-config.js`
2. Ensure private keys are securely stored
3. Run:
```bash
truffle migrate --network mainnet
```

## Integration with Web App

After deployment, the contract address and ABI are saved to `contract.json`. The Flask application uses this file to interact with the deployed contract.

## Security Considerations

This smart contract implements several security features:

- Input validation for all public methods
- Access control with ownership and authorized manufacturers
- Emergency pause functionality
- Secure ownership transfer
- Anti-fraud reporting system
- Prevention of duplicate reports

## Testing

The contract includes comprehensive unit tests for all functionality. Run the tests with:

```bash
npm test
```

For coverage reports:

```bash
npm run test:coverage
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 