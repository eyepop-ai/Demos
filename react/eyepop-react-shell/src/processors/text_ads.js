import Processor from './processor';
import EyePop from '@eyepop.ai/eyepop';
import Render2d from '@eyepop.ai/eyepop-render-2d'

class TextAdsProcessor extends Processor {
    constructor() {
        super();
        // Additional initialization if needed
    }

    async processPhoto(photo, canvasContext) {
        console.log('Processing photo TEXT:', photo);
        
        const pop_uuid = process.env.NEXT_PUBLIC_TEXT_AD_POP_UUID;
        const api_key = process.env.NEXT_PUBLIC_TEXT_AD_POP_API_KEY;

        const endpoint = await EyePop.workerEndpoint({
            // auth: { session: data.session },
            popId: pop_uuid,
            auth: {
              secretKey: api_key,
            },
            eyepopUrl: process.env.NEXT_PUBLIC_TEXT_AD_POP_API_URL,
            stopJobs: false
          }).connect()

        let results = await endpoint.process({
            file: photo,
            mimeType: 'image/*',
          })

        const renderer = Render2d.renderer(canvasContext,[
            Render2d.renderContour(),
            Render2d.renderText({ fitToBounds: true }),
            Render2d.renderBox({
              showClass: false,
              showTraceId: false,
              showNestedClasses: false,
              showConfidence: false,
            }),          
          ])
        
        for await (let result of results) {
            console.log(result)
            renderer.draw(result)

            const coverage = this.calculateCoveragePercentage(result);
            console.log('Coverage:', coverage);
            
            canvasContext.font = '16px Arial';
            canvasContext.fillStyle = 'white';
            canvasContext.fillText(`Coverage: ${coverage.toFixed(2)}%`, 10, 20);
        }        
    }

    calculateCoveragePercentage(data) {
      if (!data.objects || !data.source_width || !data.source_height) {
          throw new Error("Invalid data format. Ensure 'objects', 'source_width', and 'source_height' exist.");
      }

      // Calculate total area of all bounding boxes
      const totalBoxArea = data.objects.reduce((sum, obj) => sum + (obj.width * obj.height), 0);

      // Calculate source area
      const sourceArea = data.source_width * data.source_height;

      // Avoid division by zero
      if (sourceArea === 0) return 0;

      // Calculate and return the percentage
      return (totalBoxArea / sourceArea) * 100;
    }
  

    processFrame(frame) {
      // Implement the logic to process a frame
      console.log('Processing frame:', frame);
      // Add your frame processing code here
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
}

export default TextAdsProcessor;