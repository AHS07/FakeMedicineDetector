import json
import os
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_blockchain():
    # Connect to blockchain (local Ganache by default)
    w3 = Web3(Web3.HTTPProvider(os.getenv('BLOCKCHAIN_URL', 'http://127.0.0.1:7545')))
    
    # Check connection
    print(f"Blockchain connected: {w3.is_connected()}")
    
    if not w3.is_connected():
        print("WARNING: Failed to connect to blockchain")
        return
    
    # Get network ID
    try:
        network_id = w3.eth.chain_id
        print(f"Network ID: {network_id}")
    except Exception as e:
        print(f"Error getting network ID: {e}")
    
    # Get accounts
    try:
        accounts = w3.eth.accounts
        print(f"Available accounts: {len(accounts)}")
        if len(accounts) > 0:
            print(f"First account: {accounts[0]}")
    except Exception as e:
        print(f"Error getting accounts: {e}")
    
    # Check contract JSON
    try:
        contract_file_path = 'blockchain/contract.json'
        if os.path.exists(contract_file_path):
            with open(contract_file_path, 'r') as file:
                contract_data = json.load(file)
                contract_address = contract_data.get('address')
                contract_abi = contract_data.get('abi')
                
                print(f"Contract exists: {bool(contract_address)}")
                print(f"Contract address: {contract_address}")
                print(f"ABI available: {bool(contract_abi)}")
                
                if contract_address and contract_abi:
                    try:
                        # Create contract instance
                        contract = w3.eth.contract(
                            address=contract_address,
                            abi=contract_abi
                        )
                        
                        # Check contract interaction
                        try:
                            owner = contract.functions.owner().call()
                            print(f"Contract owner: {owner}")
                            print("Contract interaction successful")
                        except Exception as e:
                            print(f"Error calling contract method: {e}")
                    except Exception as e:
                        print(f"Error creating contract instance: {e}")
        else:
            print(f"Contract file not found at {contract_file_path}")
    except Exception as e:
        print(f"Error checking contract: {e}")

if __name__ == "__main__":
    print("Testing blockchain connection...")
    check_blockchain() 