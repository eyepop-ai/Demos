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
    if (!this.stream || !this.results || !this.endpoint || !this.renderer || !videoRef) return;
  
    if(this.lastPrediction) {
      // Get the biggest person prediction
      const biggestPersonPrediction = this.getBiggestObjectInScene(this.lastPrediction, 'person');
      if (biggestPersonPrediction && biggestPersonPrediction.objects && biggestPersonPrediction.objects.length) {
        const biggestPerson = JSON.parse(JSON.stringify(biggestPersonPrediction.objects[0]));
        if (biggestPerson) {
          // Normalize the coordinates to the canvas size
          biggestPerson.x = (biggestPerson.x / biggestPersonPrediction.source_width) * canvasContext.canvas.width;
          biggestPerson.y = (biggestPerson.y / biggestPersonPrediction.source_height) * canvasContext.canvas.height;
          biggestPerson.width = (biggestPerson.width / biggestPersonPrediction.source_width) * canvasContext.canvas.width;
          biggestPerson.height = (biggestPerson.height / biggestPersonPrediction.source_height) * canvasContext.canvas.height;
    
          this.cropBuffer.push(biggestPerson);
          if (this.cropBuffer.length > 60) this.cropBuffer.shift();
        }
      }
    }
  

    if (!this.cropBuffer.length) return;
  
    // Average the coordinates over the buffer
    const avgPerson = this.cropBuffer.reduce(
      (acc, person) => {
        acc.x += person.x;
        acc.y += person.y;
        acc.width += person.width;
        acc.height += person.height;
        return acc;
      },
      { x: 0, y: 0, width: 0, height: 0 }
    );
  
    const count = this.cropBuffer.length;
    avgPerson.x /= count;
    avgPerson.y /= count;
    avgPerson.width /= count;
    avgPerson.height /= count;
  
    // Determine the crop square size as the smaller of the average width and height
    let size = Math.min(avgPerson.width, avgPerson.height);
  
    // Calculate the ideal center of the bounding box
    let centerX = avgPerson.x + avgPerson.width / 2;
    let centerY = avgPerson.y + avgPerson.height / 2;
  
    // Clamp the center so that the square crop stays fully within the canvas boundaries
    const videoAspectRatio = videoRef.videoWidth / videoRef.videoHeight;

    const canvasWidth = canvasContext.canvas.width / videoAspectRatio;
    const canvasHeight = canvasContext.canvas.height;

    centerX = Math.max(size / 2, Math.min(centerX, canvasWidth - size / 2));
    centerY = Math.max(size / 2, Math.min(centerY, canvasHeight - size / 2));
  
    // Calculate the top-left coordinates of the crop region
    let cropX = Math.min(centerX - size / 2, canvasWidth - size)
    let cropY = Math.min(centerY - size / 2, canvasHeight - size)

    // Define the picture-in-picture (pip) box dimensions
    const pipBox = {
      x: 0,
      y: canvasHeight - 400,
      width: 400,
      height: 400
    };
  
    // Draw the cropped image from the canvas into the pip box
    canvasContext.drawImage(
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
  
    // Optionally, draw an outline around the pip box
    canvasContext.strokeStyle = 'white';
    canvasContext.lineWidth = 6;
    canvasContext.strokeRect(pipBox.x, pipBox.y, pipBox.width, pipBox.height);
  }


}

export default CropPersonProcessor;