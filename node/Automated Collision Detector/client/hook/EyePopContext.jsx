import React, { createContext, useState, useContext, useRef, useEffect } from 'react';

import { EyePop } from "@eyepop.ai/eyepop";
import { processFrame, getVehicles, getFlowStatistics, resetCollisionDetection } from "../CollisionDetector.js";

const EyePopContext = createContext();

const EyePopProvider = ({ children }) =>
{
    const [ endpoint, setEndpoint ] = useState(undefined);
    const [ isLoadingEyePop, setLoading ] = useState(true);
    const [ inferenceData, setData ] = useState([]);
    const [ videoURL, setVideoURL ] = useState('');
    const [ isCollision, setCollision ] = useState(false);
    const [ isTraffic, setTraffic ] = useState(false);
    const [ prediction, setPrediction ] = useState(null);

    const videoRef = useRef(null);


    const eyepopInference =
        `ep_infer id=1  category-name="vehicle"
            model=eyepop-vehicle:EPVehicleB1_Vehicle_TorchScriptCuda_float32 threshold=0.5
            ! ep_infer id=2
            tracing=deepsort
            model=legacy:reid-mobilenetv2_x1_4_ImageNet_TensorFlowLite_int8
            secondary-to-id=1
            secondary-for-class-ids=<0,1,2,3,4,5>
            thread=true
            ! ep_mixer name="meta_mixer"`;

    // Initialize the EyePop.ai endpoint
    useEffect(() =>
    {
        console.log('Initializing EyePop.ai endpoint...');

        EyePop.endpoint({
            popId: '<POP_UUID>',
            auth: {
                oAuth2: true
            },
        })
            .onStateChanged((from, to) =>
            {
                console.log("EyePop.ai endpoint state transition from " + from + " to " + to);
            })
            .connect()
            .then(async (endpoint) =>
            {

                setEndpoint(endpoint);

                await endpoint.changePopComp(eyepopInference);

                setLoading(false);
            }).catch((error) =>
            {
                console.error('Failed to connect to EyePop.ai endpoint:', error);
            });

    }, []);

    function getClosestPrediction(second)
    {
        let closest = null;
        let closestDistance = Infinity;

        for (const prediction of inferenceData)
        {
            const distance = Math.abs(prediction.seconds - second);
            if (distance < closestDistance)
            {
                closest = prediction;
                closestDistance = distance;
            }
        }

        return closest;
    }


    // Analyze an image and parse results
    async function startInference(url = '')
    {
        console.log('URL:', url, endpoint);
        videoRef.current.src = url;
        videoRef.current.play();

        const results = await endpoint.process({ url: url });

        const data = [];
        // Create a promise that resolves when the video has seeked
        const seekedPromise = new Promise(resolve =>
        {
            if (!videoRef.current) { resolve(); return; }
            videoRef.current.onseeked = resolve;
        });


        for await (let result of results)
        {

            data.push(result);
            console.log('Inference length:', data.length);
            // await seekedPromise;
            if (videoRef.current)
            {
                videoRef.current.currentTime = result.seconds;
                videoRef.current.play();
            }

            const frameResults = processFrame(result);

            if (frameResults)
            {
                setCollision(frameResults.collision);
                setTraffic(frameResults.traffic);
                setPrediction(result);
            }
        }

        const inferenceObj = { "url": url, "data": data };

        // save the data to a data.json file
        //  by creating a Blob and using URL.createObjectURL and link
        const json = JSON.stringify(inferenceObj, null, 2);
        const blob = new Blob([ json ], { type: 'application/json' });
        const dataUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'data.json';
        link.click();

        setData(data);
        setVideoURL(url);

        if (!videoRef.current) return;
        videoRef.current.currentTime = 0;

        console.log('Video URL:', videoURL);
        let animationFrameId;
        let cancelTime = -1;

        const onVideoUpdate = () =>
        {
            const time = videoRef.current.currentTime;
            const closestPrediction = getClosestPrediction(time);
            const frameResults = processFrame(closestPrediction);

            if (frameResults)
            {
                setCollision(frameResults.collision);
                setTraffic(frameResults.traffic);
                setPrediction(closestPrediction);
            }

            if (frameResults.collision && Math.abs(cancelTime - time) > 1.0)
            {
                cancelTime = time;
                // Pause the loop
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            } else
            {
                // Request the next frame
                animationFrameId = requestAnimationFrame(onVideoUpdate);
            }
        }

        const onVideoStart = () =>
        {
            // Start the loop if it's not already running
            if (!animationFrameId)
            {
                console.log('Video started');
                animationFrameId = requestAnimationFrame(onVideoUpdate);
            }
        }

        videoRef.current.addEventListener('play', onVideoStart);

    }

    // Load inference data from a JSON file
    async function setInferenceData(file)
    {
        const reader = new FileReader();
        let jsonData = null;
        reader.onload = async (event) =>
        {
            if (!event.target.result)
            {
                console.error('Failed to read file:', file);
                return;
            }

            jsonData = JSON.parse(event.target.result);

            setData(jsonData.data);
            setVideoURL(jsonData.url);

        }

        reader.readAsText(file);

    }

    function reset()
    {
        resetCollisionDetection();
    }



    return (

        <EyePopContext.Provider value={{
            endpoint,
            videoURL,
            startInference,
            setInferenceData,
            videoRef,
            getClosestPrediction,
            getVehicles,
            isCollision,
            isTraffic,
            prediction,
            reset,
            getFlowStatistics
        }}>

            {
                isLoadingEyePop ?
                    <div className='absolute top-0 left-0 w-screen h-screen flex flex-col justify-center align-center object-center align-items-center'>
                        <div className='h1 text-6xl text-white text-center'>
                            Loading...
                        </div>
                        <div className='text text-white text-center'>
                            (allow popup windows to continue)
                        </div>
                    </div>
                    :

                    <div className='flex justify-center items-center h-screen'>
                        {children}
                        <video ref={videoRef} controls autoPlay crossOrigin='anonymous' src={videoURL} className='w-full hidden' ></video>
                    </div>
            }

        </EyePopContext.Provider>

    );
};

const useEyePop = () =>
{
    const context = useContext(EyePopContext);
    if (context === undefined)
    {
        throw new Error('useEyePop must be used within an EyePopProvider');
    }
    return context;
};


export { EyePopProvider, useEyePop };
