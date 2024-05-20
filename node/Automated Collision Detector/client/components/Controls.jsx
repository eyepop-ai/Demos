import React, { useEffect, useRef, useState } from 'react';
import { useEyePop } from '../hook/EyePopContext.jsx';

const Controls = () =>
{
    // Add your component logic here
    const { startInference, setInferenceData, reset, isCollision, isTraffic, videoRef, getFlowStatistics } = useEyePop();
    const videoURlRef = useRef(null);

    // const [ collisionDetected, setCollisionDetected ] = useState(false);
    const [ trafficDetected, setTrafficDetected ] = useState(false);
    const [ collisionQueued, setCollisionQueued ] = useState(false);

    useEffect(() =>
    {
        setTrafficDetected(isTraffic);
        console.log('isCollision:', isCollision, collisionQueued);

        if (isCollision)
        {
            setCollisionQueued(true)
        }

        if (!videoRef.current) return;
        if (!isCollision) return;

        videoRef.current.pause();
        setTimeout(() =>
        {
            setCollisionQueued(false);
            videoRef.current.play();
        }, 250);

    }, [ isCollision, isTraffic, videoRef ]);

    const start = async (e) =>
    {
        const url = videoURlRef.current.value;

        if (!url)
        {
            alert('Please enter a video URL');
            return;
        }

        console.log('Starting inference with URL:', url);

        await startInference(url);
    }

    const handleFileUpload = (e) =>
    {
        const file = e.target.files[ 0 ];
        setInferenceData(file);
    };

    const handleNewScene = () =>
    {
        console.log('New Scene');
        reset();
    }

    useEffect(() =>
    {
        const handleSpaceBar = (e) =>
        {
            if (e.key === ' ')
            {
                handleNewScene();
            }
        }
        document.addEventListener('keydown', handleSpaceBar);
        return () => document.removeEventListener('keydown', handleSpaceBar);
    }, [])



    return (
        <>
            <h3 className='text-3xl'>Automated Collision Detection</h3>

            <div className='flex flex-row justify-center items-center gap-5 m-2 text-white'>

                <input ref={videoURlRef} type="text" className='input text' placeholder="Enter URL" />

                <div className='btn btn-primary' onClick={start}> Start Inference </div>

                <div className="text">OR</div>

                <div className="flex flex-col">
                    <div className="text">Load inference json file:</div>

                    <input type="file" className='input text flex justify-center text-center content-center p-1 w-60' accept=".json" onChange={handleFileUpload} placeholder='Load json inference file' />
                </div>

                <div className='btn btn-primary' onClick={handleNewScene}> Reset Metrics </div>

                <div className='flex flex-col'>
                    <div className="flex flex-row color-key gap-1">
                        <div className="color-box w-4 h-4 mt-1 bg-green-500"></div>
                        <span>No Traffic</span>
                    </div>
                    <div className="flex flex-row color-key gap-1">
                        <div className="color-box w-4 h-4 mt-1 bg-yellow-500"></div>
                        <span>Traffic</span>
                    </div>
                    <div className="flex flex-row color-key gap-1">
                        <div className="color-box w-4 h-4 mt-1 bg-red-500"></div>
                        <span>Collision</span>
                    </div>
                </div>

            </div>

            <div className='flex flex-row justify-center items-center gap-5 m-2 text-white h-12'>

                {trafficDetected && <div className='text-yellow-500'>Traffic Detected</div>}

                {collisionQueued &&
                    <div className='flex gap-3 text-center justify-items-center'>
                        <div className='text-red-500'>Collision Detected</div>
                        {/* <button className='btn btn-error text-center' onClick={
                            () =>
                            {
                                setCollisionQueued(false);
                                videoRef.current.play();
                            }}
                        >Continue</button> */}
                    </div>
                }

            </div>

        </>
    );
};

export default Controls;
