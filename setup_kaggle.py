import os
import json
from pathlib import Path

def setup_kaggle_credentials():
    """Set up Kaggle credentials"""
    print("Setting up Kaggle credentials...")
    
    # Create .kaggle directory in user's home directory
    kaggle_dir = Path.home() / '.kaggle'
    kaggle_dir.mkdir(exist_ok=True)
    
    # Get Kaggle credentials from user
    print("\nPlease enter your Kaggle credentials:")
    username = input("Kaggle Username: ").strip()
    key = input("Kaggle API Key: ").strip()
    
    # Create kaggle.json file
    credentials = {
        "username": username,
        "key": key
    }
    
    # Save credentials
    with open(kaggle_dir / 'kaggle.json', 'w') as f:
        json.dump(credentials, f)
    
    # Set appropriate permissions
    os.chmod(kaggle_dir / 'kaggle.json', 0o600)
    
    print("\nKaggle credentials have been set up successfully!")
    print("You can now run download_kaggle_dataset.py")

if __name__ == "__main__":
    setup_kaggle_credentials() 