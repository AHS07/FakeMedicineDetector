import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import random

# Constants
IMG_SIZE = 224  # Standard size for input images
BATCH_SIZE = 32
DATA_DIR = 'Medicine_data'
OUTPUT_DIR = 'processed_data'

def create_output_directories():
    """Create necessary directories for processed data"""
    os.makedirs(os.path.join(OUTPUT_DIR, 'machine_packed'), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, 'hand_packed'), exist_ok=True)

def load_and_resize_image(image_path):
    """Load and resize an image to the standard size"""
    try:
        img = Image.open(image_path)
        img = img.resize((IMG_SIZE, IMG_SIZE))
        return img
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None

def generate_hand_packed_variation(img):
    """Generate a synthetic hand-packed variation of a machine-packed image"""
    # Convert to numpy array
    img_array = np.array(img)
    
    # Apply random transformations to simulate hand-packing
    # 1. Random rotation
    angle = random.uniform(-15, 15)
    img_array = tf.image.rot90(img_array, k=random.randint(0, 3))
    
    # 2. Random brightness adjustment
    img_array = tf.image.random_brightness(img_array, 0.2)
    
    # 3. Random contrast adjustment
    img_array = tf.image.random_contrast(img_array, 0.8, 1.2)
    
    # 4. Add some noise
    noise = np.random.normal(0, 10, img_array.shape).astype(np.uint8)
    img_array = np.clip(img_array + noise, 0, 255).astype(np.uint8)
    
    return Image.fromarray(img_array)

def process_dataset():
    """Process the dataset and generate synthetic hand-packed variations"""
    create_output_directories()
    
    # Get all image files from the data directory
    image_files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    print(f"Found {len(image_files)} images to process")
    
    for img_file in image_files:
        # Process machine-packed image
        img_path = os.path.join(DATA_DIR, img_file)
        img = load_and_resize_image(img_path)
        
        if img is not None:
            # Save original machine-packed image
            output_path = os.path.join(OUTPUT_DIR, 'machine_packed', img_file)
            img.save(output_path)
            
            # Generate and save hand-packed variation
            hand_packed_img = generate_hand_packed_variation(img)
            hand_packed_path = os.path.join(OUTPUT_DIR, 'hand_packed', f'hand_{img_file}')
            hand_packed_img.save(hand_packed_path)
            
            print(f"Processed {img_file}")

def create_data_generators():
    """Create data generators for training"""
    datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest'
    )
    
    train_generator = datagen.flow_from_directory(
        OUTPUT_DIR,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='training'
    )
    
    validation_generator = datagen.flow_from_directory(
        OUTPUT_DIR,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='validation'
    )
    
    return train_generator, validation_generator

if __name__ == "__main__":
    print("Starting dataset preparation...")
    process_dataset()
    print("Dataset preparation completed!")
    
    # Create data generators
    train_gen, val_gen = create_data_generators()
    print("\nData generators created successfully!")
    print(f"Number of training samples: {train_gen.samples}")
    print(f"Number of validation samples: {val_gen.samples}") 