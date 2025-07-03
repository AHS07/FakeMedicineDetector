import time
from blockchain_service import blockchain_service

def test_blockchain_service():
    print("Testing blockchain service integration...")
    
    # Check connection
    print(f"Blockchain connected: {blockchain_service.is_connected()}")
    
    if not blockchain_service.is_connected():
        print("ERROR: Blockchain service is not connected!")
        return
    
    # Show default account and owner information
    print(f"Default account: {blockchain_service.default_account}")
    try:
        contract = blockchain_service.contract
        owner = contract.functions.owner().call()
        print(f"Contract owner: {owner}")
        print(f"Is default account owner? {owner.lower() == blockchain_service.default_account.lower()}")
    except Exception as e:
        print(f"Error getting owner: {str(e)}")
    
    # Try to register as manufacturer first
    try:
        print("\nTrying to register as manufacturer...")
        reg_result = blockchain_service.register_manufacturer(
            name="Test Manufacturer",
            license_number="TEST-LICENSE-001"
        )
        
        print(f"Registration result: {reg_result['success']}")
        if reg_result['success']:
            print(f"Transaction hash: {reg_result.get('tx_hash')}")
            print("Waiting for transaction to be mined...")
            time.sleep(2)
        else:
            print(f"Error: {reg_result.get('error')}")
            
        # Check manufacturer info
        print("\nChecking manufacturer info...")
        manufacturer_info = blockchain_service.get_manufacturer_info(blockchain_service.default_account)
        print(f"Manufacturer info result: {manufacturer_info['success']}")
        if manufacturer_info['success']:
            print(f"Manufacturer name: {manufacturer_info['manufacturer']['name']}")
            print(f"Is verified: {manufacturer_info['manufacturer']['isVerified']}")
            
            # Verify manufacturer if not already verified
            if not manufacturer_info['manufacturer']['isVerified']:
                print("\nVerifying manufacturer...")
                verify_result = blockchain_service.verify_manufacturer(blockchain_service.default_account)
                print(f"Verification result: {verify_result['success']}")
                if verify_result['success']:
                    print(f"Transaction hash: {verify_result.get('tx_hash')}")
                    print("Waiting for transaction to be mined...")
                    time.sleep(2)
                else:
                    print(f"Error: {verify_result.get('error')}")
        else:
            print(f"Error getting manufacturer info: {manufacturer_info.get('error')}")
    except Exception as e:
        print(f"Error with manufacturer operations: {str(e)}")
    
    # Test medicine registration again after manufacturer registration
    try:
        print("\nTesting medicine registration...")
        medicine_id = f"TEST_MED_{int(time.time())}"
        print(f"Trying to register medicine with ID: {medicine_id}")
        medicine_result = blockchain_service.register_medicine(
            medicine_id=medicine_id,
            name="Test Medicine",
            batch_number="TEST-BATCH-001",
            manufacturing_date=int(time.time()) - 86400,  # yesterday
            expiry_date=int(time.time()) + 31536000,  # one year from now
            description="Test medicine for integration testing"
        )
        
        print(f"Medicine registration result: {medicine_result['success']}")
        if not medicine_result['success']:
            print(f"Error registering medicine: {medicine_result.get('error', 'Unknown error')}")
        else:
            print(f"Transaction hash: {medicine_result.get('tx_hash')}")
            
            # Verify the medicine
            print("\nVerifying medicine...")
            time.sleep(2)  # Wait for the transaction to be mined
            verify_result = blockchain_service.verify_medicine(medicine_id)
            
            print(f"Medicine verification result: {verify_result['success']}")
            if verify_result['success']:
                med_data = verify_result['medicine']
                print(f"Medicine data: {med_data['name']} (ID: {med_data['medicineId']})")
                print(f"Is verified: {med_data['isVerified']}")
            else:
                print(f"Verification error: {verify_result.get('error', 'Unknown error')}")
    
    except Exception as e:
        print(f"Error testing medicine registration: {str(e)}")
        
if __name__ == "__main__":
    test_blockchain_service() 