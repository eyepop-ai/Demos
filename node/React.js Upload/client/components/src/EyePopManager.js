import { EyePopSdk } from "@eyepop.ai/eyepop";


export default class EyePopManager
{
    static instance = null;

    constructor({ previewImageRef, previewVideoRef, resultCanvasRef, popNameRef, setters = { setProgress, setLoading, setIsVideo } })
    {
        if (EyePopManager.instance)
        {
            return EyePopManager.instance;
        }
        this.previewImageRef = previewImageRef.current;
        this.previewVideoRef = previewVideoRef.current;
        this.resultCanvasRef = resultCanvasRef.current;
        this.popNameElement = popNameRef.current;

        this.endpoint = undefined;
        this.popSession = undefined;
        this.popPlotter = undefined;
        this.context = undefined;

        this.predictionData = [];

        this.setProgress = setters.setProgress;
        this.setLoading = setters.setLoading;
        this.setIsVideo = setters.setIsVideo;
        this.stop = false;
        this.isJobRunning = false;

        this.setProgress(0);
        this.setLoading(true);

        this.setup();
        this.upload = this.upload.bind(this);
        EyePopManager.instance = this;
    }

    setErrorMessage(message)
    {
        this.popNameElement.innerHTML = message;
        this.popNameElement.classList = [];
        this.popNameElement.classList.add('w-full', 'text-center', 'text-red-800', 'font-bold', 'text-sm', 'overflow-y-scroll', 'h-44', 'select-text');

        const parent = this.popNameElement.parentElement;
        const copy = this.popNameElement.cloneNode(true);

        console.log(parent)
        // remove all children from the parent without a loop
        parent.innerHTML = '';

        // make a clone of popNameElement and append it to the parent
        parent.appendChild(copy);
        parent.classList.remove('h-full')
        parent.classList.add('bg-black', 'h-44');

    }

    async setup()
    {
        const isAuthenticated = await this.authenticate();
        const isConnected = await this.connect();

        if (!isAuthenticated || !isConnected)
        {
            this.setErrorMessage("Error connecting to EyePop...");
            return;
        }

        this.context = this.resultCanvasRef.getContext("2d");
        this.popPlotter = EyePopSdk.plot(this.context);

        this.previewVideoRef.addEventListener('timeupdate', this.onVideoSync.bind(this));

        this.setLoading(false);

        console.log("Pop Manager setup complete. ", this.popSession);
    }

    onVideoSync(event)
    {
        const scope = EyePopManager.instance;
        const closest = scope.getClosestPrediction(event.target.currentTime);
        scope.drawPrediction(closest);
    }

    async authenticate()
    {
        try
        {
            const response = await fetch('/eyepop/session');
            const data = await response.json();

            console.log('Created new EyePop session:', data);
            this.popSession = data;

            if ('error' in this.popSession)
            {
                this.setErrorMessage("Authentication Failed... " + JSON.stringify(data));
                return false;
            }

            return true;

        } catch (error)
        {
            console.error('Authentication failed:', error);

            this.setErrorMessage("Authentication Error... " + error);

            return false;
        }
    }

    async connect()
    {
        if (this.endpoint) return false;
        if (!this.popSession) return false;

        this.popNameElement.innerHTML = "Loading...";

        try
        {

            this.endpoint = await EyePopSdk.endpoint({
                auth: { session: this.popSession },
                popId: this.popUUID
            }).onStateChanged((from, to) =>
            {
                console.log("Endpoint state transition from " + from + " to " + to);
            }).onIngressEvent((ingressEvent) =>
            {
                console.log(ingressEvent);
            }).connect();

            this.popNameElement.innerHTML = this.endpoint.popName();

            return true;

        } catch (error)
        {

            console.error('Connection failed:', error);
            this.setErrorMessage("Connection Error..." + JSON.stringify(error));
            return false;
        }
    }

    async upload(event)
    {
        const scope = EyePopManager.instance;

        scope.setProgress(0);
        // scope.stopRunningJobs(scope);

        const file = event.target.files[ 0 ];
        const isVideo = file.type.startsWith('video/');

        scope.predictionData = [];

        scope.setIsVideo(isVideo);

        if (isVideo)
        {
            scope.uploadVideo(scope, file);
        } else
        {
            scope.uploadImage(scope, file);
        }

    }

    async uploadVideo(scope = this, file)
    {

        scope.previewVideoRef.src = URL.createObjectURL(file);
        scope.previewVideoRef.play();

        const videoDuration = await scope.getVideoDuration(scope.previewVideoRef);

        scope.previewVideoRef.currentTime = 0;
        scope.previewVideoRef.pause();

        scope.endpoint.process({ file: file }).then(async (results) =>
        {
            scope.isJobRunning = true;
            let frameCount = 0;
            for await (let result of results)
            {
                // console.log("Prediction result: ", result);

                scope.predictionData.push(result);

                const progress = ((result).seconds / videoDuration) * 100;

                scope.setProgress(progress);

                frameCount += 1;

                if (frameCount % 5 === 0)
                {
                    scope.drawPrediction(result);
                    scope.previewVideoRef.currentTime = result.seconds;
                }

                if (scope.stop)
                {
                    results.cancel();
                }
            }

            scope.isJobRunning = false;
            scope.previewVideoRef.currentTime = 0;

            if (scope.stop)
            {
                scope.stop = false;
                scope.previewVideoRef.pause();
                scope.setProgress(0);
                console.log("Stopping job...");
            } else
            {
                scope.previewVideoRef.play();
                scope.setProgress(100);
            }

        });
    }

    async uploadImage(scope = this, file)
    {

        scope.previewImageRef.src = URL.createObjectURL(file);

        scope.endpoint.process({ file: file }).then(async (results) =>
        {
            for await (let result of results)
            {
                console.log("Prediction result: ", result);

                scope.drawPrediction(result);
            }

            scope.setProgress(100);
        });
    }

    drawPrediction(result)
    {
        if (!this.context) return;
        if (!result) return;

        this.resultCanvasRef.width = result.source_width;
        this.resultCanvasRef.height = result.source_height;
        this.context.clearRect(0, 0, this.resultCanvasRef.width, this.resultCanvasRef.height);
        this.popPlotter.prediction(result);
    }

    getClosestPrediction(time)
    {
        if (this.predictionData.length === 0) return;

        let closest = this.predictionData[ 0 ];
        let closestDifference = Math.abs(this.predictionData[ 0 ].seconds - time);

        for (let i = 0; i < this.predictionData.length; i++)
        {
            const diff = Math.abs(this.predictionData[ i ].seconds - time);
            closestDifference = Math.abs(closest.seconds - time);

            if (diff < closestDifference)
            {
                closest = this.predictionData[ i ];
            }


        }

        console.log('Closest prediction: ', closestDifference, closest.seconds, time);

        return closest;
    }

    getVideoDuration(video)
    {
        return new Promise((resolve) =>
        {
            video.onloadedmetadata = () =>
            {
                video.pause();
                resolve(video.duration);
            };
        });
    }

    stopRunningJobs(scope = this)
    {
        if (scope.isJobRunning)
        {
            scope.stop = true;
        }
    }

    disconnect()
    {
        this.endpoint.disconnect();
    }

}
