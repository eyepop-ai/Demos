import ThirdEyePop from "../../../../utils/ThirdEyePop.js";

export default class EyePopVisualizer
{

    constructor()
    {
        this.thirdEyePop = new ThirdEyePop({
            DEBUG: true,
            canvas: null,
            videoUrl: null,
            predictionData: [],
            frameBufferSize: 1,
            smoothingAmount: 5,
            drawParams: {
                bgCanvas: null,
                showHeatmap: false,
                showPoint: false,
                showPath: false,
                showBounds: false,
                showTraceId: false,
                showPose: false,
                showFace: false,
                showHands: false,
                showCameraInCorner: false,
                showBloom: false,
                showGammaCorrection: false,
                bloomParams: {
                    strength: 1,
                    radius: .5,
                    threshold: 0.01,
                }
            }
        });

        thirdEyePop.setup();

        thirdEyePop.pushPredictionData(data);
    }


}
