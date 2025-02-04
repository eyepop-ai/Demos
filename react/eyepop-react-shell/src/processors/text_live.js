import Processor from './processor';
import EyePop from '@eyepop.ai/eyepop';
import Render2d from '@eyepop.ai/eyepop-render-2d'

class TextLiveProcessor extends Processor {

    endpoint = null
    renderer = null
    stream = null
    results = null
    lastPrediction = null


    constructor(canvasContext) {
        super();
    }

    async setCanvasContext(canvasContext, stream) {
      const pop_uuid = process.env.NEXT_PUBLIC_TEXT_AD_POP_UUID;
      const api_key = process.env.NEXT_PUBLIC_TEXT_AD_POP_API_KEY;

      this.endpoint = await EyePop.workerEndpoint({
        // auth: { session: data.session },
        popId: pop_uuid,
        auth: {
          secretKey: api_key,
        },
        eyepopUrl: process.env.NEXT_PUBLIC_TEXT_AD_POP_API_URL,
        stopJobs: false
      }).connect()

      this.renderer = Render2d.renderer(canvasContext,[
        Render2d.renderContour(),
        Render2d.renderText({ fitToBounds: true }),
        Render2d.renderBox({
          showClass: false,
          showTraceId: false,
          showNestedClasses: false,
          showConfidence: false,
        }),          
      ])

      console.log('endpoint:', this.endpoint);
      await this.setStream(canvasContext, stream)
    }

    async setStream(canvasContext, stream) {
      this.stream = stream;
      const liveIngress = await this.endpoint.liveIngress(stream)

      this.results = await this.endpoint.process({
        ingressId: liveIngress.ingressId(),
      })  
      
      for await (const result of this.results) {
        if (
          canvasContext.canvas.width !== result.source_width ||
          canvasContext.canvas.height !== result.source_height
        ) {
          canvasContext.canvas.width = result.source_width
          canvasContext.canvas.height = result.source_height
        }

        console.log("Stream result:",result)
        this.lastPrediction = result
      }
        
    }

    async processPhoto(photo, canvasContext) {
            
    }

    async processFrame() {
      if(!this.stream) return
      if(!this.results) return
      if(!this.endpoint) return
      if(!this.renderer) return
      if(!this.lastPrediction) return

      //for await (const result of this.results) {          
        this.renderer.draw(this.lastPrediction)
      //}
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

export default TextLiveProcessor;