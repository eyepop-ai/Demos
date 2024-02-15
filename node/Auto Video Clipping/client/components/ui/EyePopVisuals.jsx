import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { Flex, Box } from '@react-three/flex'

const EyePopVisuals = ({ className, resultCanvasRef, videoRef }) =>
{
    const sharedClass = 'absolute top-0 left-0 w-full h-full object-contain';

    const cameraRef = useRef();
    const layoutRef = useRef();

    useEffect(() =>
    {

        if (!cameraRef.current) return;
        if (!layoutRef.current) return;

        cameraRef.current.fitToBox(layoutRef.current, true, { paddingLeft: 0.5, paddingRight: 0.5, paddingBottom: 0.5, paddingTop: 0.5 });

    }, [ cameraRef.current, layoutRef.current ]);


    return (
        <div
            className={`${className} w-full h-full`} >

            {/* <Canvas
                className={`${sharedClass}`}
            >
                <CameraControls ref={cameraRef} />
                <ambientLight />
                <pointLight position={[ 10, 10, 10 ]} />


                <Flex justifyContent="center" alignItems="center">

                    <Box centerAnchor>
                        <mesh>
                            <boxGeometry args={[ 1, 1, 1 ]} />
                            <meshStandardMaterial color="blue" />
                        </mesh>
                    </Box>

                    <Box centerAnchor flexGrow={1}>
                        <mesh>
                            <boxGeometry args={[ 1, 1, 1 ]} />
                            <meshStandardMaterial color="blue" />
                        </mesh>
                    </Box>

                </Flex>

            </Canvas> */}

            <canvas
                id="result-overlay"
                ref={resultCanvasRef}
                className={`${sharedClass}`}
            ></canvas>

            <video
                ref={videoRef}
                className={`${sharedClass}`}
                autoPlay
                playsInline
                muted
            ></video>

        </div >
    );
};

export default EyePopVisuals;
