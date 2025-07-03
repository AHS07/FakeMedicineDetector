// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MedicineRegistry
 * @dev A contract for registering and verifying medicines and manufacturers
 */
contract MedicineRegistry {

    struct Medicine {
        string medicineId;
        string name;
        string batchNumber;
        string manufacturerName;
        uint manufacturingDate;
        uint expiryDate;
        address manufacturer;
        bool isVerified;
        bool isFakeReported;
        uint reportCount;
        string description;
        uint registrationTimestamp;
    }

    struct Manufacturer {
        string name;
        string licenseNumber;
        bool isVerified;
        uint registrationDate;
        bool exists;
    }

    // Main mappings for data storage
    mapping(string => Medicine) private medicines;
    mapping(address => Manufacturer) private manufacturers;
    mapping(address => bool) private authorizedManufacturers;
    
    // Additional mappings for reporting and data validation
    mapping(string => mapping(address => bool)) private medicineReporters;
    mapping(string => bool) private registeredMedicineIds;
    
    // Contract administration
    address public owner;
    address public pendingOwner;
    bool public paused = false;
    
    // Medicine stats
    uint public medicineCount = 0;
    uint public verifiedManufacturerCount = 0;
    
    // Events
    event MedicineRegistered(string medicineId, string name, address manufacturer);
    event FakeMedicineReported(string medicineId, address reporter);
    event ManufacturerRegistered(address manufacturer, string name);
    event ManufacturerVerified(address manufacturer);
    event OwnershipTransferInitiated(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ContractPaused(address by);
    event ContractUnpaused(address by);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAuthorizedManufacturer() {
        require(authorizedManufacturers[msg.sender], "Only authorized manufacturers can perform this action");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Pause the contract - emergency stop functionality
     */
    function pause() public onlyOwner whenNotPaused {
        paused = true;
        emit ContractPaused(msg.sender);
    }
    
    /**
     * @dev Unpause the contract - return to normal state
     */
    function unpause() public onlyOwner whenPaused {
        paused = false;
        emit ContractUnpaused(msg.sender);
    }
    
    /**
     * @dev Starts the ownership transfer process
     * @param _newOwner The address to transfer ownership to
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        pendingOwner = _newOwner;
        emit OwnershipTransferInitiated(owner, pendingOwner);
    }
    
    /**
     * @dev Completes the ownership transfer process
     * Must be called by the pending owner
     */
    function acceptOwnership() public {
        require(msg.sender == pendingOwner, "Only pending owner can accept ownership");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    /**
     * @dev Register a new manufacturer
     * @param _name The name of the manufacturer
     * @param _licenseNumber The license number of the manufacturer
     */
    function registerManufacturer(string memory _name, string memory _licenseNumber) public whenNotPaused {
        // Input validation
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_licenseNumber).length > 0, "License number cannot be empty");
        require(!manufacturers[msg.sender].exists, "Manufacturer already registered");
        
        manufacturers[msg.sender] = Manufacturer({
            name: _name,
            licenseNumber: _licenseNumber,
            isVerified: false,
            registrationDate: block.timestamp,
            exists: true
        });
        
        emit ManufacturerRegistered(msg.sender, _name);
    }
    
    /**
     * @dev Verify a manufacturer (only owner can do this)
     * @param _manufacturer Address of the manufacturer to verify
     */
    function verifyManufacturer(address _manufacturer) public onlyOwner whenNotPaused {
        require(_manufacturer != address(0), "Invalid manufacturer address");
        require(manufacturers[_manufacturer].exists, "Manufacturer not registered");
        require(!manufacturers[_manufacturer].isVerified, "Manufacturer already verified");
        
        manufacturers[_manufacturer].isVerified = true;
        authorizedManufacturers[_manufacturer] = true;
        verifiedManufacturerCount++;
        
        emit ManufacturerVerified(_manufacturer);
    }

    /**
     * @dev Register a new medicine (only verified manufacturers)
     * @param _medicineId Unique ID for the medicine
     * @param _name Name of the medicine
     * @param _batchNumber Batch number
     * @param _manufacturingDate Manufacturing date (Unix timestamp)
     * @param _expiryDate Expiry date (Unix timestamp)
     * @param _description Optional description
     */
    function registerMedicine(
        string memory _medicineId, 
        string memory _name, 
        string memory _batchNumber,
        uint _manufacturingDate,
        uint _expiryDate,
        string memory _description
    ) public onlyAuthorizedManufacturer whenNotPaused {
        // Input validation
        require(bytes(_medicineId).length > 0, "Medicine ID cannot be empty");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_batchNumber).length > 0, "Batch number cannot be empty");
        require(!registeredMedicineIds[_medicineId], "Medicine ID already exists");
        require(_manufacturingDate > 0, "Invalid manufacturing date");
        require(_expiryDate > _manufacturingDate, "Expiry date must be after manufacturing date");
        
        medicines[_medicineId] = Medicine({
            medicineId: _medicineId,
            name: _name,
            batchNumber: _batchNumber,
            manufacturerName: manufacturers[msg.sender].name,
            manufacturingDate: _manufacturingDate,
            expiryDate: _expiryDate,
            manufacturer: msg.sender,
            isVerified: true,
            isFakeReported: false,
            reportCount: 0,
            description: _description,
            registrationTimestamp: block.timestamp
        });
        
        // Mark medicine ID as registered
        registeredMedicineIds[_medicineId] = true;
        medicineCount++;

        emit MedicineRegistered(_medicineId, _name, msg.sender);
    }
    
    /**
     * @dev Update medicine information (only the original manufacturer)
     * @param _medicineId ID of the medicine to update
     * @param _name Updated name
     * @param _batchNumber Updated batch number
     * @param _manufacturingDate Updated manufacturing date
     * @param _expiryDate Updated expiry date
     * @param _description Updated description
     */
    function updateMedicine(
        string memory _medicineId, 
        string memory _name, 
        string memory _batchNumber,
        uint _manufacturingDate,
        uint _expiryDate,
        string memory _description
    ) public whenNotPaused {
        // Get existing medicine data
        Medicine storage medicine = medicines[_medicineId];
        
        // Validations
        require(registeredMedicineIds[_medicineId], "Medicine not found");
        require(medicine.manufacturer == msg.sender, "Only the original manufacturer can update");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_batchNumber).length > 0, "Batch number cannot be empty");
        require(_manufacturingDate > 0, "Invalid manufacturing date");
        require(_expiryDate > _manufacturingDate, "Expiry date must be after manufacturing date");
        
        // Update the medicine info
        medicine.name = _name;
        medicine.batchNumber = _batchNumber;
        medicine.manufacturingDate = _manufacturingDate;
        medicine.expiryDate = _expiryDate;
        medicine.description = _description;
    }

    /**
     * @dev Verify a medicine's authenticity
     * @param _medicineId The ID of the medicine to verify
     * @return isVerified Boolean indicating if the medicine is verified
     * @return isFakeReported Boolean indicating if the medicine was reported as fake
     * @return medicineId String ID of the medicine
     * @return name String name of the medicine
     * @return batchNumber String batch number of the medicine
     * @return manufacturerName String name of the manufacturer
     * @return manufacturingDate Uint timestamp of manufacturing date
     * @return expiryDate Uint timestamp of expiry date
     * @return reportCount Uint number of fake reports
     * @return description String description of the medicine
     */
    function verifyMedicine(string memory _medicineId) public view returns (
        bool isVerified, 
        bool isFakeReported, 
        string memory medicineId, 
        string memory name,
        string memory batchNumber,
        string memory manufacturerName,
        uint manufacturingDate,
        uint expiryDate,
        uint reportCount,
        string memory description
    ) {
        Medicine memory med = medicines[_medicineId];
        require(registeredMedicineIds[_medicineId], "Medicine not found");
        
        return (
            med.isVerified, 
            med.isFakeReported, 
            med.medicineId, 
            med.name,
            med.batchNumber,
            med.manufacturerName,
            med.manufacturingDate,
            med.expiryDate,
            med.reportCount,
            med.description
        );
    }

    /**
     * @dev Report a medicine as potentially fake
     * @param _medicineId The ID of the medicine to report
     */
    function reportFakeMedicine(string memory _medicineId) public whenNotPaused {
        require(registeredMedicineIds[_medicineId], "Medicine not found");
        
        // Prevent duplicate reports from the same address
        require(!medicineReporters[_medicineId][msg.sender], "You have already reported this medicine");
        
        // Mark this address as having reported this medicine
        medicineReporters[_medicineId][msg.sender] = true;
        
        // Update medicine data
        Medicine storage med = medicines[_medicineId];
        med.reportCount += 1;
        
        // If there are 3 or more reports, mark as fake
        if (med.reportCount >= 3) {
            med.isFakeReported = true;
        }

        emit FakeMedicineReported(_medicineId, msg.sender);
    }
    
    /**
     * @dev Get detailed info about a manufacturer
     * @param _manufacturer The address of the manufacturer
     * @return name String name of the manufacturer
     * @return licenseNumber String license number of the manufacturer
     * @return isVerified Boolean indicating if the manufacturer is verified
     * @return registrationDate Uint timestamp of registration date
     */
    function getManufacturerInfo(address _manufacturer) public view returns (
        string memory name,
        string memory licenseNumber,
        bool isVerified,
        uint registrationDate
    ) {
        Manufacturer memory manufacturer = manufacturers[_manufacturer];
        require(manufacturer.exists, "Manufacturer not found");
        
        return (
            manufacturer.name,
            manufacturer.licenseNumber,
            manufacturer.isVerified,
            manufacturer.registrationDate
        );
    }
    
    /**
     * @dev Get the total number of medicines registered
     * @return Total count of registered medicines
     */
    function getMedicineCount() public view returns (uint) {
        return medicineCount;
    }
    
    /**
     * @dev Get the total number of verified manufacturers
     * @return Total count of verified manufacturers
     */
    function getVerifiedManufacturerCount() public view returns (uint) {
        return verifiedManufacturerCount;
    }
}
