import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np
import cv2
from PIL import Image
import os

class MedicinePackagingModel:
    def __init__(self):
        self.model = None
        self.image_size = (224, 224)
        self.batch_size = 32
        self.epochs = 50
        self.learning_rate = 0.001
        
    def build_model(self):
        """Build a CNN model for medicine packaging classification"""
        model = models.Sequential([
            # First Convolutional Block
            layers.Conv2D(32, (3, 3), activation='relu', input_shape=(*self.image_size, 3)),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            # Second Convolutional Block
            layers.Conv2D(64, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            # Third Convolutional Block
            layers.Conv2D(128, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            # Fourth Convolutional Block
            layers.Conv2D(256, (3, 3), activation='relu'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            
            # Flatten and Dense Layers
            layers.Flatten(),
            layers.Dense(512, activation='relu'),
            layers.Dropout(0.5),
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.3),
            layers.Dense(1, activation='sigmoid')
        ])
        
        # Compile model
        optimizer = tf.keras.optimizers.Adam(learning_rate=self.learning_rate)
        model.compile(
            optimizer=optimizer,
            loss='binary_crossentropy',
            metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()]
        )
        
        self.model = model
        return model
    
    def preprocess_image(self, image_path):
        """Preprocess image for model input"""
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"Could not read image at {image_path}")
            
            # Convert BGR to RGB
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Resize image
            img = cv2.resize(img, self.image_size)
            
            # Normalize pixel values
            img = img.astype(np.float32) / 255.0
            
            # Add batch dimension
            img = np.expand_dims(img, axis=0)
            
            return img
        except Exception as e:
            print(f"Error preprocessing image: {str(e)}")
            return None
    
    def train(self, train_data_dir, validation_data_dir):
        """Train the model on the dataset"""
        # Data augmentation for training
        train_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
            rescale=1./255,
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            shear_range=0.2,
            zoom_range=0.2,
            horizontal_flip=True,
            fill_mode='nearest'
        )
        
        # Only rescaling for validation
        validation_datagen = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1./255)
        
        # Load training data
        train_generator = train_datagen.flow_from_directory(
            train_data_dir,
            target_size=self.image_size,
            batch_size=self.batch_size,
            class_mode='binary'
        )
        
        # Load validation data
        validation_generator = validation_datagen.flow_from_directory(
            validation_data_dir,
            target_size=self.image_size,
            batch_size=self.batch_size,
            class_mode='binary'
        )
        
        # Early stopping to prevent overfitting
        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        # Reduce learning rate when plateau
        reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.2,
            patience=5,
            min_lr=1e-6
        )
        
        # Train the model
        history = self.model.fit(
            train_generator,
            epochs=self.epochs,
            validation_data=validation_generator,
            callbacks=[early_stopping, reduce_lr]
        )
        
        return history
    
    def predict(self, image_path):
        """Predict if medicine is hand-packed or machine-packed"""
        try:
            # Preprocess image
            img = self.preprocess_image(image_path)
            if img is None:
                return None
            
            # Make prediction
            prediction = self.model.predict(img)[0][0]
            
            # Return result with confidence
            result = {
                'packaging_type': 'Machine Packed' if prediction > 0.5 else 'Hand Packed',
                'confidence': float(prediction if prediction > 0.5 else 1 - prediction),
                'raw_score': float(prediction)
            }
            
            return result
        except Exception as e:
            print(f"Error making prediction: {str(e)}")
            return None
    
    def save_model(self, model_path):
        """Save the trained model"""
        if self.model is not None:
            self.model.save(model_path)
            print(f"Model saved to {model_path}")
    
    def load_model(self, model_path):
        """Load a trained model"""
        try:
            self.model = tf.keras.models.load_model(model_path)
            print(f"Model loaded from {model_path}")
        except Exception as e:
            print(f"Error loading model: {str(e)}")

# Example usage
if __name__ == "__main__":
    # Initialize model
    model = MedicinePackagingModel()
    
    # Build model
    model.build_model()
    
    # Train model (if you have a dataset)
    # model.train('path/to/train/data', 'path/to/validation/data')
    
    # Save model
    # model.save_model('medicine_packaging_model.h5')
    
    # Load model
    # model.load_model('medicine_packaging_model.h5')
    
    # Make prediction
    # result = model.predict('path/to/image.jpg')
    # print(result) 