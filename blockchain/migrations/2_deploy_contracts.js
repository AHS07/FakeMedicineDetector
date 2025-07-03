const fs = require('fs');
const path = require('path');
const MedicineRegistry = artifacts.require("MedicineRegistry");

module.exports = async function(deployer) {
  await deployer.deploy(MedicineRegistry);
  const instance = await MedicineRegistry.deployed();

  // Prepare contract data (ABI and address)
  const contractData = {
    abi: MedicineRegistry.abi,
    address: instance.address
  };

  // Save to blockchain/contract.json (corrected path)
  const outputPath = path.resolve(__dirname, '..', 'contract.json');
  fs.writeFileSync(outputPath, JSON.stringify(contractData, null, 2));
  console.log("✅ Contract ABI and address saved to blockchain/contract.json");
};
