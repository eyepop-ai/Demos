import React, { useEffect } from 'react';

const LoadingScreen = ({ loading }) =>
{

    return (
        <>

            <>
                {loading &&

                    // If the session is not yet connected we display a different loading screen
                    <>
                        <div
                            className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-gray-900">
                            <div
                                className="text-white text-3xl font-bold">Connecting to your Pop...</div>
                        </div>
                    </>}
            </>


        </>
    );
};

export default LoadingScreen;
