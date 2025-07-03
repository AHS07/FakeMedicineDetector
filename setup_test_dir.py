import os
import shutil
from pathlib import Path

def setup_test_directory():
    # Create test directory structure
    test_dir = Path('test_images')
    hand_packed_dir = test_dir / 'hand_packed'
    machine_packed_dir = test_dir / 'machine_packed'
    
    # Create directories
    for dir_path in [hand_packed_dir, machine_packed_dir]:
        dir_path.mkdir(parents=True, exist_ok=True)
    
    # Copy some sample images from the existing dataset
    source_dir = Path('dataset')
    if source_dir.exists():
        # Copy hand packed images
        for img in (source_dir / 'hand_packed').glob('*.jpg'):
            shutil.copy2(img, hand_packed_dir)
            
        # Copy machine packed images
        for img in (source_dir / 'machine_packed').glob('*.jpg'):
            shutil.copy2(img, machine_packed_dir)
            
        print(f"Copied {len(list(hand_packed_dir.glob('*.jpg')))} hand packed images")
        print(f"Copied {len(list(machine_packed_dir.glob('*.jpg')))} machine packed images")
    else:
        print("Source dataset directory not found. Please add test images manually to:")
        print(f"- {hand_packed_dir}")
        print(f"- {machine_packed_dir}")

if __name__ == "__main__":
    setup_test_directory() 