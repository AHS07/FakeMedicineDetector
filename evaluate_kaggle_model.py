import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report
import os
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Load the model
model = tf.keras.models.load_model('final_kaggle_model.h5')

# Define the test data directory
test_dir = 'test_images'  # Directory containing test images

# Create data generator for test set
test_datagen = ImageDataGenerator(rescale=1./255)

test_generator = test_datagen.flow_from_directory(
    test_dir,
    target_size=(224, 224),
    batch_size=32,
    class_mode='binary',
    shuffle=False  # Important for confusion matrix
)

# Get predictions
predictions = model.predict(test_generator)
y_pred = (predictions > 0.5).astype(int)
y_true = test_generator.classes

# Generate confusion matrix
cm = confusion_matrix(y_true, y_pred)

# Plot confusion matrix
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['Hand Packed', 'Machine Packed'],
            yticklabels=['Hand Packed', 'Machine Packed'])
plt.title('Confusion Matrix for Medicine Packaging Classification')
plt.ylabel('True Label')
plt.xlabel('Predicted Label')

# Save the plot
plt.savefig('confusion_matrix.png')
plt.close()

# Print classification report
print("\nClassification Report:")
print(classification_report(y_true, y_pred, 
                          target_names=['Hand Packed', 'Machine Packed']))

# Calculate and print accuracy
accuracy = (cm[0][0] + cm[1][1]) / cm.sum()
print(f"\nOverall Accuracy: {accuracy:.2%}")

# Print detailed metrics
print("\nDetailed Metrics:")
print(f"True Positives (Machine Packed): {cm[1][1]}")
print(f"True Negatives (Hand Packed): {cm[0][0]}")
print(f"False Positives: {cm[0][1]}")
print(f"False Negatives: {cm[1][0]}")

# Print per-class accuracy
hand_packed_accuracy = cm[0][0] / (cm[0][0] + cm[0][1])
machine_packed_accuracy = cm[1][1] / (cm[1][0] + cm[1][1])
print(f"\nPer-class Accuracy:")
print(f"Hand Packed Accuracy: {hand_packed_accuracy:.2%}")
print(f"Machine Packed Accuracy: {machine_packed_accuracy:.2%}") 