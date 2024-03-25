import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useEyePop } from '../../store/EyePopWrapper';
import { useFrame } from '@react-three/fiber';


const WebcamMesh: React.FC<WebcamMeshProps> = () =>
{

    const { eyePop, webcamVideo } = useEyePop();

    const [ videoTexture, setVideoTexture ] = useState<THREE.VideoTexture | null>(null);

    const boxMeshRef = useRef<THREE.Mesh>(null);
    const [ aspectRatio, setAspectRatio ] = useState(16 / 9);

    useFrame(() =>
    {
        // initialize the webcam texture after eyepop is ready
        if (!boxMeshRef.current) return;
        if (!eyePop?.ready)
        {
            boxMeshRef.current.material.visible = false;
            return;
        }
        if (videoTexture)
        {
            boxMeshRef.current.material.visible = true;
            boxMeshRef.current.material.needsUpdate = true;
            return;
        }

        const texture = new THREE.VideoTexture(webcamVideo);
        texture.colorSpace = THREE.SRGBColorSpace;
        const aspectRatio = webcamVideo.width / webcamVideo.height;
        texture.needsUpdate = true;


        console.log('WebcamMesh setup', texture, webcamVideo, webcamVideo.width, webcamVideo.height, aspectRatio);

        setVideoTexture(texture);
        setAspectRatio(aspectRatio);


    })

    return (
        <mesh ref={boxMeshRef}>
            <planeGeometry args={[ aspectRatio, 1, ]} />
            <meshBasicMaterial map={videoTexture} needsUpdate={true} />
        </mesh>
    );
};

export default WebcamMesh;
