import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Environment, CameraControls } from '@react-three/drei';
import { useEyePop } from '../hook/EyePopContext.jsx';

export const VideoMesh = () =>
{

    const { videoURL, videoRef } = useEyePop();

    const meshRef = useRef(null);
    const cameraRef = useRef();

    const [ videoTexture, setVideoTexture ] = useState(null);
    const [ aspect, setAspect ] = useState(1);

    useEffect(() =>
    {
        if (cameraRef.current)
        {
            cameraRef.current.fitToBox(meshRef.current, true);
        }
    }, [ cameraRef ])

    useFrame(() =>
    {
        if (!meshRef.current) return;

        if (!videoRef?.current)
        {
            meshRef.current.material.visible = false;
            return;
        }

        if (videoTexture)
        {
            meshRef.current.material.visible = true;
            meshRef.current.material.needsUpdate = true;
            return;
        }

        if (!videoURL) { return; }

        // Check if the video is ready
        if (videoRef.current.readyState < 2) { return; }


        videoRef.current.crossOrigin = "anonymous"; // Add this line
        const texture = new THREE.VideoTexture(videoRef.current);
        texture.generateMipmaps = true;

        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;

        texture.needsUpdate = true;
        setVideoTexture(texture);

        const aspect = videoRef.current.videoWidth / videoRef.current.videoHeight;

        setAspect(aspect);
        // meshRef.current.scale.x = aspect;

        if (cameraRef.current)
        {
            cameraRef.current.fitToBox(meshRef.current, true);
        }
    })

    return (
        <>

            <CameraControls ref={cameraRef} />
            <Environment preset="city" resolution={512} />
            {/* <pointLight position={[ 0, 0, 10 ]} decay={0} intensity={5} /> */}

            <mesh ref={meshRef} >
                <planeGeometry args={[ aspect, 1, 1 ]} />
                <meshBasicMaterial visible={false} />
            </mesh>

        </>
    );
};
