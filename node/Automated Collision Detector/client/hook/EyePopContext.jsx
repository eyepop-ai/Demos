import React, { createContext, useState, useContext, useRef, useEffect } from 'react';

import { EyePop } from "@eyepop.ai/eyepop";
import { processFrame, getVehicles, getFlowStatistics, resetCollisionDetection } from "../CollisionDetector.js";
import { once } from 'events';
import * as THREE from 'three';

const EyePopContext = createContext();

const EyePopProvider = ({ children }) =>
{
    const [ endpoint, setEndpoint ] = useState(undefined);
    const [ isLoadingEyePop, setLoading ] = useState(true);
    const [ data, setData ] = useState([]);
    const [ videoURL, setVideoURL ] = useState('');
    const [ isCollision, setCollision ] = useState(false);
    const [ isTraffic, setTraffic ] = useState(false);
    const [ prediction, setPrediction ] = useState(null);
    const [ progress, setProgress ] = useState(0);
    const [ errorMessage, setErrorMessage ] = useState(null);
    const [ saveResult, setSaveResult ] = useState(true);
    const [ firstPoint, setFirstPoint ] = useState(null);
    const [ secondPoint, setSecondPoint ] = useState(null);
    const [ videoLoop, setVideoLoop ] = useState(null);

    const [ videoTexture, setVideoTexture ] = useState(null);
    const [ aspect, setAspect ] = useState(1);


    const videoRef = useRef(null);
    const maskCanvasRef = useRef(null);


    const eyepopInference =
        `ep_infer id=1  category-name="vehicle"
            model=eyepop-vehicle:EPVehicleB1_Vehicle_TorchScriptCuda_float32 threshold=0.5
        ! ep_infer id=2
            tracing=deepsort,max_age=5.0,iuo_threshold=0.1
            secondary-to-id=1
            secondary-for-class-ids=<0,1,2,3,4,5>
           thread=true`;

    // Initialize the EyePop.ai endpoint
    useEffect(() =>
    {
        console.log('Initializing EyePop.ai endpoint...');

        setLoading(true);
        EyePop.endpoint({
            popId: `transient`,
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

                await endpoint.changePopComp(eyepopInference);

                setEndpoint(endpoint);

                setLoading(false);
            }).catch((error) =>
            {
                console.error('Failed to connect to EyePop.ai endpoint:', error);
                setErrorMessage(error.message);
                setLoading(true);
            });

    }, []);

    function getClosestPrediction(second, inferenceData)
    {
        let closest = null;
        let closestDistance = Infinity;
        if (!inferenceData) return closest;

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

    const readFile = async (file) =>
    {
        return new Promise((resolve, reject) =>
        {
            const reader = new FileReader();
            reader.onload = (event) =>
            {
                if (!event.target.result)
                {
                    reject('Failed to read file:', file);
                    return;
                }
                resolve(event.target.result);
            }
            reader.readAsDataURL(file);
        })
    }

    const setVideoProperties = () =>
    {
        maskCanvasRef.current.width = videoRef.current.videoWidth;
        maskCanvasRef.current.height = videoRef.current.videoHeight;

        const aspect = videoRef.current.videoWidth / videoRef.current.videoHeight;

        setAspect(aspect + Math.random() * 0.0001);
        videoRef.current.crossOrigin = "anonymous";
        const texture = new THREE.VideoTexture(videoRef.current);
        texture.generateMipmaps = true;

        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;

        texture.needsUpdate = true;

        setVideoTexture(texture);

        console.log('Video Properties:', videoRef.current.videoWidth, videoRef.current.videoHeight, aspect, texture);
    }

    // Helper function to convert a Base64 string to a Blob
    const base64ToBlob = (base64, mimeType = 'video/mp4') =>
    {
        const byteString = atob(base64.split(',')[ 1 ]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++)
        {
            ia[ i ] = byteString.charCodeAt(i);
        }
        return new Blob([ ab ], { type: mimeType });
    };


    const resetVideoProperties = () =>
    {
        reset();
        setData([]);
        setErrorMessage(null);
        setProgress(0);
        videoLoop && cancelAnimationFrame(videoLoop);
        setVideoURL(null);
        setLoading(false);
        setCollision(false);
    }
    // Analyze an image and parse results
    async function start(file)
    {

        if (videoRef.current)
        {
            videoRef.current.src = '';
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }

        resetVideoProperties();

        let url = null

        if (file.type !== 'video/mp4')
        {
            setLoading(false);
            // convert file to json file
            let fileData = await readFile(file)

            fileData = fileData.split(',')[ 1 ];
            fileData = atob(fileData);

            let jsonData = null;
            jsonData = JSON.parse(fileData)

            const tempData = jsonData.data;
            const videoBlob = base64ToBlob(jsonData.videoBase64);
            url = URL.createObjectURL(videoBlob);
            videoRef.current.src = url;
            videoRef.current.load();
            videoRef.current.currentTime = 0;
            await once(videoRef.current, 'loadeddata');

            setVideoProperties()
            setVideoURL(url);
            playVideo(tempData);

            return
        }

        url = URL.createObjectURL(file);
        videoRef.current.src = url;
        setVideoURL(url);

        let results = null;

        //wait for video to load
        videoRef.current.load();
        videoRef.current.currentTime = 0;

        await once(videoRef.current, 'loadeddata');
        setVideoURL(url + "");

        setLoading(true);

        setVideoProperties()

        try
        {
            results = await endpoint.process({
                file: file,
                mimeType: file.type,
            })
        } catch (e)
        {
            console.error(e)
            setErrorMessage(e.message);
            setLoading(true)
        }


        const localDataArray = [];

        setLoading(true);
        setProgress(0.1);


        for await (let result of results)
        {
            videoRef.current.currentTime = result.seconds;
            localDataArray.push(result);

            if ('event' in result && result.event.type === 'error')
            {
                setErrorMessage(result.event.message);
                results.cancel()
                setLoading(true);
                throw new Error(result.event.message)
            }

            let videoLength = videoRef.current?.duration;
            let progress = Math.round((result.seconds / videoLength) * 100);

            setProgress(progress ?? result.seconds);
            console.log('Inference Progress:', progress);
        }

        setLoading(false);
        playVideo(localDataArray);

        setData(localDataArray);

        if (!saveResult) return

        // Assuming `url` is the object URL of the file you want to convert to Base64
        fetch(url).then(response => response.blob()).then(async (blob) =>
        {
            const base64data = await readFile(file)

            // Create a JSON object including the Base64 data
            const jsonData = JSON.stringify({
                data: localDataArray,
                videoBase64: base64data // Store the Base64 string
            });

            // Convert the JSON object to a blob
            const jsonBlob = new Blob([ jsonData ], { type: 'application/json' });
            const saveData = URL.createObjectURL(jsonBlob);

            // Use the same method to create a link and trigger the download
            const link = document.createElement('a');
            link.setAttribute('href', saveData);
            link.setAttribute('download', file.name + '.json');
            document.body.appendChild(link); // Append to the document
            link.click();
            link.remove();

            // Optionally, revoke the object URL if it's no longer needed
            URL.revokeObjectURL(saveData);

        });

    }


    function cancelAllAnimationFrames()
    {
        var id = window.requestAnimationFrame(function () { })
        while (id--)
        {
            window.cancelAnimationFrame(id)
        }
    }



    function playVideo(dataParam)
    {

        if (videoLoop)
        {
            console.log('Previous loop stopped:', videoURL);
            cancelAnimationFrame(videoLoop);
        }

        const videoLoopAnimation = () =>
        {
            const time = videoRef.current.currentTime;

            const closestPrediction = getClosestPrediction(time + .15, dataParam);
            setPrediction(closestPrediction);

            const frameResults = processFrame(closestPrediction);

            if (frameResults)
            {
                setCollision(frameResults.collision);
                setTraffic(frameResults.traffic);
            }

            setVideoLoop(requestAnimationFrame(videoLoopAnimation));
        };

        videoRef.current.onended = () =>
        {
            videoLoop && cancelAnimationFrame(videoLoop);
        }

        setVideoLoop(requestAnimationFrame(videoLoopAnimation));

        videoRef.current.currentTime = 0;
        videoRef.current.loop = true
        videoRef.current.autoplay = true
        videoRef.current.play();

    }

    function reset()
    {
        resetCollisionDetection();
    }

    return (

        <EyePopContext.Provider value={{
            endpoint,
            videoURL,
            videoRef,
            getClosestPrediction,
            getVehicles,
            isCollision,
            isTraffic,
            prediction,
            reset,
            getFlowStatistics,
            start,
            setSaveResult,
            saveResult,
            firstPoint,
            secondPoint,
            setFirstPoint,
            setSecondPoint,
            maskCanvasRef,
            videoTexture,
            aspect,
        }}>

            {

                isLoadingEyePop &&

                <div className='absolute top-0 left-0 w-screen h-screen flex flex-col justify-center align-center object-center align-items-center z-50 bg-black'>
                    <div className='h1 text-6xl text-white text-center'>
                        {progress <= 0 ? 'Loading...' : 'Predicting...'}
                    </div>
                    <div className={`'text text-white text-center w-full ' ${progress <= 0 ? 'visible' : 'hidden'}`}>
                        (allow popup windows to continue)
                    </div>

                    <span className={`'flex justify-center items-center w-full text-4xl text-white text-center ' ${progress > 0 ? 'visible' : 'hidden'}`}>
                        {progress}% complete
                    </span>
                </div>
            }

            {errorMessage && <div className='absolute top-0 left-0 w-screen h-screen flex flex-col justify-center align-center object-center align-items-center z-50 bg-black text-5xl text-red-500'>
                {errorMessage}
            </div>
            }

            <canvas ref={maskCanvasRef} id='maskCanvas' className='hidden'></canvas>

            <div className='flex justify-center items-center h-screen w-screen'>
                <video ref={videoRef} controls playsInline autoPlay loop crossOrigin='anonymous' src={videoURL} className='w-full hidden' ></video>
                {children}
            </div>

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
