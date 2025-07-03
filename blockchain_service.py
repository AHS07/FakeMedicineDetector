import json
import os
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class BlockchainService:
    def __init__(self):
        # Connect to blockchain (local Ganache by default)
        self.w3 = Web3(Web3.HTTPProvider(os.getenv('BLOCKCHAIN_URL', 'http://127.0.0.1:7545')))
        
        # Initialize default account to None to avoid attribute errors
        self.default_account = None
        self.contract = None
        self.contract_address = None
        self.contract_abi = None
        
        # Check connection
        if not self.w3.is_connected():
            print("Warning: Failed to connect to blockchain")
            return
            
        # Load contract ABI and address
        try:
            # Get the directory where this script is located
            current_dir = os.path.dirname(os.path.abspath(__file__))
            contract_path = os.path.join(current_dir, 'blockchain', 'contract.json')
            
            print(f"Looking for contract file at: {contract_path}")
            
            if not os.path.exists(contract_path):
                # Try alternative paths
                alt_paths = [
                    os.path.join(os.getcwd(), 'blockchain', 'contract.json'),
                    os.path.join(os.getcwd(), 'software assignment project', 'blockchain', 'contract.json')
                ]
                
                for alt_path in alt_paths:
                    print(f"Trying alternative path: {alt_path}")
                    if os.path.exists(alt_path):
                        contract_path = alt_path
                        print(f"Found contract at: {contract_path}")
                        break
                
                if not os.path.exists(contract_path):
                    print(f"Error: Contract file not found at any of the checked paths")
                    return
            
            with open(contract_path, 'r') as file:
                contract_data = json.load(file)
            
            if 'abi' not in contract_data or 'address' not in contract_data:
                print("Error: Invalid contract file format - missing abi or address")
                return
            
            self.contract_abi = contract_data['abi']
            self.contract_address = contract_data['address']
            
            # Check if address is valid
            if not self.w3.is_address(self.contract_address):
                print(f"Error: Invalid contract address format: {self.contract_address}")
                self.contract_address = None
                return
            
            # Create contract instance
            try:
                self.contract = self.w3.eth.contract(
                    address=self.contract_address,
                    abi=self.contract_abi
                )
                
                # Verify contract - try to call a simple view function like owner()
                try:
                    owner = self.contract.functions.owner().call()
                    print(f"Contract initialized successfully with owner: {owner}")
                except Exception as e:
                    print(f"Warning: Contract initialized but could not verify owner function: {e}")
                
            except Exception as e:
                print(f"Error creating contract instance: {e}")
                self.contract = None
            
            # Set default account
            try:
                if len(self.w3.eth.accounts) > 0:
                    self.default_account = self.w3.eth.accounts[0]
                    self.w3.eth.default_account = self.default_account
                    print(f"Default account set to: {self.default_account}")
                else:
                    print("Warning: No accounts available")
            except Exception as e:
                print(f"Warning: Could not set default account: {e}")
                
        except Exception as e:
            print(f"Error initializing blockchain service: {e}")
    
    def is_connected(self):
        """Check if connected to blockchain"""
        return self.w3.is_connected()
    
    def register_manufacturer(self, name, license_number, account=None):
        """Register a manufacturer on the blockchain"""
        try:
            if not self.is_connected():
                return {'success': False, 'error': 'Blockchain not connected'}
                
            if not self.contract:
                return {'success': False, 'error': 'Contract not initialized'}
                
            # Check if we have an account to use
            if not account:
                account = self.default_account
                
            if not account:
                return {'success': False, 'error': 'No account available for transaction'}
                
            tx_hash = self.contract.functions.registerManufacturer(
                name,
                license_number
            ).transact({'from': account})
            
            # Wait for transaction to be mined
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return {'success': True, 'tx_hash': tx_hash.hex(), 'tx_receipt': tx_receipt}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
            
    def verify_manufacturer(self, manufacturer_address, account=None):
        """Verify a manufacturer (admin only)"""
        try:
            if not self.is_connected():
                return {'success': False, 'error': 'Blockchain not connected'}
                
            if not self.contract:
                return {'success': False, 'error': 'Contract not initialized'}
                
            # Check if we have an account to use
            if not account:
                account = self.default_account
                
            if not account:
                return {'success': False, 'error': 'No account available for transaction'}
                
            tx_hash = self.contract.functions.verifyManufacturer(
                manufacturer_address
            ).transact({'from': account})
            
            # Wait for transaction to be mined
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return {'success': True, 'tx_hash': tx_hash.hex(), 'tx_receipt': tx_receipt}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def register_medicine(self, medicine_id, name, batch_number, manufacturing_date, 
                         expiry_date, description, account=None):
        """Register a medicine on the blockchain"""
        try:
            if not self.is_connected():
                return {'success': False, 'error': 'Blockchain not connected'}
                
            if not self.contract:
                return {'success': False, 'error': 'Contract not initialized'}
                
            # Check if we have an account to use
            if not account:
                account = self.default_account
                
            if not account:
                return {'success': False, 'error': 'No account available for transaction'}
                
            tx_hash = self.contract.functions.registerMedicine(
                medicine_id,
                name,
                batch_number,
                manufacturing_date,
                expiry_date,
                description
            ).transact({'from': account})
            
            # Wait for transaction to be mined
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return {'success': True, 'tx_hash': tx_hash.hex(), 'tx_receipt': tx_receipt}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def verify_medicine(self, medicine_id):
        """Verify a medicine on the blockchain"""
        try:
            if not self.is_connected():
                return {'success': False, 'error': 'Blockchain not connected'}
                
            if not self.contract:
                return {'success': False, 'error': 'Contract not initialized'}
                
            result = self.contract.functions.verifyMedicine(medicine_id).call()
            
            # Parse results based on contract return values
            medicine_data = {
                'isVerified': result[0],
                'isFakeReported': result[1],
                'medicineId': result[2],
                'name': result[3],
                'batchNumber': result[4],
                'manufacturerName': result[5],
                'manufacturingDate': result[6],
                'expiryDate': result[7],
                'reportCount': result[8],
                'description': result[9]
            }
            
            return {'success': True, 'medicine': medicine_data}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def report_fake_medicine(self, medicine_id, account=None):
        """Report a medicine as fake"""
        try:
            if not self.is_connected():
                return {'success': False, 'error': 'Blockchain not connected'}
                
            if not self.contract:
                return {'success': False, 'error': 'Contract not initialized'}
                
            # Check if we have an account to use
            if not account:
                account = self.default_account
                
            if not account:
                return {'success': False, 'error': 'No account available for transaction'}
                
            tx_hash = self.contract.functions.reportFakeMedicine(
                medicine_id
            ).transact({'from': account})
            
            # Wait for transaction to be mined
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return {'success': True, 'tx_hash': tx_hash.hex(), 'tx_receipt': tx_receipt}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def get_manufacturer_info(self, manufacturer_address):
        """Get manufacturer information from the blockchain"""
        try:
            if not self.is_connected():
                return {'success': False, 'error': 'Blockchain not connected'}
                
            if not self.contract:
                return {'success': False, 'error': 'Contract not initialized'}
                
            result = self.contract.functions.getManufacturerInfo(manufacturer_address).call()
            
            # Parse results based on contract return values
            manufacturer_data = {
                'name': result[0],
                'licenseNumber': result[1],
                'isVerified': result[2],
                'registrationDate': result[3]
            }
            
            return {'success': True, 'manufacturer': manufacturer_data}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def set_account(self, account_address):
        """Set the account to use for transactions"""
        if self.w3.is_connected() and Web3.isAddress(account_address):
            self.default_account = account_address
            self.w3.eth.default_account = account_address
            return True
        return False

# Initialize blockchain service singleton
blockchain_service = BlockchainService() 