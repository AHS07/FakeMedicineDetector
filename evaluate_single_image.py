import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import cv2
from PIL import Image
import io

def evaluate_single_image(image_path):
    # Load the model
    model = tf.keras.models.load_model('final_kaggle_model.h5')
    
    # Load and preprocess the image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image from {image_path}")
    
    # Convert to RGB
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Resize
    img_resized = cv2.resize(img_rgb, (224, 224))
    
    # Normalize
    img_normalized = img_resized.astype(np.float32) / 255.0
    
    # Add batch dimension
    img_batch = np.expand_dims(img_normalized, axis=0)
    
    # Get prediction
    prediction = model.predict(img_batch)[0][0]
    
    # Determine result
    if prediction > 0.5:
        result = "Machine Packed"
        confidence = float(prediction)
    else:
        result = "Hand Packed"
        confidence = float(1 - prediction)
    
    # Create visualization
    plt.figure(figsize=(10, 5))
    
    # Plot original image
    plt.subplot(1, 2, 1)
    plt.imshow(img_rgb)
    plt.title('Original Image')
    plt.axis('off')
    
    # Plot prediction
    plt.subplot(1, 2, 2)
    plt.bar(['Hand Packed', 'Machine Packed'], 
            [1 - confidence, confidence] if result == "Machine Packed" 
            else [confidence, 1 - confidence])
    plt.title(f'Prediction: {result}\nConfidence: {confidence:.2%}')
    plt.ylim(0, 1)
    
    # Save the plot
    plt.savefig('prediction_result.png')
    plt.close()
    
    return {
        'result': result,
        'confidence': confidence,
        'prediction_plot': 'prediction_result.png'
    }

if __name__ == "__main__":
    # Example usage
    try:
        result = evaluate_single_image('test_image.jpg')
        print(f"\nPrediction Result:")
        print(f"Packaging Type: {result['result']}")
        print(f"Confidence: {result['confidence']:.2%}")
        print(f"Visualization saved as: {result['prediction_plot']}")
    except Exception as e:
        print(f"Error: {str(e)}") 