import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useEyePop } from '../hook/EyePopContext';
import { Render2d } from '@eyepop.ai/eyepop-render-2d';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

let isMouseDown = false;

const EyePopDrawing = () =>
{
    const { prediction, videoRef, getVehicles, getFlowStatistics, setFirstPoint, firstPoint, setSecondPoint, secondPoint, videoURL, maskCanvasRef, aspect, videoTexture } = useEyePop();

    const { invalidate, camera, scene, raycaster } = useThree();

    const [ canvas, setCanvas ] = useState(null);
    const [ ctx, setCtx ] = useState(null);

    const [ canvasTexture, setCanvasTexture ] = useState(null);
    const [ eyePopRenderer, setEyePopRenderer ] = useState(null);
    const [ shaderMaterial, setShaderMaterial ] = useState(null);

    const [ mousePosition, setMousePosition ] = useState({ x: 0, y: 0 });

    const flowDataRef = useRef(null);

    let lastTime = -99.0;

    const onMouseMove = (e) =>
    {
        const x = (e.clientX / window.innerWidth) * videoRef.current.videoWidth;
        const y = (e.clientY / window.innerHeight) * videoRef.current.videoHeight;

        setMousePosition({ x, y });

        if (isMouseDown)
        {
            setSecondPoint({ x, y })
        }

    }

    useEffect(() =>
    {
        document.addEventListener('mousemove', onMouseMove);
        return () =>
        {
            document.removeEventListener('mousemove', onMouseMove);
        }

    }, [ videoURL ])


    const setupCavas = () =>
    {
        if (!maskCanvasRef.current) return;
        if (!videoRef.current) return;
        if (!videoRef.current.videoWidth) return;

        let tempCanvas = maskCanvasRef.current;

        const maskCtx = tempCanvas.getContext('2d');
        maskCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

        const tempCanvasTexture = new THREE.CanvasTexture(tempCanvas);
        tempCanvasTexture.needsUpdate = true;


        setCtx(maskCtx);
        setCanvas(tempCanvas);
        setCanvasTexture(tempCanvasTexture);

        return { eyePopTexture: tempCanvasTexture };
    }

    const setupShaderMaterial = (videoTex, canvasTex) =>
    {
        if (!videoTex) return;
        if (!canvasTex) return;

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

    const drawBox = (ctx, box, primaryColor, secondaryColor, lineWidth = 1, opacity = 1.0) =>
    {
        var mindim = Math.min(box.height, box.width)
        var corner_size = Math.max(15, mindim / 5.33333)
        var padding = Math.max(mindim * 0.02, 5)
        corner_size = corner_size - padding

        lineWidth = lineWidth * opacity

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

    const drawArrow = (ctx, vehicle, color = 'blue') =>
    {
        ctx.strokeStyle = color;
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
    }

    useEffect(() =>
    {
        if (!videoURL) return;
        if (!videoTexture) return;

        const textures = setupCavas();

        if (textures)
        {
            setupShaderMaterial(videoTexture, textures.eyePopTexture);
        }

        lastTime = -99.0;

    }, [ videoURL, videoTexture ])


    useFrame(() =>
    {
        if (!videoRef.current) { return; }
        if (videoRef.current.currentTime === lastTime) { return; }

        lastTime = videoRef.current.currentTime;

        if (!canvas && videoTexture)
        {
            const textures = setupCavas();
            if (textures)
            {
                setupShaderMaterial(videoTexture, textures.eyePopTexture);
            }
        }

        if (!prediction) return;
        if (!canvas) return;
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const vehicles = getVehicles(true);

        for (const vehicle of vehicles)
        {

            if (!vehicle || !vehicle.x || !vehicle.y || !vehicle.width || !vehicle.height) continue;
            if (!vehicle.velocity || !vehicle.velocity.x || !vehicle.velocity.y) continue;

            if (vehicle.active && vehicle.opacity >= 1.0)
            {
                drawArrow(ctx, vehicle)
            }

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
                    ctx.lineWidth = 2;
                } else
                {
                    ctx.lineWidth = 6;
                }

                vehicle.wasProcessed = true;
                vehicle.collisionFactor = 0.0;

            } else
            {
                ctx.lineWidth = 2;
            }

            if (vehicle.active)
            {
                drawBox(ctx, vehicle, ctx.strokeStyle, ctx.strokeStyle, ctx.lineWidth, vehicle.opacity);

                // draw the vehicle id
                ctx.fillStyle = 'white';
                const fontSize = Math.min(vehicle.width / 4, 14);
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.fillText("ID " + vehicle.id, vehicle.x + vehicle.width / 4, vehicle.y + vehicle.height / 2);
            }
        }

        // draw line between the two points
        if (firstPoint && secondPoint)
        {
            ctx.beginPath();
            ctx.moveTo(firstPoint.x, firstPoint.y);
            ctx.lineTo(secondPoint.x, secondPoint.y);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.strokeStyle = '#01d9ff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // draw a circle at the first point and second point with an outline
            ctx.beginPath();
            ctx.arc(firstPoint.x, firstPoint.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#01d9ff';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(secondPoint.x, secondPoint.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#01d9ff';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

        }

        const flowStats = getFlowStatistics(firstPoint, secondPoint);
        flowDataRef.current = flowStats;

        if (shaderMaterial)
        {
            shaderMaterial.needsUpdate = true;
            shaderMaterial.uniforms.videoTexture.value = videoTexture;
            shaderMaterial.uniforms.eyePopTexture.value = canvasTexture;
            shaderMaterial.uniforms.videoTexture.value.needsUpdate = true;
            shaderMaterial.uniforms.eyePopTexture.value.needsUpdate = true;
        }

    })

    const onMouseDown = (e) =>
    {
        let x = mousePosition.x;
        let y = mousePosition.y;
        console.log('mouse down', x, y);
        isMouseDown = (true);
        setFirstPoint({ x: x, y: y });
    }

    const onMouseUp = (e) =>
    {
        let x = mousePosition.x;
        let y = mousePosition.y;
        console.log('mouse up', x, y);
        isMouseDown = (false);
        setSecondPoint({ x: x, y: y });
    }

    return (
        <>
            {aspect && shaderMaterial &&
                <mesh position={[ 0, 0, 0.01 ]} material={shaderMaterial}
                    onPointerDown={onMouseDown}
                    onPointerUp={onMouseUp}
                >
                    <planeGeometry args={[ aspect, 1, 1 ]} />
                </mesh >
            }

            {flowDataRef.current &&
                <>
                    <Html position={[ (-aspect / 2) + .1, .35, 0 ]} fullscreen={false} transform={true} distanceFactor={.5} >

                        <div className='flex flex-row justify-between w-full'>

                            <div className=" gap-4 h-full  bg-black opacity-75 min-w-32 min-h-32 justify-center text-center rounded-full outline outline-white ">

                                <div className='text-4xl translate-y-full' >
                                    {flowDataRef.current.flow1.count}
                                </div>


                                <div className="w-1/6 ml-14 mt-14" style={{ transform: `rotate(${flowDataRef.current.flow1.angle}deg)` }}>
                                    <div className="w-full h-px bg-white"></div>
                                    <div className="relative">
                                        <div className="absolute -left-3 -translate-y-1 rotate-90 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white rounded-sm"></div> {/* Tip */}
                                    </div>
                                </div>

                            </div>

                        </div>

                    </Html >

                    <Html position={[ (aspect / 2) - .1, .35, 0 ]} fullscreen={false} transform={true} distanceFactor={.5} >

                        <div className='flex flex-row justify-between w-full'>

                            <div className="gap-4 h-full bg-black opacity-75 min-w-32 min-h-32 justify-center text-center rounded-full outline outline-white ">

                                <div className='text-4xl translate-y-full' >
                                    {flowDataRef.current.flow2.count}
                                </div>

                                <div className="w-1/6 ml-14 mt-14" style={{ transform: `rotate(${flowDataRef.current.flow2.angle}deg)` }}>
                                    <div className="w-full h-px bg-white"></div>
                                    <div className="relative">
                                        <div className="absolute -left-3 -translate-y-1 rotate-90 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white rounded-sm"></div> {/* Tip */}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </Html >
                </>
            }
        </>
    );
};

export default EyePopDrawing
    ;
