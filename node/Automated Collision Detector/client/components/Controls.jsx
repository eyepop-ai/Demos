import React, { useEffect, useRef, useState } from 'react';
import { useEyePop } from '../hook/EyePopContext.jsx';

const DEBUG = true;
const Controls = () =>
{
    // Add your component logic here
    const { saveResult, setSaveResult, start, reset, isCollision, isTraffic, videoRef, getFlowStatistics } = useEyePop();

    const [ trafficDetected, setTrafficDetected ] = useState(false);
    const [ collisionQueued, setCollisionQueued ] = useState(false);

    useEffect(() =>
    {
        if (DEBUG) return
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

            if (videoRef.current.paused)
            {
                videoRef.current.play();
            }
        }, 250);

    }, [ isCollision, isTraffic, videoRef ]);

    const handleVideoFileUpload = (e) =>
    {
        const file = e.target.files[ 0 ];
        start(file)
    }

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
        <div className='absolute top-0 left-0 w-screen flex flex-col justify-center items-center'>
            <h3 className='text-3xl z-50 '>Automated Collision Detection</h3>

            <div className='flex flex-row justify-center items-center gap-5 m-2 text-white z-50 '>

                <div className='flex flex-col gap-2 group'>
                    <input type="file" className=' w-60' placeholder="Select File" onChange={handleVideoFileUpload} accept=".mp4,.mov,.webm,.json" />

                    <div className='flex flex-row gap-2 group'>
                        <input className='toggle toggle-success' type="checkbox" checked={saveResult ?? true} onChange={(e) => setSaveResult(e.target.checked)}  >
                        </input>
                        <span className='group'>Save Predictions</span>
                    </div>
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

        </div>
    );
};

export default Controls;
