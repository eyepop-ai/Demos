import { EyePopSdk } from "@eyepop.ai/eyepop";
// import EyePopVisualizer from "./EyePopVisualizer.js"

export default class EyePopManager
{
    static instance = null;

    constructor(resultCanvasRef, videoRef, popNameRef, startButtonRef, setters = { setProgress, setLoading })
    {
        if (EyePopManager.instance)
        {
            return EyePopManager.instance;
        }

        this.startButtonRef = startButtonRef.current;
        this.resultCanvasRef = resultCanvasRef.current;
        this.videoRef = videoRef.current;
        this.popNameElement = popNameRef.current;

        // this.eyePopVisualizer = new EyePopVisualizer();

        this.endpoint = undefined;
        this.popSession = undefined;
        this.popPlotter = undefined;
        this.popLiveIngress = undefined;
        this.context = undefined;

        this.webcam = undefined;

        this.predictionData = [];

        this.setProgress = setters.setProgress;
        this.setLoading = setters.setLoading;

        this.stop = false;
        this.isJobRunning = false;

        this.setProgress(0);
        this.setLoading(true);

        this.setup();
        EyePopManager.instance = this;
    }

    setWebcam(deviceID)
    {
        this.webcam = { id: deviceID };
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

    async toggleStart()
    {
        const scope = EyePopManager.instance;

        // if it's not running, start it
        if (!scope.isJobRunning)
        {
            scope.startButtonRef.innerHTML = "Stop";
            await scope.startWebcamIngress();
            scope.setLoading(false);
            return;
        }

        scope.setLoading(true);
        scope.startButtonRef.innerHTML = "Start";
        await scope.popLiveIngress.close();

        scope.webcam.stream.getTracks()
            .forEach((track) =>
            {
                track.stop();
            });

        scope.isJobRunning = false;
    }

    async setup()
    {

        this.popNameElement.innerHTML = "Loading...";

        const isAuthenticated = await this.authenticate();
        const isConnected = await this.connect();

        if (!isAuthenticated || !isConnected)
        {
            this.setErrorMessage("Error authenticating you pop...");
            return;
        }

        this.context = this.resultCanvasRef.getContext("2d");
        this.popPlotter = EyePopSdk.plot(this.context);

        this.setLoading(false);

        console.log("Pop Manager setup complete. ", this.popSession);
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

    async startWebcamIngress()
    {
        const scope = EyePopManager.instance;

        scope.isJobRunning = true;
        scope.webcam.stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: scope.webcam.id } });
        scope.videoRef.srcObject = scope.webcam.stream;
        scope.videoRef.play();

        try
        {
            scope.popLiveIngress = await scope.endpoint.liveIngress(scope.webcam.stream);
        } catch (error)
        {
            console.error("Failed to call liveIngress:", error);
        }
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

    startLiveInference(ingressId)
    {
        this.endpoint.process({ ingressId: ingressId }).then(async (results) =>
        {
            for await (let result of results)
            {
                console.log('Result:', result);
            }
        })
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


    disconnect()
    {
        this.endpoint.disconnect();
    }

}
