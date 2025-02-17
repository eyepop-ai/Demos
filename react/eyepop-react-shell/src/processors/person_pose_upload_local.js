import Processor from './processor';
import { ContourType, EndpointState, EyePop, ForwardOperatorType, InferenceType, PopComponentType, TransientPopId } from "@eyepop.ai/eyepop";
import Render2d from '@eyepop.ai/eyepop-render-2d'

class PersonPoseUploadLocal extends Processor {

    //Pop(
    //    components = [
    //        InferenceComponent(
    //            model = 'eyepop.person:latest',
    //            categoryName = "person",
    //            forward = CropForward(
    //                maxItems = 128,
    //                targets = [
    //                    InferenceComponent(
    //                        model = 'eyepop.person.2d-body-points:latest',
    //                        categoryName = "2d-body-points",
    //                        confidenceThreshold = 0.25
    //                    )
    //                ]
    //            )
    //        )
    //    ]
    //)


    PERSON2D = {
        components: [
            {
                type: PopComponentType.INFERENCE,
                model: "eyepop.person:latest",
                categoryName: "person",
                //confidenceThreshold: 0.7,
                forward: {
                    operator: {
                        type: ForwardOperatorType.CROP,
                        crop: {
                            maxItems: 128
                        },
                    },
                    targets: [
                        {
                            type: PopComponentType.INFERENCE,
                            categoryName: "2d-body-points",
                            model: "eyepop.person.2d-body-points:latest"
                        },
                    ],
                },
            },
        ],
    };
    constructor() {
        super();
        // Additional initialization if needed
    }

    async setCanvasContext(canvasContext, stream) {
        //const pop_uuid = process.env.NEXT_PUBLIC_TEXT_AD_POP_UUID;
        //const api_key = process.env.NEXT_PUBLIC_TEXT_AD_POP_API_KEY;

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

        this.endpoint.changePop(this.PERSON2D);

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
    }

    async processPhoto(photo, canvasContext) {

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

}

export default PersonPoseUploadLocal;