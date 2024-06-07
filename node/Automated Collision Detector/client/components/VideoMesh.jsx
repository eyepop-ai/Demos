import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, CameraControls } from '@react-three/drei';
import { useEyePop } from '../hook/EyePopContext.jsx';

export const VideoMesh = () =>
{
    const { gl } = useThree();
    const { videoURL, videoRef } = useEyePop();

    const meshRef = useRef(null);
    const cameraRef = useRef();

    const [ videoTexture, setVideoTexture ] = useState(null);
    const [ aspect, setAspect ] = useState(1);

    // makes the canvas go fullscreen on the f key being pressed
    const handleKeyDown = (e) =>
    {

        if (e.key === 'f')
        {
            gl.domElement.style.position = 'absolute';
            gl.domElement.style.top = '0';
            gl.domElement.style.left = '0';
            gl.domElement.style.width = '100%';
            gl.domElement.style.height = '100%';
            gl.domElement.requestFullscreen();

        } else if (e.key === 'r')
        {

            videoRef.current.currentTime = 0;

        } else if (e.key === "ArrowRight")
        {
            videoRef.current.currentTime += .05;
        } else if (e.key === "ArrowLeft")
        {
            videoRef.current.currentTime -= .05;
        } else if (e.key === "ArrowUp")
        {
            videoRef.current.play();
        } else if (e.key === "ArrowDown")
        {
            videoRef.current.pause();
        }

        cameraRef.current.fitToBox(meshRef.current, true);

    };

    useEffect(() =>
    {
        if (cameraRef.current)
        {
            cameraRef.current.fitToBox(meshRef.current, true);
        }
        document.addEventListener('keydown', handleKeyDown);

        return () =>
        {
            document.removeEventListener('keydown', handleKeyDown);
        };
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
