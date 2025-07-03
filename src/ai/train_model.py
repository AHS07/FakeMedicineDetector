import os
import argparse
from medicine_packaging_model import MedicinePackagingModel
import matplotlib.pyplot as plt

def plot_training_history(history):
    """Plot training and validation metrics"""
    # Create figure with subplots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
    
    # Plot accuracy
    ax1.plot(history.history['accuracy'], label='Training Accuracy')
    ax1.plot(history.history['val_accuracy'], label='Validation Accuracy')
    ax1.set_title('Model Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    
    # Plot loss
    ax2.plot(history.history['loss'], label='Training Loss')
    ax2.plot(history.history['val_loss'], label='Validation Loss')
    ax2.set_title('Model Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    
    # Save plot
    plt.tight_layout()
    plt.savefig('training_history.png')
    plt.close()

def main():
    parser = argparse.ArgumentParser(description='Train medicine packaging classification model')
    parser.add_argument('--train_dir', required=True, help='Path to training data directory')
    parser.add_argument('--val_dir', required=True, help='Path to validation data directory')
    parser.add_argument('--model_dir', default='models', help='Directory to save the model')
    parser.add_argument('--epochs', type=int, default=50, help='Number of training epochs')
    parser.add_argument('--batch_size', type=int, default=32, help='Batch size for training')
    parser.add_argument('--learning_rate', type=float, default=0.001, help='Learning rate')
    
    args = parser.parse_args()
    
    # Create model directory if it doesn't exist
    os.makedirs(args.model_dir, exist_ok=True)
    
    # Initialize model
    model = MedicinePackagingModel()
    model.epochs = args.epochs
    model.batch_size = args.batch_size
    model.learning_rate = args.learning_rate
    
    # Build model
    print("Building model...")
    model.build_model()
    
    # Train model
    print("Training model...")
    history = model.train(args.train_dir, args.val_dir)
    
    # Plot training history
    print("Plotting training history...")
    plot_training_history(history)
    
    # Save model
    model_path = os.path.join(args.model_dir, 'medicine_packaging_model.h5')
    print(f"Saving model to {model_path}...")
    model.save_model(model_path)
    
    print("Training completed successfully!")

if __name__ == '__main__':
    main() 