import Processor from './processor';
import EyePop from '@eyepop.ai/eyepop';
import Render2d from '@eyepop.ai/eyepop-render-2d'

class TextLiveProcessor extends Processor {

  constructor() {
      super();
  }

  async setCanvasContext(canvasContext, stream) {
    const pop_uuid = process.env.NEXT_PUBLIC_TEXT_AD_POP_UUID;
    const api_key = process.env.NEXT_PUBLIC_TEXT_AD_POP_API_KEY;

    this.endpoint = await EyePop.workerEndpoint({
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

  async processFrame() {
    if(!this.stream) return
    if(!this.results) return
    if(!this.endpoint) return
    if(!this.renderer) return
    if(!this.lastPrediction) return

    this.renderer.draw(this.lastPrediction)
    
    return this.LookForWord(this.lastPrediction, "Boba")
  }

 
}

export default TextLiveProcessor;