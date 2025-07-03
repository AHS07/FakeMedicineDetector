import tensorflow as tf
import numpy as np
from PIL import Image
from prepare_dataset import IMG_SIZE

def load_and_preprocess_image(image_path):
    """Load and preprocess an image for prediction"""
    try:
        # Load and resize the image
        img = Image.open(image_path)
        img = img.resize((IMG_SIZE, IMG_SIZE))
        
        # Convert to numpy array and normalize
        img_array = np.array(img) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        print(f"Error processing image {image_path}: {e}")
        return None

def predict_image(model_path, image_path):
    """Make a prediction on a single image"""
    try:
        # Load the model
        model = tf.keras.models.load_model(model_path)
        
        # Load and preprocess the image
        img_array = load_and_preprocess_image(image_path)
        
        if img_array is not None:
            # Make prediction
            prediction = model.predict(img_array)[0][0]
            
            # Convert prediction to label
            # High confidence in detecting synthetic variations indicates hand-packed
            if prediction > 0.5:
                label = "Hand-packed"
                confidence = prediction
            else:
                label = "Machine-packed"
                confidence = 1 - prediction
            
            return {
                'label': label,
                'confidence': float(confidence),
                'raw_prediction': float(prediction)
            }
    except Exception as e:
        print(f"Error making prediction: {e}")
        return None

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Predict if a medicine is hand-packed or machine-packed')
    parser.add_argument('image_path', help='Path to the image file')
    parser.add_argument('--model', default='best_model.h5', help='Path to the trained model file')
    
    args = parser.parse_args()
    
    result = predict_image(args.model, args.image_path)
    
    if result:
        print(f"\nPrediction: {result['label']}")
        print(f"Confidence: {result['confidence']:.2%}")
        print(f"Raw prediction value: {result['raw_prediction']:.4f}") 