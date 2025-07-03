import tensorflow as tf
import numpy as np
from sklearn.metrics import confusion_matrix, classification_report
from prepare_dataset import create_data_generators
import matplotlib.pyplot as plt
import seaborn as sns

def evaluate_model():
    # Load the best model
    model = tf.keras.models.load_model('best_model.h5')
    
    # Get validation data generator
    _, validation_generator = create_data_generators()
    
    # Get predictions
    predictions = model.predict(validation_generator)
    y_pred = (predictions > 0.5).astype(int)
    y_true = validation_generator.classes
    
    # Calculate confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    
    # Print confusion matrix
    print("\nConfusion Matrix:")
    print(cm)
    
    # Print classification report
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=['Hand Packed', 'Machine Packed']))
    
    # Plot confusion matrix
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Hand Packed', 'Machine Packed'],
                yticklabels=['Hand Packed', 'Machine Packed'])
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.savefig('confusion_matrix.png')
    plt.close()

if __name__ == "__main__":
    print("Evaluating model...")
    evaluate_model()
    print("Evaluation complete! Check confusion_matrix.png for visualization.") 