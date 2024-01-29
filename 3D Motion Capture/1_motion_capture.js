import * as THREE from 'three';

import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';


// TODO: 
// 1. smooth out points
// 2. add ability to import fbx model


var jointNodes =
{
    "mixamorigLeftShoulder": {
        "poseParent": [ "left shoulder", "right shoulder" ],
        "poseChild": [ "left shoulder" ],
        "quatCorrection": [ 0, 0, 0 ],
        "transformAxis": [ 0, 0, 0 ],
    },
    "mixamorigLeftArm": {
        "poseParent": [ "left shoulder" ],
        "poseChild": [ "left elbow" ],
        "quatCorrection": [ 0, 0, 0 ],
        "transformAxis": [ 0, 0, 0 ],
    },
    "mixamorigLeftForeArm": {
        "poseParent": [ "left elbow" ],
        "poseChild": [ "left wrist" ],
        "transformAxis": [ 0, 0, 0 ],
        "quatCorrection": [ 0, 0, 0 ],
    },
    "mixamorigLeftHand": {
        "poseParent": [ "left wrist" ],
        "poseChild": [ "left thumb" ],
        "transformAxis": [ 0, 0, 0 ],
        "quatCorrection": [ 0, 0, 0 ],
    },
    "mixamorigRightShoulder": {
        "poseParent": [ "left shoulder", "right shoulder" ],
        "poseChild": [ "right shoulder" ],
        "quatCorrection": [ 0, 0, 0 ],
        "transformAxis": [ 0, 0, 0 ],
    },
    "mixamorigRightArm": {
        "poseParent": [ "right shoulder" ],
        "poseChild": [ "right elbow" ],
        "quatCorrection": [ 0, 0, 0 ],
        "transformAxis": [ 0, 0, 0 ],
    },
    "mixamorigRightForeArm": {
        "poseParent": [ "right elbow" ],
        "poseChild": [ "right wrist" ],
        "transformAxis": [ 0, 0, 0 ],
        "quatCorrection": [ 0, 0, 0 ],
    },
    "mixamorigSpine1": {
        "poseParent": [ "left hip", "right hip" ],
        "poseChild": [ "left shoulder", "right shoulder" ],
        "transformAxis": [ 0, 0, 0 ],
        "quatCorrection": [ 0, 0, 0 ],
    },
    "mixamorigHead": {
        "poseParent": [ "left mouth", "right mouth" ],
        "poseChild": [ "left eye", "right eye" ],
        "transformAxis": [ 0, 0, 0 ],
    },
    "mixamorigNeck": {
        "poseParent": [ "left eye", "right eye" ],
        "poseChild": [ "left mouth", "right mouth" ],
        "transformAxis": [ 0, 0, 0 ],
        "quatCorrection": [ 0, 0, 0 ],
    }

};

const getRandomBrightColor = () =>
{
    const h = Math.random();
    const s = 1;
    const l = .5;
    return new THREE.Color().setHSL(h, s, l);
}


