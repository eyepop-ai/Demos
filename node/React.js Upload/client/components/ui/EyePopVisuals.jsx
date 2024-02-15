import React from 'react';

const EyePopVisuals = ({ className, isVideo, previewVideoRef, resultCanvasRef, previewImageRef }) =>
{
    const sharedClass = 'absolute top-0 left-0 w-full h-full object-contain';

    return (
        <div
            className={`${className} w-full h-full`} >

            <video
                id="video-preview"
                ref={previewVideoRef}
                className={`${sharedClass} ${!isVideo && 'hidden opacity-0'}`} alt="Video Preview" controls
                muted
                playsInline />

            <img
                id='image-preview'
                ref={previewImageRef}
                className={`${sharedClass}  ${isVideo && 'hidden opacity-0'}`}
                alt="Image"
            />

            <canvas
                id="result-overlay"
                ref={resultCanvasRef}
                className={`${sharedClass} pointer-events-none`}
            ></canvas>

        </div >
    );
};

export default EyePopVisuals;
