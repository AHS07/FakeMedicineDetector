const MedicineRegistry = artifacts.require("MedicineRegistry");
const { expectRevert, time } = require('@openzeppelin/test-helpers');

contract("MedicineRegistry", accounts => {
  const owner = accounts[0];
  const manufacturer1 = accounts[1];
  const manufacturer2 = accounts[2];
  const user1 = accounts[3];
  const user2 = accounts[4];
  const user3 = accounts[5];
  
  let medicineRegistry;
  
  beforeEach(async () => {
    medicineRegistry = await MedicineRegistry.new({ from: owner });
  });
  
  describe("Contract Initialization", () => {
    it("should set the owner correctly", async () => {
      const contractOwner = await medicineRegistry.owner();
      assert.equal(contractOwner, owner, "Owner not set correctly");
    });
    
    it("should start with the contract unpaused", async () => {
      const isPaused = await medicineRegistry.paused();
      assert.equal(isPaused, false, "Contract should start unpaused");
    });
    
    it("should have zero medicines and manufacturers initially", async () => {
      const medicineCount = await medicineRegistry.getMedicineCount();
      const manufacturerCount = await medicineRegistry.getVerifiedManufacturerCount();
      
      assert.equal(medicineCount, 0, "Initial medicine count should be zero");
      assert.equal(manufacturerCount, 0, "Initial verified manufacturer count should be zero");
    });
  });
  
  describe("Manufacturer Registration and Verification", () => {
    it("should register a manufacturer", async () => {
      await medicineRegistry.registerManufacturer("Test Manufacturer", "LICENSE123", { from: manufacturer1 });
      
      const manufacturerInfo = await medicineRegistry.getManufacturerInfo(manufacturer1);
      assert.equal(manufacturerInfo.name, "Test Manufacturer", "Manufacturer name not set correctly");
      assert.equal(manufacturerInfo.licenseNumber, "LICENSE123", "License number not set correctly");
      assert.equal(manufacturerInfo.isVerified, false, "Manufacturer should not be verified initially");
    });
    
    it("should not allow duplicate manufacturer registration", async () => {
      await medicineRegistry.registerManufacturer("Test Manufacturer", "LICENSE123", { from: manufacturer1 });
      
      await expectRevert(
        medicineRegistry.registerManufacturer("Duplicate Test", "LICENSE456", { from: manufacturer1 }),
        "Manufacturer already registered"
      );
    });
    
    it("should not allow empty manufacturer name or license", async () => {
      await expectRevert(
        medicineRegistry.registerManufacturer("", "LICENSE123", { from: manufacturer1 }),
        "Name cannot be empty"
      );
      
      await expectRevert(
        medicineRegistry.registerManufacturer("Test Manufacturer", "", { from: manufacturer1 }),
        "License number cannot be empty"
      );
    });
    
    it("should verify a manufacturer", async () => {
      await medicineRegistry.registerManufacturer("Test Manufacturer", "LICENSE123", { from: manufacturer1 });
      await medicineRegistry.verifyManufacturer(manufacturer1, { from: owner });
      
      const manufacturerInfo = await medicineRegistry.getManufacturerInfo(manufacturer1);
      assert.equal(manufacturerInfo.isVerified, true, "Manufacturer should be verified");
      
      const manufacturerCount = await medicineRegistry.getVerifiedManufacturerCount();
      assert.equal(manufacturerCount, 1, "Verified manufacturer count should be incremented");
    });
    
    it("should not allow non-owners to verify manufacturers", async () => {
      await medicineRegistry.registerManufacturer("Test Manufacturer", "LICENSE123", { from: manufacturer1 });
      
      await expectRevert(
        medicineRegistry.verifyManufacturer(manufacturer1, { from: manufacturer2 }),
        "Only owner can perform this action"
      );
    });
    
    it("should not verify unregistered manufacturers", async () => {
      await expectRevert(
        medicineRegistry.verifyManufacturer(manufacturer1, { from: owner }),
        "Manufacturer not registered"
      );
    });
    
    it("should not verify already verified manufacturers", async () => {
      await medicineRegistry.registerManufacturer("Test Manufacturer", "LICENSE123", { from: manufacturer1 });
      await medicineRegistry.verifyManufacturer(manufacturer1, { from: owner });
      
      await expectRevert(
        medicineRegistry.verifyManufacturer(manufacturer1, { from: owner }),
        "Manufacturer already verified"
      );
    });
  });
  
  describe("Medicine Registration", () => {
    beforeEach(async () => {
      // Register and verify manufacturer1
      await medicineRegistry.registerManufacturer("Test Manufacturer", "LICENSE123", { from: manufacturer1 });
      await medicineRegistry.verifyManufacturer(manufacturer1, { from: owner });
      
      // Register manufacturer2 but don't verify
      await medicineRegistry.registerManufacturer("Unverified Manufacturer", "LICENSE456", { from: manufacturer2 });
    });
    
    it("should register a medicine by verified manufacturer", async () => {
      const now = Math.floor(Date.now() / 1000);
      await medicineRegistry.registerMedicine(
        "MED12345",
        "Test Medicine",
        "BATCH001",
        now - 86400, // 1 day ago
        now + 31536000, // 1 year from now
        "Test description",
        { from: manufacturer1 }
      );
      
      const medicineInfo = await medicineRegistry.verifyMedicine("MED12345");
      assert.equal(medicineInfo.name, "Test Medicine", "Medicine name not set correctly");
      assert.equal(medicineInfo.batchNumber, "BATCH001", "Batch number not set correctly");
      assert.equal(medicineInfo.manufacturerName, "Test Manufacturer", "Manufacturer name not set correctly");
      assert.equal(medicineInfo.isVerified, true, "Medicine should be verified");
      assert.equal(medicineInfo.isFakeReported, false, "Medicine should not be marked as fake");
      assert.equal(medicineInfo.reportCount, 0, "Initial report count should be zero");
      
      const medicineCount = await medicineRegistry.getMedicineCount();
      assert.equal(medicineCount, 1, "Medicine count should be incremented");
    });
    
    it("should not allow unverified manufacturers to register medicines", async () => {
      const now = Math.floor(Date.now() / 1000);
      await expectRevert(
        medicineRegistry.registerMedicine(
          "MED12345",
          "Test Medicine",
          "BATCH001",
          now - 86400,
          now + 31536000,
          "Test description",
          { from: manufacturer2 }
        ),
        "Only authorized manufacturers can perform this action"
      );
    });
    
    it("should not allow duplicate medicine IDs", async () => {
      const now = Math.floor(Date.now() / 1000);
      await medicineRegistry.registerMedicine(
        "MED12345",
        "Test Medicine",
        "BATCH001",
        now - 86400,
        now + 31536000,
        "Test description",
        { from: manufacturer1 }
      );
      
      await expectRevert(
        medicineRegistry.registerMedicine(
          "MED12345",
          "Duplicate Medicine",
          "BATCH002",
          now - 86400,
          now + 31536000,
          "Another description",
          { from: manufacturer1 }
        ),
        "Medicine ID already exists"
      );
    });
    
    it("should not allow invalid date ranges", async () => {
      const now = Math.floor(Date.now() / 1000);
      
      // Expiry date before manufacturing date
      await expectRevert(
        medicineRegistry.registerMedicine(
          "MED12345",
          "Test Medicine",
          "BATCH001",
          now,
          now - 86400, // 1 day before manufacturing date
          "Test description",
          { from: manufacturer1 }
        ),
        "Expiry date must be after manufacturing date"
      );
      
      // Invalid manufacturing date
      await expectRevert(
        medicineRegistry.registerMedicine(
          "MED12345",
          "Test Medicine",
          "BATCH001",
          0,
          now + 31536000,
          "Test description",
          { from: manufacturer1 }
        ),
        "Invalid manufacturing date"
      );
    });
    
    it("should not allow empty required fields", async () => {
      const now = Math.floor(Date.now() / 1000);
      
      // Empty medicine ID
      await expectRevert(
        medicineRegistry.registerMedicine(
          "",
          "Test Medicine",
          "BATCH001",
          now - 86400,
          now + 31536000,
          "Test description",
          { from: manufacturer1 }
        ),
        "Medicine ID cannot be empty"
      );
      
      // Empty name
      await expectRevert(
        medicineRegistry.registerMedicine(
          "MED12345",
          "",
          "BATCH001",
          now - 86400,
          now + 31536000,
          "Test description",
          { from: manufacturer1 }
        ),
        "Name cannot be empty"
      );
      
      // Empty batch number
      await expectRevert(
        medicineRegistry.registerMedicine(
          "MED12345",
          "Test Medicine",
          "",
          now - 86400,
          now + 31536000,
          "Test description",
          { from: manufacturer1 }
        ),
        "Batch number cannot be empty"
      );
    });
  });
  
  describe("Medicine Verification and Reporting", () => {
    beforeEach(async () => {
      // Register and verify manufacturer
      await medicineRegistry.registerManufacturer("Test Manufacturer", "LICENSE123", { from: manufacturer1 });
      await medicineRegistry.verifyManufacturer(manufacturer1, { from: owner });
      
      // Register a medicine
      const now = Math.floor(Date.now() / 1000);
      await medicineRegistry.registerMedicine(
        "MED12345",
        "Test Medicine",
        "BATCH001",
        now - 86400,
        now + 31536000,
        "Test description",
        { from: manufacturer1 }
      );
    });
    
    it("should verify a medicine correctly", async () => {
      const medicine = await medicineRegistry.verifyMedicine("MED12345");
      
      assert.equal(medicine.medicineId, "MED12345", "Medicine ID mismatch");
      assert.equal(medicine.name, "Test Medicine", "Medicine name mismatch");
      assert.equal(medicine.isVerified, true, "Medicine should be verified");
    });
    
    it("should not verify non-existent medicines", async () => {
      await expectRevert(
        medicineRegistry.verifyMedicine("NONEXISTENT"),
        "Medicine not found"
      );
    });
    
    it("should allow reporting fake medicines", async () => {
      await medicineRegistry.reportFakeMedicine("MED12345", { from: user1 });
      
      const medicine = await medicineRegistry.verifyMedicine("MED12345");
      assert.equal(medicine.reportCount, 1, "Report count should be incremented");
      assert.equal(medicine.isFakeReported, false, "Medicine should not be marked as fake yet");
    });
    
    it("should mark medicine as fake after 3 reports", async () => {
      await medicineRegistry.reportFakeMedicine("MED12345", { from: user1 });
      await medicineRegistry.reportFakeMedicine("MED12345", { from: user2 });
      await medicineRegistry.reportFakeMedicine("MED12345", { from: user3 });
      
      const medicine = await medicineRegistry.verifyMedicine("MED12345");
      assert.equal(medicine.reportCount, 3, "Report count should be 3");
      assert.equal(medicine.isFakeReported, true, "Medicine should be marked as fake");
    });
    
    it("should not allow duplicate reports from the same user", async () => {
      await medicineRegistry.reportFakeMedicine("MED12345", { from: user1 });
      
      await expectRevert(
        medicineRegistry.reportFakeMedicine("MED12345", { from: user1 }),
        "You have already reported this medicine"
      );
    });
  });
  
  describe("Medicine Updates", () => {
    beforeEach(async () => {
      // Register and verify manufacturer
      await medicineRegistry.registerManufacturer("Test Manufacturer", "LICENSE123", { from: manufacturer1 });
      await medicineRegistry.verifyManufacturer(manufacturer1, { from: owner });
      
      // Register a medicine
      const now = Math.floor(Date.now() / 1000);
      await medicineRegistry.registerMedicine(
        "MED12345",
        "Test Medicine",
        "BATCH001",
        now - 86400,
        now + 31536000,
        "Test description",
        { from: manufacturer1 }
      );
    });
    
    it("should allow manufacturers to update their medicines", async () => {
      const now = Math.floor(Date.now() / 1000);
      await medicineRegistry.updateMedicine(
        "MED12345",
        "Updated Medicine Name",
        "BATCH001-REV",
        now - 43200, // 12 hours ago
        now + 63072000, // 2 years from now
        "Updated description",
        { from: manufacturer1 }
      );
      
      const medicine = await medicineRegistry.verifyMedicine("MED12345");
      assert.equal(medicine.name, "Updated Medicine Name", "Medicine name not updated");
      assert.equal(medicine.batchNumber, "BATCH001-REV", "Batch number not updated");
      assert.equal(medicine.description, "Updated description", "Description not updated");
    });
    
    it("should not allow non-manufacturers to update medicines", async () => {
      const now = Math.floor(Date.now() / 1000);
      await expectRevert(
        medicineRegistry.updateMedicine(
          "MED12345",
          "Unauthorized Update",
          "BATCH001-HACK",
          now - 43200,
          now + 63072000,
          "Unauthorized description",
          { from: user1 }
        ),
        "Only the original manufacturer can update"
      );
    });
    
    it("should validate date ranges when updating", async () => {
      const now = Math.floor(Date.now() / 1000);
      
      // Expiry date before manufacturing date
      await expectRevert(
        medicineRegistry.updateMedicine(
          "MED12345",
          "Updated Medicine",
          "BATCH001-REV",
          now,
          now - 86400, // Before manufacturing date
          "Updated description",
          { from: manufacturer1 }
        ),
        "Expiry date must be after manufacturing date"
      );
    });
  });
  
  describe("Contract Administration", () => {
    it("should allow owner to pause and unpause the contract", async () => {
      await medicineRegistry.pause({ from: owner });
      let isPaused = await medicineRegistry.paused();
      assert.equal(isPaused, true, "Contract should be paused");
      
      await medicineRegistry.unpause({ from: owner });
      isPaused = await medicineRegistry.paused();
      assert.equal(isPaused, false, "Contract should be unpaused");
    });
    
    it("should not allow non-owners to pause or unpause", async () => {
      await expectRevert(
        medicineRegistry.pause({ from: user1 }),
        "Only owner can perform this action"
      );
      
      await medicineRegistry.pause({ from: owner });
      
      await expectRevert(
        medicineRegistry.unpause({ from: user1 }),
        "Only owner can perform this action"
      );
    });
    
    it("should not allow operations when contract is paused", async () => {
      await medicineRegistry.pause({ from: owner });
      
      await expectRevert(
        medicineRegistry.registerManufacturer("Test Manufacturer", "LICENSE123", { from: manufacturer1 }),
        "Contract is paused"
      );
    });
    
    it("should allow ownership transfer", async () => {
      await medicineRegistry.transferOwnership(user1, { from: owner });
      
      // Pending owner should be set
      const pendingOwner = await medicineRegistry.pendingOwner();
      assert.equal(pendingOwner, user1, "Pending owner not set correctly");
      
      // Original owner should still be the owner
      let currentOwner = await medicineRegistry.owner();
      assert.equal(currentOwner, owner, "Owner should not change until acceptance");
      
      // Accept ownership
      await medicineRegistry.acceptOwnership({ from: user1 });
      
      // Check new owner
      currentOwner = await medicineRegistry.owner();
      assert.equal(currentOwner, user1, "Ownership not transferred correctly");
    });
    
    it("should not allow non-pending-owners to accept ownership", async () => {
      await medicineRegistry.transferOwnership(user1, { from: owner });
      
      await expectRevert(
        medicineRegistry.acceptOwnership({ from: user2 }),
        "Only pending owner can accept ownership"
      );
    });
  });
}); 