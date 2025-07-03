module.exports = {
    modelConfig: {
        imageSize: 224,
        confidenceThreshold: 0.85,
        modelPath: process.env.AI_MODEL_PATH || './src/ai/models',
        supportedFormats: ['image/jpeg', 'image/png', 'image/jpg']
    },
    ocrConfig: {
        language: 'eng',
        oem: 1,
        psm: 3
    }
}; 