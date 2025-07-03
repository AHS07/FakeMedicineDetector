/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation, and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * https://trufflesuite.com/docs/truffle/reference/configuration
 *
 * Hands-off deployment with Infura
 * --------------------------------
 *
 * Do you have a complex application that requires lots of transactions to deploy?
 * Use this approach to make deployment a breeze 🏖️:
 *
 * Infura deployment needs a wallet provider (like @truffle/hdwallet-provider)
 * to sign transactions before they're sent to a remote public node.
 * Infura accounts are available for free at 🔍: https://infura.io/register
 *
 * You'll need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. You can store your secrets 🤐 in a .env file.
 * In your project root, run `$ npm install dotenv`.
 * Create .env (which should be .gitignored) and declare your MNEMONIC
 * and Infura PROJECT_ID variables inside.
 * For example, your .env file will have the following structure:
 *
 * MNEMONIC = <Your 12 phrase mnemonic>
 * PROJECT_ID = <Your Infura project id>
 *
 * Deployment with Truffle Dashboard (Recommended for best security practice)
 * --------------------------------------------------------------------------
 *
 * Are you concerned about security and minimizing rekt status 🤔?
 * Use this method for best security:
 *
 * Truffle Dashboard lets you review transactions in detail, and leverages
 * MetaMask for signing, so there's no need to copy-paste your mnemonic.
 * More details can be found at 🔎:
 *
 * https://trufflesuite.com/docs/truffle/getting-started/using-the-truffle-dashboard/
 */

require('dotenv').config({ path: '../.env' });
// If you have a mnemonic or private key, uncomment the following lines
// const HDWalletProvider = require('@truffle/hdwallet-provider');
// const { PRIVATE_KEY, INFURA_PROJECT_ID } = process.env;

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a managed Ganache instance for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache, geth, or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 7545,            // Standard Ethereum port (default: none)
      network_id: "5777",    // Any network (default: none)
      gas: 6721975,          // Gas limit used for deploys
      gasPrice: 20000000000, // 20 gwei
    },
    
    // For running tests
    test: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      gas: 6721975,
    },
    
    // For testnets (uncomment when needed)
    // sepolia: {
    //   provider: () => new HDWalletProvider(
    //     PRIVATE_KEY,
    //     `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`
    //   ),
    //   network_id: 11155111,
    //   gas: 5500000,
    //   gasPrice: 20000000000,
    //   confirmations: 2,
    //   timeoutBlocks: 200,
    //   skipDryRun: true
    // },
    
    // Polygon Mumbai testnet
    // mumbai: {
    //   provider: () => new HDWalletProvider(
    //     PRIVATE_KEY,
    //     `https://polygon-mumbai.infura.io/v3/${INFURA_PROJECT_ID}`
    //   ),
    //   network_id: 80001,
    //   gas: 5500000,
    //   gasPrice: 20000000000,
    //   confirmations: 2,
    //   timeoutBlocks: 200,
    //   skipDryRun: true
    // },
    
    // Mainnet configuration (IMPORTANT: Only use when ready for production)
    // mainnet: {
    //   provider: () => new HDWalletProvider(
    //     PRIVATE_KEY,
    //     `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`
    //   ),
    //   network_id: 1,
    //   gas: 5500000,
    //   gasPrice: 50000000000, // 50 gwei - adjust based on current gas prices
    //   confirmations: 2,
    //   timeoutBlocks: 200,
    //   skipDryRun: false
    // }
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    timeout: 100000,
    reporter: 'spec'
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.0",      // Fetch exact version from solc-bin
      settings: {          
        optimizer: {
          enabled: true,   // Enable optimizer for production code
          runs: 200        // Optimize for how many times you intend to run the code
        }
      }
    }
  },
  
  // Custom gas reporter for monitoring gas costs
  // plugins: ["truffle-plugin-verify", "solidity-coverage"],
  
  // API keys for etherscan verification (uncomment when needed)
  // api_keys: {
  //   etherscan: process.env.ETHERSCAN_API_KEY
  // },
};
