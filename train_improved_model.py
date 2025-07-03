import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, TensorBoard
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os
import datetime

# Constants
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 50

def create_improved_model():
    """Create and compile an improved model architecture"""
    # Load the pre-trained MobileNetV2 model
    base_model = MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
    
    # Unfreeze the last 20% of layers
    num_layers = len(base_model.layers)
    for layer in base_model.layers[:int(num_layers * 0.8)]:
        layer.trainable = False
    
    # Create the improved model architecture
    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dense(1024, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        layers.Dense(512, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(1, activation='sigmoid')
    ])
    
    # Compile the model with improved optimizer settings
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.AUC(), tf.keras.metrics.Precision(), tf.keras.metrics.Recall()]
    )
    
    return model

def create_data_generators():
    """Create data generators with improved augmentation"""
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        vertical_flip=True,
        fill_mode='nearest',
        brightness_range=[0.8, 1.2],
        channel_shift_range=50.0
    )
    
    val_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2
    )
    
    train_generator = train_datagen.flow_from_directory(
        'processed_data',
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='training'
    )
    
    validation_generator = val_datagen.flow_from_directory(
        'processed_data',
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='validation'
    )
    
    return train_generator, validation_generator

def train_model():
    """Train the improved model"""
    # Create data generators
    train_generator, validation_generator = create_data_generators()
    
    # Create and compile the model
    model = create_improved_model()
    
    # Create logs directory for TensorBoard
    log_dir = os.path.join('logs', datetime.datetime.now().strftime("%Y%m%d-%H%M%S"))
    os.makedirs(log_dir, exist_ok=True)
    
    # Define improved callbacks
    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.1,
            patience=5,
            min_lr=1e-7,
            verbose=1
        ),
        ModelCheckpoint(
            'best_improved_model.h5',
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        TensorBoard(
            log_dir=log_dir,
            histogram_freq=1
        )
    ]
    
    # Train the model
    print("Starting model training...")
    history = model.fit(
        train_generator,
        epochs=EPOCHS,
        validation_data=validation_generator,
        callbacks=callbacks,
        verbose=1
    )
    
    return model, history

def evaluate_model(model, validation_generator):
    """Evaluate the model and print detailed metrics"""
    print("\nEvaluating model...")
    results = model.evaluate(validation_generator, verbose=1)
    
    print("\nEvaluation Results:")
    print(f"Loss: {results[0]:.4f}")
    print(f"Accuracy: {results[1]:.4f}")
    print(f"AUC: {results[2]:.4f}")
    print(f"Precision: {results[3]:.4f}")
    print(f"Recall: {results[4]:.4f}")
    
    # Calculate F1 Score
    f1_score = 2 * (results[3] * results[4]) / (results[3] + results[4])
    print(f"F1 Score: {f1_score:.4f}")

if __name__ == "__main__":
    # Train the model
    model, history = train_model()
    
    # Save the final model
    model.save('final_improved_model.h5')
    print("\nModel saved as 'final_improved_model.h5'")
    
    # Evaluate the model
    _, validation_generator = create_data_generators()
    evaluate_model(model, validation_generator) 