const buildScene = async (scene, renderer, modelData) =>
{
    // add an hdr environment map to the scene
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    // Create a new EXRLoader instance
    const exrLoader = new EXRLoader();

    // Load the EXR file
    exrLoader.load('./imgs/bg.exr', function (texture)
    {

        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;

        // Set the environment map to the loaded texture
        scene.environment = pmremGenerator.fromEquirectangular(texture).texture;
        // scene.background = texture;
        pmremGenerator.dispose();
    });

    renderer.toneMapping = THREE.LinearToneMapping;

    // directional light
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight1.position.set(20, -10, -10);
    directionalLight1.target.position.set(0, 0, 0);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.camera.top = 1;
    directionalLight1.shadow.camera.bottom = - 1;
    directionalLight1.shadow.camera.right = 1;
    directionalLight1.shadow.camera.left = - 1;
    directionalLight1.shadow.mapSize.set(2048, 2048);
    scene.add(directionalLight1);

    // directional light
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight2.position.set(-20, -10, -10);
    directionalLight2.target.position.set(0, 0, 0);
    directionalLight2.castShadow = true;
    directionalLight2.shadow.camera.top = 1;
    directionalLight2.shadow.camera.bottom = - 1;
    directionalLight2.shadow.camera.right = 1;
    directionalLight2.shadow.camera.left = - 1;
    directionalLight2.shadow.mapSize.set(2048, 2048);
    scene.add(directionalLight2);


    // ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    var loader = new GLTFLoader();
    // next we setup draco loader
    var dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(dracoLoader);


    // load bg model news.glb 
    const news = await loader.load('./models/news.glb', (gltf) =>
    {
        gltf.scene.rotation.set(0, Math.PI, 0);
        gltf.scene.scale.multiplyScalar(2);

        gltf.scene.scale.multiplyScalar(.8);
        gltf.scene.scale.y *= 1.8;
        gltf.scene.position.set(-.5, -4.2, 0);

        gltf.scene.traverse(o =>
        {
            if (o.isMesh)
            {
                o.castShadow = false;
                o.receiveShadow = false;
                o.material.side = THREE.FrontSide;
            }
        });

        scene.add(gltf.scene);
    });

    const avatars = [];

    // const model1 = new Promise((resolve, reject) =>
    // {
    //     // import fbx model
    //     const joints = {};

    //     loader.load(
    //         './models/girl.glb',
    //         function (gltf)
    //         {
    //             let model, mixer, idle;

    //             model = gltf.scene;
    //             let fileAnimations = gltf.animations;

    //             model.traverse(o =>
    //             {

    //                 if (o.isMesh)
    //                 {
    //                     o.castShadow = true;
    //                     o.receiveShadow = true;
    //                     o.visible = true;
    //                 }

    //                 if (!o.isBone) return;

    //                 joints[ o.name ] = o;

    //             });
    //             model.scale.set(-2, 2.5, -2);
    //             model.position.set(1.5, -4.1, 0);

    //             mixer = new THREE.AnimationMixer(model);
    //             let idleAnim = THREE.AnimationClip.findByName(fileAnimations, 'idle');

    //             idle = mixer.clipAction(idleAnim);
    //             // idle.play();
    //             scene.add(model);

    //             avatars.push({ model, joints });

    //             resolve({ model, joints, mixer });
    //         });
    // });

    const model2 = new Promise((resolve, reject) =>
    {
        let joints = {};
        loader.load('./models/boy.glb', (object) =>
        {
            object.scene.scale.set(-2, 2.5, -2);
            // object.scene.position.set(-1.5, -4.1, 0);
            object.scene.position.set(-0.0, -4.1, 0);
            object.scene.traverse(o =>
            {
                if (o.isMesh)
                {
                    o.castShadow = true;
                    o.receiveShadow = true;
                    o.material.side = THREE.FrontSide;
                    o.visible = true;
                }

                if (!o.isBone) return;

                joints[ o.name ] = o;

            });
            avatars.push({ model: object.scene, joints });
            scene.add(object.scene);
            resolve({ model: object.scene, joints });
        });

    });

    // await Promise.all([ model1, model2 ]);
    await Promise.all([ model2 ]);


    return avatars;
}


function averagePoseDataPoints(points, poseData)
{
    let midPoint = new THREE.Vector3();

    for (let point of points)
    {
        if (!(point in poseData)) return null;

        midPoint.add(poseData[ point ]);
    }

    midPoint.divideScalar(points.length);

    return midPoint;
}

const handleCamera = (controls) =>
{
    controls.zoomTo(.38, true);
    // controls.zoomTo(.6, true);
    controls.polarAngle = THREE.MathUtils.DEG2RAD * 80;
    controls.azimuthAngle = THREE.MathUtils.DEG2RAD * 180;

    // let timeLine = gsap.timeline({ repeat: -1, yoyo: true });
    // timeLine.to(controls, { duration: 10, azimuthAngle: THREE.MathUtils.DEG2RAD * 200, ease: "sine.inOut" });
    // timeLine.to(controls, { duration: 10, azimuthAngle: THREE.MathUtils.DEG2RAD * 160, ease: "sine.inOut" });
    // // use gsap to move the polar angle like a sine wave
    // gsap.to(controls, { duration: 25, polarAngle: THREE.MathUtils.DEG2RAD * 90, ease: "sine.inOut", repeat: -1, yoyo: true });

}


