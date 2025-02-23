import Processor from './processor';
import EyePop from '@eyepop.ai/eyepop';
import Render2d from '@eyepop.ai/eyepop-render-2d'

class TrailLiveProcessor extends Processor {

  constructor() {
    super();
  }

  async setCanvasContext(canvasContext, stream) {
    const pop_uuid = process.env.NEXT_PUBLIC_TRAIL_LIVE_POP_UUID;
    const api_key = process.env.NEXT_PUBLIC_TRAIL_LIVE_POP_API_KEY;

    this.endpoint = await EyePop.workerEndpoint({
      popId: pop_uuid,
      auth: {
        secretKey: api_key,
      },
      eyepopUrl: process.env.NEXT_PUBLIC_TEXT_AD_POP_API_URL,
      stopJobs: false
    }).connect()

    this.renderer = Render2d.renderer(canvasContext, [
      //Render2d.renderPose(),

      //Render2d.renderText({ fitToBounds: true }),
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

      console.log("Stream result:", result)
      this.lastPrediction = result
    }

  }

  async processFrame(canvasContext, videoRef, roi) {
    if (!this.stream) return
    if (!this.results) return
    if (!this.endpoint) return
    if (!this.renderer) return
    if (!this.lastPrediction) return


    //filter lastPrediction to only include objects.classLabel = "end of a wand"
    const filteredPrediction = {
      ...this.lastPrediction,
      objects: this.lastPrediction.objects?.filter(
        object => object.classLabel === "end of a wand" && object.confidence > 0.0)
    }

    this.renderer.draw(filteredPrediction)


    if (!filteredPrediction.objects || filteredPrediction.objects.length === 0) return

    //filter filteredPrediction.objects to the highest confidence object
    const highestConfidenceObject = filteredPrediction.objects?.reduce((prev, current) => {
      return (prev.confidence > current.confidence) ? prev : current
    })

    if (!highestConfidenceObject) return

    const ctx = canvasContext;

    const x_scale = ctx.canvas.width / filteredPrediction.source_width
    const y_scale = ctx.canvas.height / filteredPrediction.source_height

    //draw a point on the canvas at the highestConfidenceObject.center.x, highestConfidenceObject.center.y

    if (ctx) {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc((highestConfidenceObject.x + highestConfidenceObject.width / 2) * x_scale,
        (highestConfidenceObject.y + highestConfidenceObject.height / 2) * y_scale,
        5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }


}

export default TrailLiveProcessor;