import os
import cv2
import numpy as np
from datetime import datetime
import json
from PIL import Image
import shutil
from sklearn.model_selection import train_test_split

class DatasetProcessor:
    def __init__(self, input_dir, output_dir='processed_data'):
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.machine_packed_dir = os.path.join(output_dir, 'machine_packed')
        self.hand_packed_dir = os.path.join(output_dir, 'hand_packed')
        self.metadata_file = os.path.join(output_dir, 'metadata.json')
        self.IMG_SIZE = 224
        
        # Create necessary directories
        self._create_directories()
        
        # Initialize metadata
        self.metadata = {
            'machine_packed': {'count': 0, 'images': {}},
            'hand_packed': {'count': 0, 'images': {}}
        }

    def _create_directories(self):
        """Create necessary directories for processed data"""
        os.makedirs(self.machine_packed_dir, exist_ok=True)
        os.makedirs(self.hand_packed_dir, exist_ok=True)

    def _save_metadata(self):
        """Save metadata to file"""
        with open(self.metadata_file, 'w') as f:
            json.dump(self.metadata, f, indent=4)

    def process_image(self, image_path, packaging_type):
        """Process and save a new image with metadata"""
        try:
            # Generate unique filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{packaging_type}_{timestamp}.jpg"
            
            # Read and preprocess image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"Could not read image: {image_path}")
            
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
                'processed_date': timestamp,
                'image_size': f"{self.IMG_SIZE}x{self.IMG_SIZE}"
            }
            
            print(f"Successfully processed {filename}")
            return True
            
        except Exception as e:
            print(f"Error processing {image_path}: {str(e)}")
            return False

    def process_directory(self):
        """Process all images in the input directory"""
        print(f"Processing images from {self.input_dir}")
        
        # Process machine-packed images
        machine_dir = os.path.join(self.input_dir, 'machine_packed')
        if os.path.exists(machine_dir):
            for filename in os.listdir(machine_dir):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    image_path = os.path.join(machine_dir, filename)
                    self.process_image(image_path, 'machine_packed')
        
        # Process hand-packed images
        hand_dir = os.path.join(self.input_dir, 'hand_packed')
        if os.path.exists(hand_dir):
            for filename in os.listdir(hand_dir):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    image_path = os.path.join(hand_dir, filename)
                    self.process_image(image_path, 'hand_packed')
        
        # Save final metadata
        self._save_metadata()
        
        # Print summary
        print("\nProcessing Summary:")
        print(f"Machine Packed: {self.metadata['machine_packed']['count']} images")
        print(f"Hand Packed: {self.metadata['hand_packed']['count']} images")

    def validate_dataset(self):
        """Validate the processed dataset"""
        print("\nValidating processed dataset...")
        
        for packaging_type in ['machine_packed', 'hand_packed']:
            dir_path = self.machine_packed_dir if packaging_type == 'machine_packed' else self.hand_packed_dir
            print(f"\nChecking {packaging_type} images:")
            
            for filename in os.listdir(dir_path):
                if filename.endswith(('.jpg', '.jpeg', '.png')):
                    img_path = os.path.join(dir_path, filename)
                    try:
                        img = Image.open(img_path)
                        if img.size != (self.IMG_SIZE, self.IMG_SIZE):
                            print(f"Warning: {filename} has incorrect size {img.size}")
                        if img.mode != 'RGB':
                            print(f"Warning: {filename} is not in RGB mode")
                    except Exception as e:
                        print(f"Error validating {filename}: {str(e)}")

def main():
    # Get input directory from user
    input_dir = input("Enter the path to your dataset directory: ").strip()
    
    if not os.path.exists(input_dir):
        print(f"Error: Directory {input_dir} does not exist")
        return
    
    # Create processor and process dataset
    processor = DatasetProcessor(input_dir)
    processor.process_directory()
    processor.validate_dataset()
    
    print("\nDataset processing completed!")
    print(f"Processed images are saved in: {processor.output_dir}")
    print(f"Metadata is saved in: {processor.metadata_file}")

if __name__ == "__main__":
    main() 