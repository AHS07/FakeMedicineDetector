import kagglehub
import os
import shutil
from pathlib import Path

def download_and_organize_dataset():
    print("Downloading Kaggle dataset...")
    
    # Create directories
    base_dir = Path('kaggle_dataset')
    train_dir = base_dir / 'train'
    test_dir = base_dir / 'test'
    
    # Create directories if they don't exist
    for dir_path in [train_dir, test_dir]:
        dir_path.mkdir(parents=True, exist_ok=True)
        (dir_path / 'hand_packed').mkdir(exist_ok=True)
        (dir_path / 'machine_packed').mkdir(exist_ok=True)
    
    # Download the dataset
    try:
        # Download the dataset
        model_path = kagglehub.model_download('kaggle/medicine-packaging-classification')
        print(f"Dataset downloaded to: {model_path}")
        
        # Move files to appropriate directories
        source_dir = Path(model_path)
        
        # Move training files
        for img in (source_dir / 'train' / 'hand_packed').glob('*.jpg'):
            shutil.copy2(img, train_dir / 'hand_packed')
        for img in (source_dir / 'train' / 'machine_packed').glob('*.jpg'):
            shutil.copy2(img, train_dir / 'machine_packed')
            
        # Move test files
        for img in (source_dir / 'test' / 'hand_packed').glob('*.jpg'):
            shutil.copy2(img, test_dir / 'hand_packed')
        for img in (source_dir / 'test' / 'machine_packed').glob('*.jpg'):
            shutil.copy2(img, test_dir / 'machine_packed')
            
        print("Dataset organized successfully!")
        print(f"Training samples: {len(list(train_dir.glob('**/*.jpg')))}")
        print(f"Test samples: {len(list(test_dir.glob('**/*.jpg')))}")
        
    except Exception as e:
        print(f"Error downloading or organizing dataset: {str(e)}")
        raise

if __name__ == "__main__":
    download_and_organize_dataset() 