import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useEyePop } from '../hook/EyePopContext';
import { Render2d } from '@eyepop.ai/eyepop-render-2d';
import * as THREE from 'three';
import { normalizePosition } from '../utils/BaseUtils';

const EyePopDrawing = () =>
{
    const { prediction, videoRef, getVehicles, getFlowStatistics } = useEyePop();

    const { invalidate } = useThree();

    const [ canvas, setCanvas ] = useState(null);
    const [ ctx, setCtx ] = useState(null);
    const [ aspect, setAspect ] = useState(1);

    const [ canvasTexture, setCanvasTexture ] = useState(null);
    const [ videoTexture, setVideoTexture ] = useState(null);
    const [ eyePopRenderer, setEyePopRenderer ] = useState(null);
    const [ shaderMaterial, setShaderMaterial ] = useState(null);

    let lastTime = -99.0;


    const setupCavas = () =>
    {

        let tempCanvas = document.createElement('canvas');
        tempCanvas.id = 'maskCanvas';
        document.body.appendChild(tempCanvas);
        tempCanvas.style.display = 'none';
        tempCanvas.width = videoRef.current.videoWidth;
        tempCanvas.height = videoRef.current.videoHeight;


        const maskCtx = tempCanvas.getContext('2d');
        maskCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

        const tempCanvasTexture = new THREE.CanvasTexture(tempCanvas);
        tempCanvasTexture.needsUpdate = true;

        const texture = new THREE.VideoTexture(videoRef.current);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;

        setVideoTexture(texture);
        setCtx(maskCtx);
        setCanvas(tempCanvas);
        setCanvasTexture(tempCanvasTexture);
        setAspect(videoRef.current.videoWidth / videoRef.current.videoHeight);


        // Use the eyepop renderer to draw the closest prediction
        const renderer = Render2d.renderer(maskCtx, [
            Render2d.renderBox(true),
        ]);

        setEyePopRenderer(renderer);

        return { eyePopTexture: tempCanvasTexture, videoTexture: texture };
    }

    const setupShaderMaterial = (videoTex, canvasTex) =>
    {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                videoTexture: { value: videoTex },
                eyePopTexture: { value: canvasTex }
            },
            vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
            fragmentShader: `
            uniform sampler2D videoTexture;
            uniform sampler2D eyePopTexture;
            varying vec2 vUv;
            void main() {
                vec4 overlay = texture2D(eyePopTexture, vUv);
                gl_FragColor = mix(texture2D(videoTexture, vUv), overlay, 1.0);
            }
            `,
            transparent: true,
            side: THREE.DoubleSide,

        })

        setShaderMaterial(material)
    }

    const drawBox = (ctx, box, primaryColor, secondaryColor, lineWidth = 1) =>
    {
        var mindim = Math.min(box.height, box.width)
        var corner_size = Math.max(15, mindim / 5.33333)
        var padding = Math.max(mindim * 0.02, 5)
        corner_size = corner_size - padding

        //faded blue background
        ctx.beginPath()
        ctx.rect(box.x, box.y, box.width, box.height)
        ctx.lineWidth = lineWidth
        ctx.stroke()

        var corners = [
            //top left corner
            [
                { x: box.x, y: box.y + corner_size },
                { x: box.x, y: box.y },
                { x: box.x + corner_size, y: box.y },
            ],
            //bottom left corner
            [
                { x: box.x, y: box.y + box.height - corner_size },
                { x: box.x, y: box.y + box.height },
                { x: box.x + corner_size, y: box.y + box.height },
            ],
            //top right corner
            [
                { x: box.x + box.width - corner_size, y: box.y },
                { x: box.x + box.width, y: box.y },
                { x: box.x + box.width, y: box.y + corner_size },
            ],
            //bottom right corner
            [
                { x: box.x + box.width, y: box.y + box.height - corner_size },
                { x: box.x + box.width, y: box.y + box.height },
                { x: box.x + box.width - corner_size, y: box.y + box.height },
            ],
        ]

        corners.forEach((corner) =>
        {
            ctx.beginPath()
            ctx.moveTo(corner[ 0 ].x, corner[ 0 ].y)
            ctx.lineTo(corner[ 1 ].x, corner[ 1 ].y)
            ctx.lineTo(corner[ 2 ].x, corner[ 2 ].y)
            ctx.strokeStyle = primaryColor
            ctx.lineWidth = lineWidth
            ctx.stroke()
        })

        var corners2 = [
            //2nd top left corner
            [
                { x: box.x + padding, y: box.y + padding + corner_size },
                { x: box.x + padding, y: box.y + padding },
                { x: box.x + padding + corner_size, y: box.y + padding },
            ],
            //2nd bottom left corner
            [
                { x: box.x + padding, y: box.y - padding + box.height - corner_size },
                { x: box.x + padding, y: box.y - padding + box.height },
                { x: box.x + padding + corner_size, y: box.y - padding + box.height },
            ],
            //2nd top right corner
            [
                { x: box.x - padding + box.width - corner_size, y: box.y + padding },
                { x: box.x - padding + box.width, y: box.y + padding },
                { x: box.x - padding + box.width, y: box.y + padding + corner_size },
            ],
            //2nd bottom right corner
            [
                { x: box.x - padding + box.width, y: box.y - padding + box.height - corner_size },
                { x: box.x - padding + box.width, y: box.y - padding + box.height },
                { x: box.x - padding + box.width - corner_size, y: box.y - padding + box.height },
            ],
        ]

        corners2.forEach((corner) =>
        {
            ctx.beginPath()
            ctx.moveTo(corner[ 0 ].x, corner[ 0 ].y)
            ctx.lineTo(corner[ 1 ].x, corner[ 1 ].y)
            ctx.lineTo(corner[ 2 ].x, corner[ 2 ].y)
            ctx.strokeStyle = secondaryColor
            ctx.lineWidth = lineWidth
            ctx.stroke()
        })
    }

    useFrame(() =>
    {
        if (!videoRef.current) { return; }
        if (videoRef.current.readyState < 2) { return; }
        if (videoRef.current.currentTime === lastTime) { return; }

        lastTime = videoRef.current.currentTime;

        if (!canvas)
        {
            const textures = setupCavas();
            setupShaderMaterial(textures.videoTexture, textures.eyePopTexture);
        }

        if (!prediction) return;
        if (!canvas) return;
        if (!ctx) return;
        if (!eyePopRenderer) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const vehicles = getVehicles(false);

        for (const vehicle of vehicles)
        {

            ctx.strokeStyle = 'blue';
            ctx.beginPath();
            ctx.moveTo(vehicle.x + vehicle.width / 2, vehicle.y + vehicle.height / 2);
            ctx.lineTo(vehicle.x + vehicle.width / 2 + vehicle.velocity.x, vehicle.y + vehicle.height / 2 + vehicle.velocity.y);

            // draws the arrow tip
            const angle = Math.atan2(vehicle.velocity.y, vehicle.velocity.x);
            ctx.lineTo(vehicle.x + vehicle.width / 2 + vehicle.velocity.x - 10 * Math.cos(angle - Math.PI / 6), vehicle.y + vehicle.height / 2 + vehicle.velocity.y - 10 * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(vehicle.x + vehicle.width / 2 + vehicle.velocity.x, vehicle.y + vehicle.height / 2 + vehicle.velocity.y);
            ctx.lineTo(vehicle.x + vehicle.width / 2 + vehicle.velocity.x - 10 * Math.cos(angle + Math.PI / 6), vehicle.y + vehicle.height / 2 + vehicle.velocity.y - 10 * Math.sin(angle + Math.PI / 6));
            ctx.lineWidth = 3;
            ctx.stroke();

            // draw on the ctx an arrow pointing in the direction of the vehicle velocity and a rectangle around the vehicle
            if (vehicle.trafficFactor > 0.5)
            {
                ctx.strokeStyle = '#ffbe0b';
            } else
            {
                // ctx.strokeStyle = '#3A86FF';
                ctx.strokeStyle = '#5fff4e';
            }

            if (vehicle.collisionFactor > 0.5)
            {

                ctx.strokeStyle = '#ff002f';

                if (vehicle.wasProcessed)
                {
                    ctx.lineWidth = 4;
                } else
                {
                    ctx.lineWidth = 10;
                }

                vehicle.wasProcessed = true;
                // vehicle.collisionFactor = 0.0;

            } else
            {
                ctx.lineWidth = 2;
            }

            drawBox(ctx, vehicle, ctx.strokeStyle, ctx.strokeStyle, ctx.lineWidth);

            // draw the vehicle id
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.fillText("ID " + vehicle.id, vehicle.x + vehicle.width / 4, vehicle.y + vehicle.height / 2);
        }

        const flowStats = getFlowStatistics();

        const flowDirection1 = flowStats.flow1.direction;
        const flowDirection2 = flowStats.flow2.direction;
        const flowCount1 = flowStats.flow1.count;
        const flowCount2 = flowStats.flow2.count;
        // in the center of the canvas, draw two arrows pointing in the direction of the flow and the number of vehicles in that flow direction
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 4, (canvas.height / 2) + 100);
        ctx.lineTo(canvas.width / 4 + flowDirection1.x * 100, (canvas.height / 2 - flowDirection1.y * 100) + 100);
        ctx.stroke();


        ctx.lineWidth = 2;
        // draw arrow tip for flowDirection1
        const angle1 = Math.atan2(-flowDirection1.y, flowDirection1.x);
        ctx.lineTo(canvas.width / 4 + flowDirection1.x * 100 - 10 * Math.cos(angle1 - Math.PI / 6), (canvas.height / 2 - flowDirection1.y * 100) + 100 - 10 * Math.sin(angle1 - Math.PI / 6));
        ctx.moveTo(canvas.width / 4 + flowDirection1.x * 100, (canvas.height / 2 - flowDirection1.y * 100) + 100);
        ctx.lineTo(canvas.width / 4 + flowDirection1.x * 100 - 10 * Math.cos(angle1 + Math.PI / 6), (canvas.height / 2 - flowDirection1.y * 100) + 100 - 10 * Math.sin(angle1 + Math.PI / 6));
        ctx.stroke();

        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 4, (canvas.height / 4) + 100);
        ctx.lineTo(canvas.width / 4 + flowDirection2.x * 100, (canvas.height / 4 - flowDirection2.y * 100) + 100);
        ctx.stroke();

        ctx.lineWidth = 2;
        // draw arrow tip for flowDirection2
        const angle2 = Math.atan2(-flowDirection2.y, flowDirection2.x);
        ctx.lineTo(canvas.width / 4 + flowDirection2.x * 100 - 10 * Math.cos(angle2 - Math.PI / 6), (canvas.height / 4 - flowDirection2.y * 100) + 100 - 10 * Math.sin(angle2 - Math.PI / 6));
        ctx.moveTo(canvas.width / 4 + flowDirection2.x * 100, (canvas.height / 4 - flowDirection2.y * 100) + 100);
        ctx.lineTo(canvas.width / 4 + flowDirection2.x * 100 - 10 * Math.cos(angle2 + Math.PI / 6), (canvas.height / 4 - flowDirection2.y * 100) + 100 - 10 * Math.sin(angle2 + Math.PI / 6));
        ctx.stroke();

        ctx.fillStyle = 'red';
        ctx.font = 'bold 50px Arial';
        ctx.fillText(flowCount1, canvas.width / 4 - 100, canvas.height / 2 + 100);
        ctx.fillText(flowCount2, canvas.width / 4 - 100, canvas.height / 4 + 100);

        shaderMaterial.needsUpdate = true;
        shaderMaterial.uniforms.videoTexture.value = videoTexture;
        shaderMaterial.uniforms.eyePopTexture.value = canvasTexture;
        shaderMaterial.uniforms.videoTexture.value.needsUpdate = true;
        shaderMaterial.uniforms.eyePopTexture.value.needsUpdate = true;

    })

    return (
        <>
            {aspect && shaderMaterial &&
                <mesh position={[ 0, 0, 0.01 ]} material={shaderMaterial} onClick={() => { videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause() }}>
                    <planeGeometry args={[ aspect, 1, 1 ]} />
                </mesh >
            }
        </>
    );
};

export default EyePopDrawing
    ;
