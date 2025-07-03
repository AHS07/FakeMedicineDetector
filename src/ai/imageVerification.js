const tf = require('@tensorflow/tfjs-node');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

class MedicineImageVerifier {
    constructor() {
        this.model = null;
        this.imageSize = 224;
        this.modelPath = path.join(__dirname, 'models', 'medicine_packaging_model.h5');
        this.loadModel();
    }

    async loadModel() {
        try {
            // Load the TensorFlow model
            this.model = await tf.loadLayersModel(`file://${this.modelPath}`);
            console.log('AI Model loaded successfully');
        } catch (error) {
            console.error('Error loading AI model:', error);
            throw error;
        }
    }

    async preprocessImage(imagePath) {
        try {
            // Load and preprocess image
            const image = await Jimp.read(imagePath);
            image.resize(this.imageSize, this.imageSize);
            
            // Convert to tensor
            const values = new Float32Array(this.imageSize * this.imageSize * 3);
            let offset = 0;
            
            image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
                values[offset++] = image.bitmap.data[idx + 0] / 255.0; // R
                values[offset++] = image.bitmap.data[idx + 1] / 255.0; // G
                values[offset++] = image.bitmap.data[idx + 2] / 255.0; // B
            });

            return tf.tensor4d(values, [1, this.imageSize, this.imageSize, 3]);
        } catch (error) {
            console.error('Error preprocessing image:', error);
            throw error;
        }
    }

    async verifyImage(imagePath) {
        try {
            if (!this.model) {
                await this.loadModel();
            }

            // Preprocess image
            const tensor = await this.preprocessImage(imagePath);
            
            // Get prediction
            const prediction = this.model.predict(tensor);
            const score = await prediction.data();
            
            // Cleanup
            tensor.dispose();
            prediction.dispose();

            // Calculate confidence and determine packaging type
            const confidence = score[0];
            const isMachinePacked = confidence > 0.5;
            const finalConfidence = isMachinePacked ? confidence : 1 - confidence;

            return {
                score: finalConfidence,
                isMachinePacked: isMachinePacked,
                confidence: finalConfidence * 100,
                details: this.generateDetails(isMachinePacked, finalConfidence)
            };
        } catch (error) {
            console.error('Error verifying image:', error);
            throw error;
        }
    }

    generateDetails(isMachinePacked, confidence) {
        const packagingType = isMachinePacked ? 'Machine Packed' : 'Hand Packed';
        const confidenceLevel = confidence >= 0.97 ? 'Very High' :
                              confidence >= 0.90 ? 'High' :
                              confidence >= 0.80 ? 'Moderate' : 'Low';
        
        return {
            packagingType,
            confidenceLevel,
            analysis: `The medicine appears to be ${packagingType.toLowerCase()} with ${confidenceLevel.toLowerCase()} confidence (${(confidence * 100).toFixed(2)}%).`
        };
    }
}

module.exports = new MedicineImageVerifier(); 