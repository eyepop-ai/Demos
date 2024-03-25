import EyePop from "@eyepop.ai/eyepop";
import { create } from 'zustand';

class EyePopWrapper 
{

    public config: EyePopConfig | undefined | null = undefined;
    public videoElement: HTMLVideoElement | undefined = undefined;
    public ready: boolean = false;

    private prediction: JSON | undefined = undefined;
    private endpoint: any | undefined = undefined;
    private ingressId: number | undefined = undefined;

    private stream: any | undefined = undefined;
    private egressId: number | undefined = undefined;


    /**
     * Represents the EyePopWrapper class.
     * @constructor
     * @param {EyePopConfig | null} config - The EyePop configuration object.
     */
    constructor(config: EyePopConfig | null)
    {
        this.config = config;

        this.createVideoElement();
        this.setup();
    }


    /**
     * Sets up the EyePop.ai endpoint and connects to it.
     * 
     * @remarks
     * This method initializes the EyePop.ai endpoint by providing the necessary authentication details and popId.
     * It then connects to the endpoint and logs the connection status.
     * 
     * @returns A Promise that resolves when the setup is complete.
     * 
     * @throws If there is an error initializing the EyePop.ai endpoint.
     */
    public async setup()
    {
        if (this.endpoint) return;

        try
        {
            const auth: any = {};

            if (this.config?.secretKey)
            {
                auth.secretKey = this.config?.secretKey
            } else
            {
                auth.oAuth2 = true
            }

            // API key and popID are easily obtained from the EyePop.ai dashboard
            this.endpoint = await EyePop.endpoint({
                auth: auth,
                popId: this.config?.popId,
            })
                .onStateChanged((from: string, to: string) =>
                {
                    console.log(`EyePop.ai endpoint state transition from ${from} to ${to}`);
                }).onIngressEvent(async (ingressEvent) =>
                {
                    console.log('EyePop.ai new stream detected:', ingressEvent);
                    this.egressId = Number(ingressEvent.ingressId);
                });

            await this.endpoint.connect();

            console.log('EyePop.ai endpoint connected')

        } catch (error)
        {
            console.error('Error initializing EyePop.ai:', error);
        }

    }

    /**
     * Creates a video element and appends it to the document body.
     * If an existing video element with the id 'webcam-video-eyepop' is found, it is reused.
     * Otherwise, a new video element is created and appended to the document body.
     * The video element is set to autoplay, muted, and plays inline.
     */
    private createVideoElement()
    {
        const existingVideoElement = document.getElementById('webcam-video-eyepop');
        if (existingVideoElement)
        {
            this.videoElement = existingVideoElement as HTMLVideoElement;
            return;
        }

        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('id', 'webcam-video-eyepop');
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);
        this.videoElement.setAttribute('autoplay', 'true');
        this.videoElement.setAttribute('muted', 'true');
        this.videoElement.setAttribute('playsinline', 'true');
    }

    /**
     * Starts the webcam prediction process.
     * 
     * @param ingressId - Optional ingress ID for the prediction process.
     */
    private startWebcamPrediction(ingressId?: number)
    {
        this.endpoint.process({ ingressId })
            .then((results) =>
            {
                // starts a new prediction process in the background
                setTimeout(async () =>
                {
                    console.log('Starting prediction process');
                    for await (let result of results)
                    {
                        if (result.seconds % 2 < 0.1)
                        {
                            console.log('New prediction:', result);
                        }

                        this.prediction = result;
                    }
                });
            });
    }

    /**
     * Starts the webcam stream and returns the video element.
     * If the video stream is not yet ready, it logs an error message and returns null.
     * If the stream is already active, it returns the video element.
     * 
     * @returns A Promise that resolves to the HTMLVideoElement if the webcam stream is started successfully, otherwise null.
     */
    public async startWebcamStream(): Promise<HTMLVideoElement | GlobalEventHandlers | null>
    {
        if (!this.videoElement)
        {
            console.error('Video stream not yet ready. Please wait a moment and try again.');
            return null;
        }

        if (this.stream?.active)
        {
            return this.videoElement;
        }

        const tempStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        const ingressStream = await this.endpoint?.liveIngress(tempStream);
        this.ingressId = ingressStream.ingressId();
        this.startWebcamPrediction(this.ingressId);

        this.videoElement.srcObject = tempStream;
        this.videoElement?.play();

        await new Promise((resolve) =>
        {
            if (!this.videoElement)
            {
                resolve(null);
                return;
            }

            this.videoElement.onloadedmetadata = () =>
            {
                if (!this.videoElement) return;

                this.videoElement.width = this.videoElement?.videoWidth || 0;
                this.videoElement.height = this.videoElement?.videoHeight || 0;

                resolve(this.videoElement);

                this.ready = true;
            }
        });


        return this.videoElement;

    }

    /**
     * Retrieves the media stream for the specified ingress ID.
     * If no ingress ID is provided, it uses the default egress ID.
     * @param ingressId - The ID of the ingress.
     * @returns A Promise that resolves to the MediaStream object.
     */
    public async getStream(ingressId?: number): Promise<MediaStream>
    {
        if (!ingressId)
        {
            ingressId = this.egressId;
        }

        const egress = await this.endpoint?.liveEgress(ingressId);
        return egress?.stream() || new MediaStream();
    }


    /**
     * Retrieves the prediction result.
     * 
     * @returns The prediction result in JSON format.
     */
    public getPrediction(): JSON | undefined
    {
        return this.prediction;
    }
}


type EyePopConfig = {
    popId: string;
    secretKey?: string;
}

type EyePopStore = {
    eyePop: EyePopWrapper | null;
    webcamVideo: HTMLVideoElement | null;
    initialize: (config: EyePopConfig | null | undefined) => void;
    startWebcam: () => void;
}

/**
 * EyePop Wrapper Store
 * @description A custom store for managing EyePop.ai functionality.
 */
export const useEyePop = create<EyePopStore>((set, get) => ({
    /**
     * EyePop instance
     * @type {EyePopWrapper | null}
     */
    eyePop: null,
    /**
     * Webcam video element
     * @type {HTMLVideoElement | null}
     */
    webcamVideo: null,
    /**
     * Initialize EyePop.ai
     * @param {EyePopConfig | null | undefined} config - The EyePop.ai configuration object
     * @returns {Promise<void>} A promise that resolves when EyePop.ai is initialized
     */
    initialize: (config: EyePopConfig | null | undefined): Promise<void> =>
    {
        if (!config)
        {
            console.error('Please provide a valid EyePop.ai configuration object');
            return Promise.reject();
        }

        const eyePop = new EyePopWrapper(config);

        set({ eyePop, webcamVideo: eyePop.videoElement });

        return eyePop.setup();
    },
    /**
     * Start the webcam stream
     * @returns {void}
     */
    startWebcam: (): void =>
    {
        const { eyePop } = get();

        if (!eyePop)
        {
            console.error('EyePop.ai not yet initialized. Please call initialize() first');
            return;
        }

        eyePop.startWebcamStream();
    }
}));
