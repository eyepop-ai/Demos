import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useEyePop } from '../../store/EyePopWrapper';
import { WorkoutIndicator } from '../../assets/WorkoutIndicator';
import { PersonBoundsIndicator } from '../../assets/PersonBoundsIndicator';

import * as THREE from 'three';
import { useSceneStore } from '../../store/SceneStore';


const rulesStateArray = [];


const EyePopDrawing: React.FC = () =>
{

    // Our external state stores, use for simplifying state management accross components
    const { eyePop } = useEyePop();
    const { incrementRep, workoutRules, } = useSceneStore();


    const personBoundsRef = useRef<THREE.Group>(null);
    const groupRef = useRef<THREE.Group>(null);
    const [ personBoundsScalar, setPersonBoundsScalar ] = useState(0);
    const averageDistance = { average: 0, value: 0, count: 0 };
    const scalarAverage = { average: 0, value: 0, count: 0 };

    const normalizePosition = (x: number, y: number, width: number, height: number, sourceWidth: number, sourceHeight: number) =>
    {
        // since we are using a plane which is resized to the aspect ratio of the video,
        //  we need to normalize the position of the person to that aspect ratio, instead of something more common,
        //  like -1, to 1
        const aspectRatio = sourceWidth / sourceHeight;

        return {
            x: ((x / sourceWidth) - 0.5) * aspectRatio,
            y: ((y / sourceHeight) - 0.5) * -1,
            width: (width / sourceWidth) * aspectRatio,
            height: height / sourceHeight
        }
    }

    const manageDynamicMeshes = (person, prediction) =>
    {
        // for normalizing the bounds of the person
        const sourceWidth = prediction.source_width;
        const sourceHeight = prediction.source_height;

        const groupChildren = groupRef.current.children;

        const { x, y, width, height } = normalizePosition(person.x, person.y, person.width, person.height, sourceWidth, sourceHeight);

        const { x: xMax, y: yMax } = normalizePosition((person.x + person.width), person.y + person.height, person.width, person.height, sourceWidth, sourceHeight);

        const z = .01;
        for (const child of groupChildren)
        {
            if (child.type === 'Mesh')
            {
                child.visible = false;
            }

            if (child.name.includes('trace' + person.traceId))
            {
                child.visible = true;

                const parentPosition = new THREE.Vector3();
                groupRef.current?.getWorldPosition(parentPosition);

                personBoundsRef.current?.position.set(
                    x - parentPosition.x,
                    yMax - parentPosition.y,
                    z - parentPosition.z
                );
            }
        }

        let areMeshesAdded = false;

        for (const child of groupChildren)
        {
            if (child.name.includes('trace' + person.traceId))
            {
                areMeshesAdded = true;
            }
        }

        if (!areMeshesAdded)
        {
            personBoundsRef.current.name = 'trace' + person.traceId + '_bounds';
            // Add the box to the group
            groupRef.current.add(personBoundsRef.current);
        }

        managePersonBoundsIndicator(person, prediction);
    }

    // meter start scale 0 and go to 100
    // remove balls from the indicator
    const manageLowCodeRules = (prediction) =>
    {

        if (!workoutRules)
        {
            console.error('No low code rules found');
            return
        }

        try
        {
            const rulesArray = EyePopSDK.Rules.createConditional(workoutRules);

            const log = EyePopSDK.Rules.Check(prediction, [ rulesArray ], rulesStateArray);

            if (log.length <= 0) return
            if (log[ 0 ].length <= 0) return

            if (log[ 0 ][ 0 ] === true)
            {
                incrementRep();
            }
        } catch (e)
        {
            console.log('Error parsing rules', e);
        }

    }

    // This function will manage the bounds of the person
    //   we make the scale of the personBoundsIndicator be proportional to the inverse of the distance from the
    //   waist to the knee of the person
    const managePersonBoundsIndicator = (person, prediction) =>
    {
        let kneePosition = null;
        let waistPosition = null;

        if (!('keyPoints' in person)) return;

        for (let i = 0; i < person.keyPoints.length; i++)
        {
            const pointsArray = person.keyPoints[ i ].points;
            for (let j = 0; j < pointsArray.length; j++)
            {
                {
                    const point = pointsArray[ j ];
                    if (point.classLabel === 'right knee')
                    {
                        kneePosition = new THREE.Vector2(point.x, point.y);
                    }
                    if (point.classLabel === 'right hip')
                    {
                        waistPosition = new THREE.Vector2(point.x, point.y);
                    }
                }
            }

        }

        if (!kneePosition || !waistPosition) return;


        const distance = (kneePosition.y - waistPosition.y)

        if (distance < 0)
        {
            setPersonBoundsScalar(1);
            return
        }

        averageDistance.value += person.height / 4;
        averageDistance.count++;

        averageDistance.average = averageDistance.value / averageDistance.count;

        if (averageDistance.count === 1000)
        {
            averageDistance.value = 0;
            averageDistance.count = 0;
        }

        const scalar = Math.max(1 - THREE.MathUtils.mapLinear(distance, 0, averageDistance.average, 0, 1), 0);

        scalarAverage.value += scalar;
        scalarAverage.count++;

        scalarAverage.average = scalarAverage.value / scalarAverage.count;

        if (scalarAverage.count === 50)
        {
            scalarAverage.value = 0;
            scalarAverage.count = 0;
        }


        setPersonBoundsScalar(scalarAverage.average)

    }

    // The primary update loop which will run per frame
    useFrame(() =>
    {
        if (!groupRef.current) return;
        if (!eyePop?.ready) return;

        // The computer vision prediction result from the EyePop SDK
        const prediction = eyePop?.getPrediction();

        if (!prediction) return;
        if (!prediction.objects) return;
        if (prediction.objects.length === 0) return;

        // finds the biggest person, ensure it's classLabel is 'person'
        const people = prediction.objects.filter((o: any) => o.classLabel === 'person');
        if (people.length === 0) return;

        // find the person with the biggest width and height
        const person = people.reduce((prev, current) => (prev.width * prev.height > current.width * current.height) ? prev : current);

        if (!person.traceId) return;

        // Handles the person indicator bar which is a dynamic mesh
        manageDynamicMeshes(person, prediction);

        // Handles the low code rules
        manageLowCodeRules(prediction);
    });


    return (
        <group ref={groupRef}>

            <group ref={personBoundsRef} position={[ -100, -100, -100 ]} >
                <PersonBoundsIndicator scale={[ .01, .02 * personBoundsScalar, .01 ]} />
            </group>

            <WorkoutIndicator />

        </group>
    );
};

export default EyePopDrawing;
