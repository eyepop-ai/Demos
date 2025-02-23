import Processor from './processor';
import EyePop from '@eyepop.ai/eyepop';
import Render2d from '@eyepop.ai/eyepop-render-2d'

class CropPersonProcessor extends Processor {

  cropBuffer = [];

  constructor() {
    super();
  }

  async setCanvasContext(canvasContext, stream) {
    const pop_uuid = process.env.NEXT_PUBLIC_PERSON_POSE_POP_UUID;
    const api_key = process.env.NEXT_PUBLIC_PERSON_POSE_POP_API_KEY;

    this.endpoint = await EyePop.workerEndpoint({
      popId: pop_uuid,
      auth: {
        secretKey: api_key,
      },
      eyepopUrl: process.env.NEXT_PUBLIC_TEXT_AD_POP_API_URL,
      stopJobs: false
    }).connect()

    this.renderer = Render2d.renderer(canvasContext, [
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

      const aspectRatio = result.source_width / result.source_height
      //const canvasAspectRatio = canvasRef.current.width / canvasRef.current.height
      // const drawWidth = canvasContext.canvas.width
      // const drawHeight = canvasContext.canvas.width / aspectRatio
      // const drawWidth = canvasContext.canvas.height * aspectRatio
      // const drawHeight = canvasContext.canvas.height
      
      // canvasContext.canvas.width = drawWidth
      // canvasContext.canvas.height = drawHeight

      //console.log("Stream result:", result)
      this.lastPrediction = result
    }

  }

  async processFrame(canvasContext, videoRef, roi) {
    if (!this.stream) return
    if (!this.results) return
    if (!this.endpoint) return
    if (!this.renderer) return
    if (!this.lastPrediction) return

    //this.renderer.draw(this.lastPrediction)

    const biggestPersonPrediction = this.getBiggestObjectInScene(this.lastPrediction, 'person')
    if (biggestPersonPrediction && biggestPersonPrediction?.objects && biggestPersonPrediction.objects.length)
    {
      const biggestPerson = JSON.parse(JSON.stringify(biggestPersonPrediction.objects[0]))
      //this.renderer.draw(biggestPersonPrediction)
      if (biggestPerson) 
      {

        //normalize the coordinates to the canvas size using x/soure_width and y/source_height
        console.log("Biggest person:", biggestPerson.width,biggestPersonPrediction.source_width,canvasContext.canvas.width,(biggestPerson.x / biggestPersonPrediction.source_width) * canvasContext.canvas.width)

        biggestPerson.x = (biggestPerson.x / biggestPersonPrediction.source_width) * canvasContext.canvas.width
        biggestPerson.y =(biggestPerson.y / biggestPersonPrediction.source_height) * canvasContext.canvas.height
        biggestPerson.width = (biggestPerson.width / biggestPersonPrediction.source_width) * canvasContext.canvas.width
        biggestPerson.height = (biggestPerson.height / biggestPersonPrediction.source_height) * canvasContext.canvas.height

        console.log("Biggest person2:", biggestPerson)
        this.cropBuffer.push(biggestPerson)

        // canvasContext.strokeStyle = 'blue';
        // canvasContext.lineWidth = 5;
        // canvasContext.strokeRect(biggestPerson.x, biggestPerson.y, biggestPerson.width, biggestPerson.height);
      }
    }

    if (this.cropBuffer.length > 60) 
      this.cropBuffer.shift()

    if (!this.cropBuffer.length) return
    
    const avgPerson = this.cropBuffer.reduce((acc, person) => {
      acc.x += person.x;
      acc.y += person.y;
      acc.width += person.width;
      acc.height += person.height;
      return acc;
    }, { x: 0, y: 0, width: 0, height: 0 });

    avgPerson.x /= this.cropBuffer.length;
    avgPerson.y /= this.cropBuffer.length;
    avgPerson.width /= this.cropBuffer.length;
    avgPerson.height /= this.cropBuffer.length;

    const size = Math.max(avgPerson.width, avgPerson.height);
    const centerX = avgPerson.x + avgPerson.width / 2;
    let centerY = avgPerson.y + avgPerson.height / 2;
    let cropX = Math.max(0, centerX - size / 2);
    let cropY = Math.max(0, centerY - size / 2);

    // adjust cropX and cropY to ensure the cropped box is within the canvas bounds
    cropX = Math.min(cropX, canvasContext.canvas.width - size);
    cropY = Math.min(cropY, canvasContext.canvas.height - size);
    cropX = Math.max(0, cropX);
    cropY = Math.max(0, cropY);

    //console.log("Cropping person:", biggestPerson, "size:", size, "cropX:", cropX, "cropY:", cropY)

    // Draw the cropped box on the canvas
    // canvasContext.strokeStyle = 'white';
    // canvasContext.lineWidth = 2;
    // canvasContext.strokeRect(cropX, cropY, size, size);

    const pipBox= {
      x: 0,
      y: canvasContext.canvas.height - 400,
      width: 400,
      height: 400
    }

    canvasContext.drawImage(
      // videoRef.current
      canvasContext.canvas,
      cropX,
      cropY,
      size,
      size,
      pipBox.x,
      pipBox.y,
      pipBox.width,
      pipBox.height
    );
    //draw outline around the cropped box
    canvasContext.strokeStyle = 'white';
    canvasContext.lineWidth = 6;
    canvasContext.strokeRect(pipBox.x, pipBox.y, pipBox.width, pipBox.height);




        
  }


}

export default CropPersonProcessor;