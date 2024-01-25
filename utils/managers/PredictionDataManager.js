// a class that manages the prediction data with helpers to get the people at a certain time and to build the meshes around them

export default class PredictionDataManager
{
    constructor(predictionData = [], maxFrames = 1000)
    {
        this.predictionData = predictionData;
        this.maxFrames = maxFrames;
        this.currentFrame = null;
    }

    setPredictionData(predictionData)
    {
        this.predictionData = predictionData;
    }

    pushPredictionData(predictionData)
    {
        if (this.predictionData.length > this.maxFrames)
        {
            this.predictionData.shift();
        }

        this.predictionData.push(predictionData);
    }

    popPredictionData()
    {
        return this.predictionData.shift();
    }

    getPredictionData()
    {
        return this.predictionData;
    }

    hasPredictionData()
    {
        return this.predictionData.length > 0;
    }

    getCurrentFrame()
    {
        return this.currentFrame;
    }

    getLastFrameTime()
    {
        return this.predictionData[ this.predictionData.length - 1 ].seconds;
    }

    getCurrentFrameTime()
    {
        if (!this.currentFrame || !this.currentFrame.seconds)
        {
            return 0;
        }

        return this.currentFrame.seconds;
    }

    // TODO: 
    //  - make this more efficient
    setCurrentFrame(time)
    {
        let closestFrame = null;
        let closestTime = null;
        this.predictionData.forEach((frame) =>
        {
            if (!frame) return;
            let frameTime = frame.seconds;
            if (closestTime === null || Math.abs(frameTime - time) < Math.abs(closestTime - time))
            {
                closestFrame = frame;
                closestTime = frameTime;
            }
        });
        this.currentFrame = closestFrame;

        return closestFrame;
    }

}
