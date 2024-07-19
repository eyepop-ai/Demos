import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, CameraControls, Plane } from '@react-three/drei';
import * as THREE from 'three';

import { VideoMesh } from './VideoMesh.jsx';
import EyePopDrawing from './EyePopDrawing.jsx';
import Controls from './Controls.jsx';
import { useEyePop } from '../hook/EyePopContext.jsx';

export function Index()
{
    const canvasParentRef = useRef(null);
    const canvasRef = useRef(null);

    return (
        <div ref={canvasParentRef} className='flex flex-col justify-center items-center text-white h-full w-full'>

            <Controls />

            <Canvas
                ref={canvasRef}
                className='w-full h-full'
                dpr={window.devicePixelRatio * 2}>

                <VideoMesh />

                <EyePopDrawing />

            </Canvas >

        </div>
    );
}
