// a class that manages the prediction data with helpers to get the people at a certain time and to build the meshes around them

export default class PredictionDataManager
{
    constructor(frameData = [], maxFrames = 1000)
    {
        this.frameData = frameData;
        this.maxFrames = maxFrames;
        this.currentFrame = null;
    }

    setFrameData(frameData)
    {
        this.frameData = frameData;
    }

    pushFrameData(frameData)
    {
        if (this.frameData.length > this.maxFrames)
        {
            this.frameData.shift();
        }

        this.frameData.push(frameData);
    }

    popFrameData()
    {
        return this.frameData.shift();
    }

    getFrameData()
    {
        return this.frameData;
    }

    hasFrameData()
    {
        return this.frameData.length > 0;
    }

    getCurrentFrame()
    {
        return this.currentFrame;
    }

    getLastFrameTime()
    {
        return this.frameData[ this.frameData.length - 1 ].seconds;
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
        this.frameData.forEach((frame) =>
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
