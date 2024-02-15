import React, { useEffect, useState } from 'react';

const HeaderPopControls = ({ className, loading, popNameRef, handleWebcamChange, startButtonRef, onStart }) =>
{
    const [ webcamDevices, setWebcamDevices ] = useState([]);

    useEffect(() =>
    {
        populateWebcamDevices();
    }, [ loading ]);

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
    }

    const marginsStyle = ' p-4 mr-[5rem] ml-[5rem] mt-[-1rem] ';
    return (
        <div
            className={`${className}  ${loading ? 'h-0' : 'h-14'} transition-all duration-500 `}>

            <div
                className={`${marginsStyle} bg-blue-400 flex h-full justify-center items-center rounded-b-3xl shadow-2xl p-5`}>

                <div
                    className='text-blue-100 font-extrabold text-xl w-32 overflow-hidden'
                    ref={popNameRef}
                >
                </div>

                <select
                    className={`${loading ? 'hidden' : '0'} bg-white text-gray-700 border border-gray-300 rounded h-10 m-5 w-40 self-center`}
                    onChange={(e) => { handleWebcamChange(e.target.value) }}
                >
                    <option value="">Select Webcam</option>
                    {webcamDevices.map((device, index) => (
                        <option key={index} value={device.deviceId}>
                            {device.label}
                        </option>
                    ))}
                </select>

                <button
                    ref={startButtonRef}
                    onClick={onStart}
                    className={`${loading ? 'hidden' : '0'}  bg-white hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded h-10 m-5 min-w-32 w-44 self-center hover:scale-125 transition-all`} >
                    Start Camera
                </button>


            </div>
        </div>
    );
};

export default HeaderPopControls;
