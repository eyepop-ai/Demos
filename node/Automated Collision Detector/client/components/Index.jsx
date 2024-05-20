import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, CameraControls, Plane } from '@react-three/drei';
import * as THREE from 'three';

import { VideoMesh } from './VideoMesh.jsx';
import EyePopDrawing from './EyePopDrawing.jsx';
import Controls from './Controls.jsx';

export function Index()
{

    return (
        <div className='flex flex-col justify-center items-center gap-2 m-5 text-white h-full'>

            <Controls />

            <Canvas
                className='w-full h-full'
                dpr={window.devicePixelRatio * 2}>

                <VideoMesh />

                <EyePopDrawing />

            </Canvas >

        </div>
    );
}
