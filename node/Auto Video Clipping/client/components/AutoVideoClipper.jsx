import React, { useEffect, useRef, useState } from 'react';

import Header from './ui/Header.jsx';
import EyePopVisuals from './ui/EyePopVisuals.jsx';
import EyePopManager from './src/EyePopManager.js';
import LoadingScreen from './ui/LoadingScreen.jsx';

export function AutoVideoClipper()
{

    const resultCanvasRef = useRef();
    const videoRef = useRef();
    const popNameRef = useRef();
    const startButtonRef = useRef();

    const [ eyePopManager, setEyePopManager ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ progress, setProgress ] = useState(0);

    const handleWebcamChange = (deviceID) =>
    {
        console.log(deviceID)
        eyePopManager.setWebcam(deviceID);
    }

    const toggleStart = () =>
    {
        eyePopManager.toggleStart();
    }

    useEffect(() =>
    {
        if (eyePopManager) return;

        if (!resultCanvasRef.current) return;
        if (!popNameRef.current) return;
        if (!videoRef.current) return;

        const manager = new EyePopManager(resultCanvasRef, videoRef, popNameRef, startButtonRef, { setProgress, setLoading });
        setEyePopManager(manager);

    }, [ resultCanvasRef.current, popNameRef.current, videoRef.current ]);


    return (

        <div
            className='flex flex-col overflow-hidden'>

            <EyePopVisuals
                resultCanvasRef={resultCanvasRef}
                videoRef={videoRef}
            />

            <LoadingScreen
                loading={loading}
                progress={progress} />

            <Header
                className={'absolute top-0 left-[15%] right-[15%] mx-auto '}
                loading={loading}
                popNameRef={popNameRef}
                handleWebcamChange={handleWebcamChange}
                startButtonRef={startButtonRef}
                onStart={toggleStart}
            />

        </div>

    );
}



