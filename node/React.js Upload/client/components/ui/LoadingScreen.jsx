import React, { useEffect } from 'react';

const LoadingScreen = ({ loading, progress }) =>
{

    return (
        <>

            <>
                {loading ?

                    // If the session is not yet connected we display a different loading screen
                    <>
                        <div
                            className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-gray-900">
                            <div
                                className="text-white text-3xl font-bold">Connecting to your Pop...</div>
                        </div>
                    </>

                    :

                    // If the file is being processed, then show the following loading screen
                    <>{
                        progress != 100 &&
                        <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center opacity-100 d-flex flex-col gap-10 ">
                            {progress === 0 ? (
                                <div className="text-black text-3xl">Choose a video or image file</div>
                            ) : (
                                <div className='rounded bg-blue-200 m-5 p-5 d-flex flex-col justify-center align-center'>
                                    <div className="text-3xl text-center text-gray-800">Loading predictions...</div>

                                    <div className="w-full h-4 bg-gray-800 rounded-full">
                                        <div
                                            className="h-full bg-blue-500 rounded-full animate-progress transition-all duration-500 ease-in-out"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                    </>
                }
            </>


        </>
    );
};

export default LoadingScreen;
