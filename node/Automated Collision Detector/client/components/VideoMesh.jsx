import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, CameraControls } from '@react-three/drei';
import { useEyePop } from '../hook/EyePopContext.jsx';

export const VideoMesh = () =>
{
    const { gl } = useThree();
    const { videoURL, videoRef, aspect, videoTexture } = useEyePop();

    const [ padding ] = useState(.15);

    const meshRef = useRef(null);
    const cameraRef = useRef();

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
            videoRef.current.currentTime -= .5;
        } else if (e.key === "ArrowUp")
        {
            videoRef.current.play();
        } else if (e.key === "ArrowDown")
        {
            videoRef.current.pause();
        }

        if (cameraRef.current && meshRef.current)
        {
            cameraRef.current.fitToBox(meshRef.current, true, { paddingTop: padding, paddingLeft: padding, paddingBottom: padding, paddingRight: padding });
        }

    };

    useEffect(() =>
    {
        if (cameraRef.current && meshRef.current)
        {
            cameraRef.current.mouseButtons.left = null;
            cameraRef.current.mouseButtons.right = null;
            cameraRef.current.mouseButtons.middle = null;
        }

        document.addEventListener('keydown', handleKeyDown);

        if (meshRef.current && cameraRef.current)
        {
            console.log('fitting to box', meshRef.current);
            meshRef.current.geometry.computeBoundingBox()

            cameraRef.current.fitToBox(meshRef.current, true, { paddingTop: padding, paddingLeft: padding, paddingBottom: padding, paddingRight: padding });
        }

        return () =>
        {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [ cameraRef, videoURL ])



    return (
        <>

            <CameraControls ref={cameraRef} />

            {/* <Environment preset="city" resolution={512} /> */}

            <mesh ref={meshRef} >
                <planeGeometry args={[ aspect, 1, 1 ]} />
                <meshBasicMaterial visible={false} />
            </mesh>

        </>
    );
};
