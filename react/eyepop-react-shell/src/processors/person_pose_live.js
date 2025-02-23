import Processor from './processor';
import { ContourType, EndpointState, EyePop, ForwardOperatorType, InferenceType, PopComponentType, TransientPopId } from "@eyepop.ai/eyepop";
import Render2d from '@eyepop.ai/eyepop-render-2d'
import { ComposablePops } from './composable_pops';

class PersonPoseLiveProcessor extends Processor {
    buffer = [];

    // PERSON2D = {
    //     components: [
    //         {
    //             type: PopComponentType.INFERENCE,
    //             model: "eyepop.person:latest",
    //             categoryName: "person",
    //             confidenceThreshold: 0.8,
    //             forward: {
    //                 operator: {
    //                     type: ForwardOperatorType.CROP,
    //                     crop: {
    //                         maxItems: 128
    //                     },
    //                 },
    //                 targets: [
    //                     {
    //                         type: PopComponentType.TRACING,
    //                         reidModel: "eyepop.person.reid:latest",
    //                         forward: {
    //                             operator: {
    //                                 type: ForwardOperatorType.CROP,
    //                                 crop: {
    //                                     boxPadding: 0.1,
    //                                 },
    //                             },
    //                             targets: [
    //                                 {
    //                                     type: PopComponentType.INFERENCE,
    //                                     categoryName: "2d-body-points",
    //                                     model: "eyepop.person.2d-body-points:latest"
    //                                 },
    //                             ],
    //                         },
    //                     },
    //                 ],
    //             },
    //         },
    //     ],
    // };

    constructor() {
        super();
        // Additional initialization if needed
    }

    async setCanvasContext(canvasContext, stream) {
        //const pop_uuid = process.env.NEXT_PUBLIC_PERSON_POSE_POP_UUID;
        //const api_key = process.env.NEXT_PUBLIC_PERSON_POSE_POP_API_KEY;

        this.endpoint = await EyePop.workerEndpoint({
            // auth: { session: data.session },
            //popId: pop_uuid,
            //auth: {
            //    secretKey: api_key,
            //},
            //eyepopUrl: process.env.NEXT_PUBLIC_TEXT_AD_POP_API_URL,
            //stopJobs: false
            isLocalMode: true
        }).connect()

        this.endpoint.changePop(ComposablePops.Person2D);

        this.renderer = Render2d.renderer(canvasContext, [
            Render2d.renderContour(),
            Render2d.renderText({ fitToBounds: true }),
            Render2d.renderPose(),
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


        }
    }

    async processVideo(video, canvasContext, name, roi) {

        console.log('Processing video:', video);

        const cachedData = localStorage.getItem(video.name);
        if (cachedData) {
            this.buffer = JSON.parse(cachedData);
            if (this.buffer.length > 0) {
                console.log("Using cached video data.");
                return;
            }
        }

        this.buffer = []

        let results = await this.endpoint.process({
            file: video
        })

        console.log("video result:", results)

        for await (let result of results) {
            canvasContext.width = result.source_width
            canvasContext.height = result.source_height

            console.log("VIDEO RESULT", result)


            this.buffer.push(result)

            if ('event' in result && result.event.type === 'error') {
                console.log("VIDEO RESULT", result.event.message)
            }
        }

        localStorage.setItem(video.name, JSON.stringify(this.buffer));
        console.log("Cached video data.");
    }

    async processFrame(canvasContext, videoRef, roi) {
        if (!this.stream) return
        if (!this.results) return
        if (!this.endpoint) return
        if (!this.renderer) return
        if (!this.lastPrediction) return

        this.renderer.draw(this.lastPrediction)
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

    getBiggestObjectInScene(prediction, filterLabel = null) {
        if (!prediction.objects || prediction.objects.length === 0) return null

        let filteredObjects = filterLabel
            ? prediction.objects.filter(obj => obj.classLabel === filterLabel)
            : prediction.objects

        if (filteredObjects.length === 0) return {
            ...prediction,
            objects: []
        }

        return {
            ...prediction,
            objects: [filteredObjects.reduce((largest, obj) => {
                const area = obj.width * obj.height
                const largestArea = largest.width * largest.height
                return area > largestArea ? obj : largest
            }, filteredObjects[0])]
        }
    }
}

export default PersonPoseLiveProcessor;