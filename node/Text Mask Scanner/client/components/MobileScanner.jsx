import React, { useEffect, useState, videoRef, resultCanvasRef, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faCancel, faGear, faRepeat, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { EyePop } from "@eyepop.ai/eyepop";
import { Render2d } from '@eyepop.ai/eyepop-render-2d';
import MaskCanvas, { drawGradient } from './MaskCanvas';
import SettingsDialog from './SettingsDialog';
import { search, fuzzy } from 'fast-fuzzy';
import { ResultsOverlay } from './ResultsOverlay';

let isDrawing = false;

const names = [
    "Tito's",
    "Jack Daniel's",
    "Jameson",
    "Grey Goose",
    "Patrón",
    "Hendrick's",
    "Absolut",
    "Bacardi",
    "Johnnie Walker",
    "Smirnoff",
    "Hennessy",
    "Maker's Mark",
    "Jim Beam",
    "Jose Cuervo",
    "Belvedere",
    "Cîroc",
    "Glenfiddich",
    "Captain Morgan",
    "Crown Royal",
    "Ketel One",
    "Old Harbor Distilling Co.",
    "Cutwater Spirits",
    "Malahat Spirits Co.",
    "Liberty Call Distilling",
    "You & Yours Distilling Co.",
    "ReBru Spirits",
    "619 Spirits",
    "San Diego Distillery",
    "Henebery Spirits",
    "Malahat Spirits Co.",
    "Pacific Spirits",
    "Oceanside Distillers",
    "Seven Caves Spirits",
    "Ampersand Distilling",
    "Copper Collar Distillery",
    "The California Spirits Company",
    "Swinford Spirits",
    "Perfect Soul Whiskey Co.",
    "Misadventure & Co.",
    "Shadow Ridge Spirits Co."
];

const MobileScanner = ({ }) =>
{

    const resultCanvasRef = useRef();
    const videoRef = useRef();
    const popNameRef = useRef();

    const sharedClass = 'object-contain h-full w-full d-block aboslute flex-none';
    const marginsStyle = 'p-4 mt-[2rem] ml-5 mr-5 w-[40rem] md:ml-[10rem] md:mr-[10rem]';
    const settingsRef = useRef();
    const compositionCanvasRef = useRef();
    const maskRef = useRef();

    const [ matchedString, setMatchedString ] = useState('');
    const [ labelsList, setLabelsList ] = useState([]);
    const [ croppedImage, setCroppedImage ] = useState(null);

    const [ loading, setLoading ] = useState(true);
    const [ eyePopEndpoint, setEyePopEndpoint ] = useState(null);
    const [ webcamDevices, setWebcamDevices ] = useState([]);
    const [ selectedWebcam, setSelectedWebcam ] = useState(null);
    const [ videoPlaying, setVideoPlaying ] = useState(false);
    const [ popUUID, setPopUUID ] = useState(null);
    const [ popSecret, setPopSecret ] = useState(null);

    const [ canvasCtx, setCanvasCtx ] = useState(null);
    const [ maskRect, setMaskRect ] = useState({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });
    const [ maskSize, setMaskSize ] = useState({ width: window.innerWidth, height: window.innerHeight });
    let startX, startY;


    useEffect(() =>
    {
        if (webcamDevices.length > 0) return;
        if (!loading) return;

        populateWebcamDevices();

    }, [ loading ]);

    useEffect(() =>
    {
        if (!resultCanvasRef.current) return;
        if (!videoRef.current) return;
        if (!settingsRef.current) return;

        if (!popUUID || !popSecret)
        {
            settingsRef.current.showModal();
            return;
        } else
        {
            settingsRef.current.close();
        }

        const ctx = resultCanvasRef.current.getContext('2d');
        setCanvasCtx(ctx);

        async function setupEyePop()
        {
            try
            {
                // Set the endpoint
                const endpoint = await EyePop.endpoint({
                    isSandbox: false,
                    popId: popUUID,
                    auth: { secretKey: popSecret },
                    eyepopUrl: 'https://staging-api.eyepop.ai',
                }).onStateChanged((from, to) =>
                {
                    console.log("Endpoint state transition from " + from + " to " + to);
                }).onIngressEvent((event) =>
                {
                    console.log('Ingress event:', event);
                }).connect();

                popNameRef.current.innerText = endpoint.popName();

                setEyePopEndpoint(endpoint);

            } catch (error)
            {
                console.error('Error parsing mobile data:', error);
                settingsRef.current.showModal();
                alert('Pop Failed to load. Verify UUID', error);
                // window.location.reload();
            } finally
            {
                setLoading(false);
            }
        }

        setupEyePop();

        let animationLoop = null;
        let isMaskInitialized = false;
        const blitVideoAnimation = () =>
        {
            const source_height = videoRef.current.videoHeight;
            const source_width = videoRef.current.videoWidth;

            const parentWidth = resultCanvasRef.current.parentElement.clientWidth;
            const parentHeight = resultCanvasRef.current.parentElement.clientHeight;

            const scaleFactor = Math.min(parentWidth / source_width, parentHeight / source_height);
            const scaledWidth = source_width * scaleFactor;
            const scaledHeight = source_height * scaleFactor;

            resultCanvasRef.current.width = scaledWidth;
            resultCanvasRef.current.height = scaledHeight;

            ctx.drawImage(videoRef.current, 0, 0, scaledWidth, scaledHeight);

            if (!isMaskInitialized && scaledWidth && scaledHeight)
            {
                isMaskInitialized = true;
                const offsetY = (window.innerHeight - scaledHeight) / 2;


                setMaskRect({
                    x: (scaledWidth * .3),
                    y: (scaledHeight * (.25 / 2)),
                    width: scaledWidth - (scaledWidth * .6),
                    height: scaledHeight - (scaledHeight * .25),
                    offsetX: 0,
                    offsetY: offsetY,
                })

                setMaskSize({ width: scaledWidth, height: scaledHeight });
            }

            animationLoop = requestAnimationFrame(blitVideoAnimation);
        }

        const startAnimation = () =>
        {
            isMaskInitialized = false;
            animationLoop = requestAnimationFrame(blitVideoAnimation);
        }

        videoRef.current.addEventListener('play', startAnimation);

        return () =>
        {
            cancelAnimationFrame(animationLoop);
            videoRef.current.removeEventListener('play', startAnimation);
        }

    }, [ resultCanvasRef, videoRef, popUUID ]);

    const toggleCamera = async () =>
    {
        if (!videoRef.current) return;

        if (videoRef.current.paused)
        {
            selectWebcam(selectedWebcam);
        } else
        {
            // release webcam and close the live ingress
            const stream = videoRef.current.srcObject;

            stream.getTracks().forEach((track) =>
            {
                track.stop();
            });

            videoRef.current.srcObject = null;
        }

        setVideoPlaying(!videoPlaying);

    }

    const startInference = async () =>
    {
        console.log('Starting inference:', eyePopEndpoint);

        if (videoRef.current.paused)
        {
            toggleCamera();
        }

        const dataUrl = resultCanvasRef.current.toDataURL('image/png');
        const binary = atob(dataUrl.split(',')[ 1 ]);
        const array = [];

        for (let i = 0; i < binary.length; i++)
        {
            array.push(binary.charCodeAt(i));
        }

        const blob = new Blob([ new Uint8Array(array) ], { type: 'image/png' });

        const compositionCtx = compositionCanvasRef.current.getContext('2d');
        setLabelsList([]);
        setMatchedString('');

        const newImage = new Image();
        newImage.src = dataUrl;
        newImage.onload = () =>
        {

            console.log('Image loaded');

            eyePopEndpoint
                .process({ stream: blob, mimeType: 'image/png' })
                .then(async (results) =>
                {
                    const maskCtx = maskRef.current.getContext('2d');
                    const maskCopy = maskCtx.getImageData(0, 0, maskSize.width, maskSize.height);

                    const remoteRender = Render2d.renderer(compositionCtx, [
                        Render2d.renderBox(),
                        Render2d.renderKeypoints(),
                    ]);


                    for await (let result of results)
                    {
                        console.log('Result:', result);
                        const { source_width, source_height } = result;
                        const parentWidth = resultCanvasRef.current.parentElement.clientWidth;
                        const parentHeight = resultCanvasRef.current.parentElement.clientHeight;

                        const scaleFactor = Math.min(parentWidth / source_width, parentHeight / source_height);
                        const scaledWidth = source_width * scaleFactor;
                        const scaledHeight = source_height * scaleFactor;

                        resultCanvasRef.current.width = scaledWidth;
                        resultCanvasRef.current.height = scaledHeight;
                        compositionCanvasRef.current.width = scaledWidth;
                        compositionCanvasRef.current.height = scaledHeight;

                        let offsetY = 0;

                        if (maskRect.width === window.innerWidth && maskRect.height === window.innerHeight)
                        {
                            offsetY = (window.innerHeight - scaledHeight) / 2;
                        }

                        compositionCtx.globalAlpha = 0.85;
                        // draw the dataUrl png content image to the composition canvas
                        compositionCtx.drawImage(newImage, 0, 0, resultCanvasRef.current.width, resultCanvasRef.current.height);
                        compositionCtx.globalAlpha = 1;

                        remoteRender.draw(result);

                        // clear all the borders around the maskRect of the composition canvas
                        compositionCtx.clearRect(0, 0, maskRect.x, maskRect.y + window.innerHeight);
                        compositionCtx.clearRect(0, 0, window.innerWidth, maskRect.y);
                        compositionCtx.clearRect(maskRect.x + maskRect.width, 0, window.innerWidth, window.innerHeight);
                        compositionCtx.clearRect(maskRect.x, maskRect.y + maskRect.height, window.innerWidth, window.innerHeight);

                        maskCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
                        maskCtx.putImageData(maskCopy, 0, 0);
                        maskCtx.drawImage(compositionCanvasRef.current, 0, offsetY, compositionCanvasRef.current.width, compositionCanvasRef.current.height);


                        let croppedImage = maskCtx.getImageData(maskRect.x, maskRect.y, maskRect.width, maskRect.height);
                        fuzzyDetectName(maskRect, result, croppedImage);
                        setLoading(false);
                    }

                }).catch((error) =>
                {
                    setLoading(false);
                }).finally(() =>
                {
                    setLoading(false);
                });

        }

    }

    const fuzzyDetectName = (maskRect, resultObject, croppedImage) =>
    {
        const isOverlapping = (rect1, rect2) =>
        {
            if (rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.y + rect1.height > rect2.y)
            {
                return true;
            }
            return false;
        }

        let allLabels = [];

        setCroppedImage(croppedImage);
        for (let i = 0; i < resultObject.objects.length; i++)
        {
            const child = resultObject.objects[ i ];

            if (!('labels' in child))
            {
                continue
            }

            for (let j = 0; j < child.labels.length; j++)
            {
                const obj = child.labels[ j ];
                let label = obj?.label;

                if (!label) continue;

                // remove any special characters from label
                label = label.replace(/[^a-zA-Z ]/g, "");

                const objPosition = { x: child.x, y: child.y, width: child.width, height: child.height };
                const objArea = (child.width - child.x) * (child.height - child.y);

                if (!isOverlapping(objPosition, maskRect)) continue;

                allLabels.push({ label, area: objArea });

                // use fast fuzzy to find the closest match
                const result = search(label, names, { returnMatchData: true, ignoreCase: true, ignoreSymbols: true, });

                if (result.length === 0) continue;

                const matchString = result[ 0 ].item;

                setMatchedString(matchString);
                console.log('Matched:', matchString);

            }
        }

        // sort the labels by area, largest first
        allLabels = allLabels.sort((a, b) => b.area - a.area).map((item) => item.label).reverse();

        console.log('All Labels:', allLabels);

        setLabelsList(allLabels);
    }

    const populateWebcamDevices = async () =>
    {
        // A hack to get the webcam devices listed if they do not appear
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then((stream) =>
        {

            stream.getTracks().forEach((track) =>
            {
                track.stop();
            });

        });

        const devices = await navigator.mediaDevices.enumerateDevices();

        const webcamDevices = devices.filter(device => device.kind === 'videoinput');
        setWebcamDevices(webcamDevices);
        setSelectedWebcam(webcamDevices[ 0 ].deviceId);
    }

    const selectWebcam = async (deviceID) =>
    {
        if (!videoPlaying) setVideoPlaying(true);

        console.log('Selecting webcam:', deviceID);
        setSelectedWebcam(deviceID);

        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceID } });
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        console.log('Setting webcam:', deviceID, stream);

        stream.getTracks().forEach((track) =>
        {
            console.log('Track:', track);
        });

    }

    const getCanvasSize = (canvas, parentWidth, parentHeight) =>
    {
        const source_width = canvas.width;
        const source_height = canvas.height;

        const scaleFactor = Math.min(parentWidth / source_width, parentHeight / source_height);
        const scaledWidth = source_width * scaleFactor;
        const scaledHeight = source_height * scaleFactor;
        const offsetX = (parentWidth - scaledWidth) / 2;
        const offsetY = (parentHeight - scaledHeight) / 2;

        return { scaleFactor, scaledWidth, scaledHeight, offsetX, offsetY };
    }

    const handleDynamicBoxDraw = (e) =>
    {
        if (!canvasCtx) return;

        const parentWidth = resultCanvasRef.current.parentElement.clientWidth;
        const parentHeight = resultCanvasRef.current.parentElement.clientHeight;

        const { scaleFactor, scaledWidth, scaledHeight, offsetX, offsetY } = getCanvasSize(resultCanvasRef.current, parentWidth, parentHeight);

        resultCanvasRef.current.width = scaledWidth;
        resultCanvasRef.current.height = scaledHeight;

        const rect = resultCanvasRef.current.getBoundingClientRect();

        let x, y;

        if (e.type === 'mousedown' || e.type === 'mousemove')
        {
            x = ((e.clientX - rect.left) * scaleFactor) - offsetX;
            y = ((e.clientY - rect.top) * scaleFactor) - offsetY;
        } else if (e.type === 'touchstart' || e.type === 'touchmove')
        {
            x = ((e.touches[ 0 ].clientX - rect.left) * scaleFactor) - offsetX;
            y = ((e.touches[ 0 ].clientY - rect.top) * scaleFactor) - offsetY;
        }

        // if x or y is not in the canvas return
        if (x < 0 || y < 0 || x > scaledWidth || y > scaledHeight) return;

        canvasCtx.strokeStyle = 'blue';
        canvasCtx.lineWidth = 2;

        if (e.type === 'mousedown' || e.type === 'touchstart')
        {
            setMatchedString('');
            setLabelsList([]);

            setMaskRect({
                x: (scaledWidth * .3),
                y: (scaledHeight * (.25 / 2)),
                width: scaledWidth - (scaledWidth * .6),
                height: scaledHeight - (scaledHeight * .25),
                offsetX: 0,
                offsetY: offsetY,
            })


            startX = x;
            startY = y;
            isDrawing = true;
        } else if ((e.type === 'mousemove' && e.buttons === 1) || e.type === 'touchmove')
        {
            if (isDrawing)
            {
                canvasCtx.beginPath();
                canvasCtx.rect(startX, startY, x - startX, y - startY);
                canvasCtx.stroke();
            }

            // if the size of the mask is too small return
            if (Math.abs(x - startX) < (scaledWidth / 15) || Math.abs(y - startY) < (scaledHeight / 15))
            {

                setMatchedString('');
                setLabelsList([]);

                setMaskRect({
                    x: (scaledWidth * .3),
                    y: (scaledHeight * (.25 / 2)),
                    width: scaledWidth - (scaledWidth * .6),
                    height: scaledHeight - (scaledHeight * .25),
                    offsetX: 0,
                    offsetY: offsetY,
                })

            } else
            {
                setMaskRect({
                    x: startX,
                    y: startY,
                    width: x - startX,
                    height: y - startY,
                    offsetX: offsetX,
                    offsetY: offsetY,
                });
            }

        } else if (e.type === 'mouseup' || e.type === 'touchend')
        {
            isDrawing = false;
        }
    }

    useEffect(() =>
    {
        if (!canvasCtx) return;

        resultCanvasRef.current.addEventListener('mousedown', handleDynamicBoxDraw);
        resultCanvasRef.current.addEventListener('mousemove', handleDynamicBoxDraw);
        resultCanvasRef.current.addEventListener('mouseup', handleDynamicBoxDraw);

        resultCanvasRef.current.addEventListener('touchstart', handleDynamicBoxDraw);
        resultCanvasRef.current.addEventListener('touchmove', handleDynamicBoxDraw);
        resultCanvasRef.current.addEventListener('touchend', handleDynamicBoxDraw);

        return () =>
        {
            resultCanvasRef.current.removeEventListener('mousedown', handleDynamicBoxDraw);
            resultCanvasRef.current.removeEventListener('mousemove', handleDynamicBoxDraw);
            resultCanvasRef.current.removeEventListener('mouseup', handleDynamicBoxDraw);

            resultCanvasRef.current.removeEventListener('touchstart', handleDynamicBoxDraw);
            resultCanvasRef.current.removeEventListener('touchmove', handleDynamicBoxDraw);
            resultCanvasRef.current.removeEventListener('touchend', handleDynamicBoxDraw);
        }
    }, [ canvasCtx ]);

    return (

        <>

            <div className=' overscroll-none flex flex-col items-center justify-between h-full overflow-hidden'>

                <ResultsOverlay title={matchedString} labelsList={labelsList} />


                <div className={`overscroll-none absolute left-0 top-0 w-full h-full p-0 justify-center overflow-hidden`} >

                    <MaskCanvas
                        maskRef={maskRef}
                        maskRect={maskRect}
                        maskSize={maskSize}
                        id="mask-canvas"
                        className={`${sharedClass} absolute overscroll-none z-10`}
                    ></MaskCanvas>

                    <canvas
                        id="result-overlay-mobile"
                        ref={resultCanvasRef}
                        width={window.innerWidth}
                        height={window.innerHeight}
                        className={`${sharedClass} absolute overscroll-none`}
                    ></canvas>

                    <canvas
                        id="hidden-canvas"
                        ref={compositionCanvasRef}
                        width={window.innerWidth}
                        height={window.innerHeight}
                        className={`${sharedClass} absolute overscroll-none hidden`}
                    ></canvas>

                    <video
                        ref={videoRef}
                        className={`${sharedClass} hidden`}
                        autoPlay
                        playsInline
                        muted
                    ></video>

                </div>


                <div
                    className={`overscroll-none ${loading ? 'h-0' : 'h-[6.5rem]'} transition-all duration-500 z-10 ${marginsStyle} bg-blue-400 flex justify-center items-center rounded-3xl shadow-2xl overflow-hidden`}>

                    <div className=' overscroll-none h-full flex justify-center items-center text-center'>

                        {loading ?

                            <>
                                <div className='text-blue-100  text-center font-extrabold text-4xl pt-2 overflow-hidden hidden '
                                    ref={popNameRef} >
                                </div>


                                <div className='text-blue-100 m-5 text-center font-extrabold text-2xl overflow-hidden' >
                                    Loading...
                                </div>

                            </>


                            :

                            <div className='flex justify-center items-center h-full w-full gap-1'>


                                <div className='text-blue-100  text-center font-extrabold text-4xl pt-2 overflow-hidden hidden '
                                    ref={popNameRef} >
                                </div>

                                <select
                                    className={`${loading && 'hidden'} bg-white text-gray-700 text-4xl border border-gray-300 rounded-3xl max-w[30rem] w-full  h-full self-center`}
                                    onChange={(e) => { selectWebcam(e.target.value) }}
                                >

                                    {webcamDevices.map((device, index) => (
                                        <option key={index} value={device.deviceId}>
                                            {device.label}
                                        </option>
                                    ))}

                                </select>

                                <button
                                    ref={null}
                                    onClick={() => toggleCamera()}
                                    className={`${loading && 'hidden'}  bg-white hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded-3xl text-4xl h-full mr-5 min-w-[7rem] w-44 self-center hover:scale-125 transition-all`} >
                                    {videoPlaying ? 'Stop' : 'Start'}
                                </button>

                                <div className="bg-gray-800 flex h-full min-w-[5rem] w-[7rem] sm:w-[5rem] lg:w-[2.5rem]  justify-center items-center rounded-full shadow-2xl p-2 z-10 cursor-pointer transition-all duration-200 hover:animate-pulse hover:scale-110 active:scale-125"
                                    onClick={() =>
                                    {
                                        if (settingsRef.current)
                                        {
                                            settingsRef.current.showModal();
                                        }
                                    }}>
                                    <FontAwesomeIcon className='text-blue-100 rounded-full w-full h-full' icon={faGear} />
                                </div>


                            </div>
                        }
                    </div>
                </div>

                {loading && (
                    <div className="absolute top-0 left-0 w-screen h-screen flex justify-center items-center bg-gray-500 bg-opacity-50 overflow-hidden overscroll-none">
                        <div className='w-full h-full animate-spin flex justify-center items-center '>
                            <FontAwesomeIcon icon={faSpinner} className="text-white text-6xl w-[7rem] sm:w-[5rem] h-[7rem] sm:h-[5rem]" />
                        </div>
                    </div>
                )}

                <SettingsDialog ref={settingsRef} showModelSelector={false} setPopUUID={setPopUUID} setPopSecret={setPopSecret} />

                {!loading && (
                    <div className="bg-blue-400 flex h-[8rem] w-[8rem] justify-center m-5 items-center rounded-full shadow-2xl p-5 z-10 cursor-pointer transition-all duration-200 hover:animate-pulse hover:scale-110 active:scale-125"
                        onClick={() =>
                        {
                            setMaskRect({ ...maskRect });
                            startInference();
                            setLoading(true);
                        }}>
                        <FontAwesomeIcon className='text-blue-100 rounded-full p-2 w-full h-full' icon={faCamera} />
                    </div>
                )}

            </div>
        </>
    );

}

export default MobileScanner;
