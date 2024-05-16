import React, { useEffect, useState, useRef } from 'react';


export const drawGradient = (ctx, width, height) =>
{
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, .8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

const MaskCanvas = ({ maskRef, maskSize, maskRect, className, }) =>
{

    useEffect(() =>
    {
        if (!maskRef.current) return;

        const canvas = maskRef.current;
        canvas.width = maskSize.width;
        canvas.height = maskSize.height;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);
        drawGradient(ctx, width, height);
        // blur the canvas

        // use the maskRect to clear the center of the canvas, based on it's x, y, width, and height
        if (maskRect)
        {
            ctx.clearRect(maskRect.x, maskRect.y, maskRect.width, maskRect.height);
        }

    }, [ maskRef, maskRect ]);

    return (
        <canvas
            style={{
                pointerEvents: 'none',
            }}
            width={maskSize.width}
            height={maskSize.height}
            className={className}
            ref={maskRef}
        />
    );
}

export default MaskCanvas;
