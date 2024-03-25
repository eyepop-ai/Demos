/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.2.16 .\EyePopPersonBoundsIndicator.glb -T -p 6 -j -s -K -k -R 2048 
Files: .\EyePopPersonBoundsIndicator.glb [3.96KB] > C:\Users\edmun\OneDrive\Documents\_SPACE\EyePop\EyePopDemos\node\basic-eyepop-example\src\assets\EyePopPersonBoundsIndicator-transformed.glb [2.36KB] (40%)
*/
import gltfModel from './EyePopPersonBoundsIndicator-transformed.glb'
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export const PersonBoundsIndicator = React.forwardRef((props, ref) =>
{
  const { nodes, materials } = useGLTF(gltfModel)
  return (
    <group {...props}>

      <mesh name="line" geometry={nodes.line.geometry} material={materials.basic_grey} rotation={[ 0, 0, 0 ]} scale={[ 1, 1, 1 ]} />

      <mesh name="top" geometry={nodes.top.geometry} material={materials[ 'basic_white.001' ]} position={[ 0, 0, 0, ]} scale={[ 1, 1, 1 ]} />

      <mesh name="bottom" geometry={nodes.bottom.geometry} material={materials[ 'basic_white.001' ]} position={[ 0, 0, 0 ]} scale={[ 1, 1, 1 ]} />


    </group>
  )
})

useGLTF.preload(gltfModel)
