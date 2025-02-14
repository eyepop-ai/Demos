class Processor {

    endpoint = null
    renderer = null
    stream = null
    results = null
    lastPrediction = null

    constructor() {
        // Initialize settings or any other properties here
        this.settings = {};
    }

    processPhoto(photo, canvasContext) {
        // Implement the logic to process a photo
        console.log('Processing photo:', photo);
        // Add your photo processing code here
    }

    async setCanvasContext(canvasContext, stream) {
        // Implement the logic to set the canvas context
        console.log('Setting canvas context:', canvasContext);
        // Add your canvas context setting code here
    }

    async setStream(stream) {
        // Implement the logic to set the stream
        console.log('Setting stream:', stream);
        // Add your stream setting code here
    }

    showSettings() {
        // Implement the logic to show settings
        console.log('Current settings:', this.settings);
        // Add your code to display settings here
    }

    applySettings(newSettings) {
        // Implement the logic to apply new settings
        this.settings = { ...this.settings, ...newSettings };
        console.log('Applied new settings:', this.settings);
        // Add your code to apply new settings here
    }

    processFrame(canvasContext, videoRef) {
        // Implement the logic to process a frame
        // Add your frame processing code here
    }

    LookForWord(predictionJson, word) {
        if (!predictionJson || !predictionJson.objects) return [];
    
        return predictionJson?.objects.filter(obj =>
            obj.texts && obj.texts.some(textObj => 
            textObj.text.toLowerCase() === word.toLowerCase()
            )
        );
    }
}

export default Processor;