import os
import cv2
import numpy as np
from datetime import datetime
import json
from PIL import Image
import shutil

class MedicineDataCollector:
    def __init__(self):
        self.base_dir = 'real_medicine_data'
        self.machine_packed_dir = os.path.join(self.base_dir, 'machine_packed')
        self.hand_packed_dir = os.path.join(self.base_dir, 'hand_packed')
        self.metadata_file = os.path.join(self.base_dir, 'metadata.json')
        self.IMG_SIZE = 224
        self.required_images = 1000  # per class
        
        # Create necessary directories
        self._create_directories()
        
        # Initialize metadata
        self.metadata = self._load_metadata()

    def _create_directories(self):
        """Create necessary directories for data collection"""
        os.makedirs(self.machine_packed_dir, exist_ok=True)
        os.makedirs(self.hand_packed_dir, exist_ok=True)

    def _load_metadata(self):
        """Load or create metadata file"""
        if os.path.exists(self.metadata_file):
            with open(self.metadata_file, 'r') as f:
                return json.load(f)
        return {
            'machine_packed': {'count': 0, 'images': {}},
            'hand_packed': {'count': 0, 'images': {}}
        }

    def _save_metadata(self):
        """Save metadata to file"""
        with open(self.metadata_file, 'w') as f:
            json.dump(self.metadata, f, indent=4)

    def process_image(self, image_path, packaging_type, medicine_info):
        """Process and save a new image with metadata"""
        try:
            # Generate unique filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{packaging_type}_{timestamp}.jpg"
            
            # Read and preprocess image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Could not read image")
            
            # Resize image
            img = cv2.resize(img, (self.IMG_SIZE, self.IMG_SIZE))
            
            # Save image
            target_dir = self.machine_packed_dir if packaging_type == 'machine_packed' else self.hand_packed_dir
            target_path = os.path.join(target_dir, filename)
            cv2.imwrite(target_path, img)
            
            # Update metadata
            self.metadata[packaging_type]['count'] += 1
            self.metadata[packaging_type]['images'][filename] = {
                'original_path': image_path,
                'medicine_info': medicine_info,
                'collection_date': timestamp,
                'image_size': f"{self.IMG_SIZE}x{self.IMG_SIZE}"
            }
            
            self._save_metadata()
            print(f"Successfully processed {filename}")
            return True
            
        except Exception as e:
            print(f"Error processing {image_path}: {str(e)}")
            return False

    def get_collection_status(self):
        """Get current status of data collection"""
        return {
            'machine_packed': {
                'collected': self.metadata['machine_packed']['count'],
                'remaining': max(0, self.required_images - self.metadata['machine_packed']['count'])
            },
            'hand_packed': {
                'collected': self.metadata['hand_packed']['count'],
                'remaining': max(0, self.required_images - self.metadata['hand_packed']['count'])
            }
        }

    def validate_dataset(self):
        """Validate the collected dataset"""
        status = self.get_collection_status()
        print("\nDataset Collection Status:")
        print(f"Machine Packed: {status['machine_packed']['collected']}/{self.required_images}")
        print(f"Hand Packed: {status['hand_packed']['collected']}/{self.required_images}")
        
        # Check image quality
        for packaging_type in ['machine_packed', 'hand_packed']:
            dir_path = self.machine_packed_dir if packaging_type == 'machine_packed' else self.hand_packed_dir
            for filename in os.listdir(dir_path):
                if filename.endswith(('.jpg', '.jpeg', '.png')):
                    img_path = os.path.join(dir_path, filename)
                    try:
                        img = Image.open(img_path)
                        if img.size != (self.IMG_SIZE, self.IMG_SIZE):
                            print(f"Warning: {filename} has incorrect size {img.size}")
                    except Exception as e:
                        print(f"Error validating {filename}: {str(e)}")

def main():
    collector = MedicineDataCollector()
    
    # Example usage
    print("Medicine Packaging Data Collection Tool")
    print("=====================================")
    print("\nInstructions:")
    print("1. Place machine-packed medicine images in the 'real_medicine_data/machine_packed' directory")
    print("2. Place hand-packed medicine images in the 'real_medicine_data/hand_packed' directory")
    print("3. Run this script to process and validate the images")
    print("\nRequired information for each image:")
    print("- Medicine name")
    print("- Manufacturing date")
    print("- Expiry date")
    print("- Packaging type (machine/hand)")
    print("- Image quality (good/medium/poor)")
    
    # Show current status
    status = collector.get_collection_status()
    print("\nCurrent Collection Status:")
    print(f"Machine Packed: {status['machine_packed']['collected']}/{collector.required_images}")
    print(f"Hand Packed: {status['hand_packed']['collected']}/{collector.required_images}")
    
    # Validate dataset
    collector.validate_dataset()

if __name__ == "__main__":
    main() 