const setupDebugging = (thirdEyePop, scene, avatars) =>
{
    if (loading)
    {
        loading.remove();
    }
    // load json file ./test_data/pose_capture_data.json and every 100ms push a frame to thirdEyePop
    let frames = [];
    fetch("./test_data/spider_man_capture.json")
        .then(response => response.json())
        .then(data => frames = data)
        .then(() =>
        {
            let i = 0;
            setInterval(() =>
            {
                // console.log(frames[ i++ % frames.length ])
                const frame = frames[ i++ % frames.length ];
                // const frame = frames[ frames.length - 100 ];
                if (frame)
                {
                    thirdEyePop.pushPredictionData(frame);
                }

            }, 1);

        });

    avatars.forEach((avatar) =>
    {
        const helper = new THREE.SkeletonHelper(avatar.model.children[ 0 ]);
        scene.add(helper);
    });
    return;
}

export const updateScene = async (thirdEyePop, modelData, isDebugging) =>
{

    let scene = thirdEyePop.getScene();
    const renderer = thirdEyePop.getRenderer();

    const controls = thirdEyePop.getControls();
    handleCamera(controls);

    let avatars = await buildScene(scene, renderer, modelData);

    if (isDebugging)
    {
        setupDebugging(thirdEyePop, scene, avatars);
    }

    thirdEyePop.onUpdate = function ()
    {
        const activePeople = thirdEyePop.getActivePeople();

        for (let i = 0; i < avatars.length; i++)
        {
            const element = avatars[ i ];
            const joints = element.joints;

            if (!activePeople) return;
            if (activePeople.length <= 0) return;
            if (!"poseData" in activePeople[ 0 ]) return;
            if (!"faceData" in activePeople[ 0 ]) return;
            if (!activePeople[ 0 ].poseData.points) return;
            if (!activePeople[ 0 ].faceData.points) return;

            const poseData = activePeople[ 0 ].poseData;

            for (const jointKey in joints)
            {
                const joint = joints[ jointKey ];
                const node = jointNodes[ jointKey ];

                if (!node) continue;
                if (!node.poseParent || !node.poseChild) continue;

                // we get the parent and child points from the poseMap which we map to the model's joints
                const poseParent = averagePoseDataPoints(node.poseParent, poseData.points);
                const poseChild = averagePoseDataPoints(node.poseChild, poseData.points);

                if (!poseParent || !poseChild) continue;
                if (joint.children.length <= 0) continue;

                // we store the starting rotation of the joint so that it preserves a proper rotation after moving it
                if (!node.initialQuaternion)
                {
                    node.initialQuaternion = joint.quaternion.clone();
                } else
                {
                    joint.quaternion.copy(node.initialQuaternion);
                }

                let jointWorldPosition = joint.getWorldPosition(new THREE.Vector3());

                // we get the a child to parent directional vector from the pose data to rotate our model
                let poseVector = new THREE.Vector3();
                poseVector.subVectors(poseChild, poseParent);

                // we place this vector in child joint space so we can rotate the joint to face it
                let childTargetWorld = new THREE.Vector3();
                childTargetWorld.addVectors(jointWorldPosition, poseVector);

                let targetInJointSpace = joint.worldToLocal(childTargetWorld.clone()).normalize();

                // we store the initial child position in joint space so this rotation is also preserved
                if (!node.initialChildInJointSpace)
                {
                    let childJoint = joint.children[ 0 ];
                    let childWorldPosition = childJoint.getWorldPosition(new THREE.Vector3());
                    node.initialChildInJointSpace = joint.worldToLocal(childWorldPosition.clone()).normalize();
                }

                // we rotate our joint to face the target rotation, which is the direction of the child joint
                joint.quaternion.multiply(new THREE.Quaternion().setFromUnitVectors(node.initialChildInJointSpace, targetInJointSpace));

            }
        }
    }

}

// http://localhost:8081/3D%20Motion%20Capture/1_motion_capture.html
