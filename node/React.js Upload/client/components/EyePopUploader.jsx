import React, { useEffect, useRef, useState } from 'react';

import Header from './ui/Header.jsx';
import EyePopVisuals from './ui/EyePopVisuals.jsx';
import EyePopManager from './src/EyePopManager.js';
import LoadingScreen from './ui/LoadingScreen.jsx';

export function EyePopUploader()
{

    const previewVideoRef = useRef();
    const previewImageRef = useRef();
    const resultCanvasRef = useRef();
    const popNameRef = useRef();

    const [ eyePopManager, setEyePopManager ] = useState(null);
    const [ loading, setLoading ] = useState(true);
    const [ progress, setProgress ] = useState(0);
    const [ isVideo, setIsVideo ] = useState(true);

    const handleFileChange = (event) =>
    {
        eyePopManager.upload(event);
    }

    useEffect(() =>
    {
        if (eyePopManager) return;
        if (!previewVideoRef.current) return;
        if (!resultCanvasRef.current) return;
        if (!popNameRef.current) return;
        if (!previewImageRef.current) return;

        const manager = new EyePopManager({
            previewImageRef,
            previewVideoRef,
            resultCanvasRef,
            popNameRef,
            setters: {
                setProgress,
                setLoading,
                setIsVideo
            }
        });
        setEyePopManager(manager);

    }, [ previewVideoRef.current, resultCanvasRef.current, popNameRef.current, previewImageRef.current ]);


    return (

        <div
            className='flex flex-col overflow-hidden'>

            <EyePopVisuals
                isVideo={isVideo}
                previewImageRef={previewImageRef}
                previewVideoRef={previewVideoRef}
                resultCanvasRef={resultCanvasRef} />

            <LoadingScreen
                loading={loading}
                progress={progress} />

            <Header
                className={'absolute top-0 left-[15%] right-[15%] mx-auto '}
                loading={loading}
                popNameRef={popNameRef}
                handleFileChange={handleFileChange}
            />

        </div>

    );
}



