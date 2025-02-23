import Processor from './processor';
import EyePop from '@eyepop.ai/eyepop';
import Render2d from '@eyepop.ai/eyepop-render-2d'

class TextLicenseProcessor extends Processor {

  constructor() {
    super();
    // Additional initialization if needed
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

    this.renderer = Render2d.renderer(canvasContext, [
      Render2d.renderContour(),
      Render2d.renderText({ fitToBounds: true }),
      Render2d.renderBox({
        showClass: false,
        showTraceId: false,
        showNestedClasses: false,
        showConfidence: false,
      }),
    ])
  }

  async processPhoto(photo, canvasContext, name, roi) {

    console.log('Processing photo:', photo);

    let results = await this.endpoint.process({
      file: photo,
      mimeType: 'image/*',
    })

    for await (let result of results) {
      console.log(result)
      if (
        canvasContext.canvas.width !== result.source_width ||
        canvasContext.canvas.height !== result.source_height
      ) {
        canvasContext.canvas.width = result.source_width
        canvasContext.canvas.height = result.source_height
      }
      this.renderer.draw(result)

      //find Number Label
      const labels = this.LookForWord(result, 'number');
      console.log('Labels:', labels);
      if (!labels.length) return

      const labelNumber = labels[0]

      // Find the object to the right of the label in the same general y position
      const rightObject = result.objects.find(obj =>
        obj.y < labelNumber.y + labelNumber.height &&
        obj.y + obj.height > labelNumber.y &&
        obj.x > labelNumber.x + labelNumber.width
      );

      if (!rightObject) return

      canvasContext.font = '40px Arial';
      canvasContext.fillStyle = 'lightblue';
      const msg = "Found #: " + rightObject.texts[0].text;

      // Draw white background box for the coverage text
      const textWidth = canvasContext.measureText(msg).width;
      const textHeight = 40; // Height of the text
      canvasContext.fillStyle = 'white';
      canvasContext.fillRect(5, 5, textWidth + 10, textHeight + 10);

      // Draw the coverage text on top of the white box
      canvasContext.fillStyle = 'black';
      canvasContext.fillText(msg, 10, 10);

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
}

export default TextLicenseProcessor;