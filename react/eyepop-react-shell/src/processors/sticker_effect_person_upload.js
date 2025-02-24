import Processor from './processor';
import EyePop from '@eyepop.ai/eyepop';
import Render2d from '@eyepop.ai/eyepop-render-2d'
import { ComposablePops } from './composable_pops';

class StickerPersonProcessor extends Processor {
    buffer = [];

    constructor() {
        super();
        // Additional initialization if needed
    }

    async setCanvasContext(canvasContext, stream) {
        const api_key = process.env.NEXT_PUBLIC_PERSON_POSE_POP_API_KEY;

        this.endpoint = await EyePop.workerEndpoint({
            // auth: { session: data.session },
            popId: 'transient',
            auth: {
                secretKey: api_key,
            },
            eyepopUrl: process.env.NEXT_PUBLIC_TEXT_AD_POP_API_URL,
            stopJobs: false
        }).connect()

        //await this.endpoint.changePop(ComposablePops.SAM2);

        await this.endpoint.changePop(ComposablePops.PersonSAM2)

        this.renderer = Render2d.renderer(canvasContext, [
            Render2d.renderContour(),
            // Render2d.renderText({ fitToBounds: true }),
            // Render2d.renderPose(),
            // Render2d.renderBox({
            //     showClass: false,
            //     showTraceId: false,
            //     showNestedClasses: false,
            //     showConfidence: false,
            // }),
        ])
    }

    async processPhoto(photo, canvasContext, name, roi) {

        console.log('Processing photo:', photo, roi);

        let drawResult = null;

        const cachedData = localStorage.getItem(name+JSON.stringify(roi));
        if (cachedData) {
            drawResult = JSON.parse(cachedData);
        }

        if (!drawResult) {

            // if (roi.length == 2) {
            //     roi = { topLeft: { x: roi[0].x, y: roi[0].y }, bottomRight: { x: roi[1].x, y: roi[1].y } };
            //     console.log("Using ROI:", roi);

            // } else {
            //     roi = { topLeft: { x: 0, y: 0 }, bottomRight: { x: photo.width, y: photo.height } };
            //     console.log("No ROI provided, using full image");
            // }

            console.log("Processing photo with ROI:", { boxes: [roi] });

            let results = await this.endpoint.process({
                file: photo,
                mimeType: 'image/*',
                // roi: { boxes: [roi] }
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

                drawResult = result
            }
        }

        if (!drawResult) return;
        if (!drawResult.objects || !drawResult.objects.length > 0)
            return

        drawResult.raw = null;

        localStorage.setItem(name, JSON.stringify(drawResult));

        console.log("Drawing mask for photo:", drawResult)

        canvasContext.canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                const contours = drawResult.objects[0].objects[0].contours
                //const contours = drawResult.objects[0].contours
                this.liftContour(canvasContext, contours, img)
                URL.revokeObjectURL(url);
            };
            img.src = url;
        });
    }

    liftContour(context, contours, snapshot) {
        context.drawImage(
            snapshot, //videoRef.current,
            0,
            0,
            context.canvas.width,
            context.canvas.height
        )
        context.save()

        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        const xScale = 1
        const xOffset = 0
        const yScale = 1
        const yOffset = 0

        for (let j = 0; j < contours.length; j++) {
            const contour = contours[j]

            if (!contour.points)
                continue

            let p = contour.points[contour.points.length - 1];
            context.moveTo(p.x * xScale + xOffset, p.y * yScale + yOffset);
            for (let i = 1; i < contour.points.length - 2; i++) {
                const cp1x = (contour.points[i].x + contour.points[i + 1].x) / 2 * xScale + xOffset;
                const cp1y = (contour.points[i].y + contour.points[i + 1].y) / 2 * yScale + yOffset;
                const cp2x = (contour.points[i + 1].x + contour.points[i + 2].x) / 2 * xScale + xOffset;
                const cp2y = (contour.points[i + 1].y + contour.points[i + 2].y) / 2 * yScale + yOffset;
                context.bezierCurveTo(
                    cp1x, cp1y,
                    cp2x, cp2y,
                    contour.points[i + 2].x * xScale + xOffset,
                    contour.points[i + 2].y * yScale + yOffset
                );
            }
            // Connect the last two points
            const lastPoint = contour.points[contour.points.length - 1];
            context.lineTo(lastPoint.x * xScale + xOffset, lastPoint.y * yScale + yOffset);
        }
        context.closePath();


        context.lineWidth = 20; // Set the desired thickness
        context.strokeStyle = "#FFFFFF";   // Set the desired color
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.stroke(); // Draw the outline'

        // Clip to the contour
        context.clip();
        context.drawImage(
            snapshot, //videoRef.current,
            0,
            0,
            context.canvas.width,
            context.canvas.height
        )

        context.restore();
    }

   
    async processFrame(canvasContext, video, roi) {

        //console.log('Processing video frame:', video, this.endpoint, this.renderer);
        if (!this.endpoint) return
        if (!this.renderer) return
        if (!video) return
        if (!video?.currentTime) return
        if (!this.buffer?.length) return

        const currentTime = video.currentTime;
        let currentFrame = this.getClosestPrediction(currentTime)

        if (currentFrame) {
            if (canvasContext.canvas.width !== currentFrame.source_width ||
                canvasContext.canvas.height !== currentFrame.source_height) {
                canvasContext.canvas.width = currentFrame.source_width
                canvasContext.canvas.height = currentFrame.source_height
            }

            if (!currentFrame.objects || !currentFrame.objects.length > 0)
                return

            // Filter to most prominent object by area
            currentFrame = this.getBiggestObjectInScene(currentFrame, "person")

            this.renderer.draw(currentFrame)
            this.lastPrediction = currentFrame
        }
    }

    getClosestPrediction(seconds) {
        if (this.buffer.length === 0) return null
        return this.buffer.reduce((prev, curr) => {
            if (!prev) return curr
            if (!curr.seconds) return prev
            if (!prev.seconds) return curr
            return Math.abs(curr.seconds - seconds) < Math.abs(prev.seconds - seconds)
                ? curr
                : prev
        })
    }

}

export default StickerPersonProcessor;