import * as THREE from "three";

import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

import { gsap } from "https://cdn.skypack.dev/gsap";

var jointNodes = {
    mixamorigLeftShoulder: {
        poseParent: [ "left shoulder", "right shoulder" ],
        poseChild: [ "left shoulder" ],
        quatCorrection: [ 0, 0, 0 ],
        transformAxis: [ 0, 0, 0 ],
    },
    mixamorigLeftArm: {
        poseParent: [ "left shoulder" ],
        poseChild: [ "left elbow" ],
        quatCorrection: [ 0, 0, 0 ],
        transformAxis: [ 0, 0, 0 ],
    },
    mixamorigLeftForeArm: {
        poseParent: [ "left elbow" ],
        poseChild: [ "left wrist" ],
        transformAxis: [ 0, 0, 0 ],
        quatCorrection: [ 0, 0, 0 ],
    },
    mixamorigLeftHand: {
        poseParent: [ "left wrist" ],
        poseChild: [ "left thumb" ],
        transformAxis: [ 0, 0, 0 ],
        quatCorrection: [ 0, 0, 0 ],
    },
    mixamorigRightShoulder: {
        poseParent: [ "left shoulder", "right shoulder" ],
        poseChild: [ "right shoulder" ],
        quatCorrection: [ 0, 0, 0 ],
        transformAxis: [ 0, 0, 0 ],
    },
    mixamorigRightArm: {
        poseParent: [ "right shoulder" ],
        poseChild: [ "right elbow" ],
        quatCorrection: [ 0, 0, 0 ],
        transformAxis: [ 0, 0, 0 ],
    },
    mixamorigRightForeArm: {
        poseParent: [ "right elbow" ],
        poseChild: [ "right wrist" ],
        transformAxis: [ 0, 0, 0 ],
        quatCorrection: [ 0, 0, 0 ],
    },
    mixamorigSpine1: {
        poseParent: [ "left hip", "right hip" ],
        poseChild: [ "left shoulder", "right shoulder" ],
        transformAxis: [ 0, 0, 0 ],
        quatCorrection: [ 0, 0, 0 ],
    },
    mixamorigHead: {
        poseParent: [ "left mouth", "right mouth" ],
        poseChild: [ "left eye", "right eye" ],
        transformAxis: [ 0, 0, 0 ],
    },
    mixamorigNeck: {
        poseParent: [ "left eye", "right eye" ],
        poseChild: [ "left mouth", "right mouth" ],
        transformAxis: [ 0, 0, 0 ],
        quatCorrection: [ 0, 0, 0 ],
    },
};

const buildScene = async (scene, renderer, modelData) =>
{
    // add an hdr environment map to the scene
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    // Create a new EXRLoader instance
    const exrLoader = new EXRLoader();

    // Load the EXR file
    exrLoader.load("./imgs/bg.exr", function (texture)
    {
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;

        // Set the environment map to the loaded texture
        scene.environment = pmremGenerator.fromEquirectangular(texture).texture;
        pmremGenerator.dispose();
    });

    renderer.toneMapping = THREE.LinearToneMapping;

    // directional light
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight1.position.set(20, -10, -10);
    directionalLight1.target.position.set(0, 0, 0);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.type = THREE.PCFSoftShadowMap;
    directionalLight1.shadow.bias = -0.0005;
    directionalLight1.shadow.camera.top = 1;
    directionalLight1.shadow.camera.bottom = -1;
    directionalLight1.shadow.camera.right = 1;
    directionalLight1.shadow.camera.left = -1;
    directionalLight1.shadow.mapSize.set(2048, 2048);
    scene.add(directionalLight1);

    // ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);

    var loader = new GLTFLoader();
    // next we setup draco loader
    var dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    loader.setDRACOLoader(dracoLoader);

    const avatars = [];

    // load bg model news.glb
    const bgModel = new Promise((resolve, reject) =>
    {
        loader.load("./models/news.glb", (gltf) =>
        {
            gltf.scene.rotation.set(0, Math.PI, 0);

            gltf.scene.scale.x = 1.6;
            gltf.scene.scale.z = 1.6;
            gltf.scene.scale.y = 1.8;

            gltf.scene.position.set(-0.5, -3.1, 0);

            gltf.scene.traverse((o) =>
            {
                if (o.isMesh)
                {
                    o.castShadow = false;
                    o.receiveShadow = false;
                    o.material.side = THREE.FrontSide;
                }
            });

            scene.add(gltf.scene);
            resolve();
        });
    });

    let model = null;
    let joints = {};

    if (modelData.path.includes(".fbx"))
    {
        const fbxLoader = new FBXLoader();
        fbxLoader.load(modelData.path, (object) =>
        {
            object.rotation.set(
                modelData.rotation.x * THREE.MathUtils.DEG2RAD,
                modelData.rotation.y * THREE.MathUtils.DEG2RAD,
                modelData.rotation.z * THREE.MathUtils.DEG2RAD,
            );

            object.scale.x = modelData.scale.x;
            object.scale.y = modelData.scale.y;
            object.scale.z = modelData.scale.z;

            object.position.x = modelData.position.x;
            object.position.y = modelData.position.y;
            object.position.z = modelData.position.z;

            object.traverse((o) =>
            {
                if (o.isMesh)
                {
                    if (o.material)
                    {
                        o.material.roughness = 1;
                        o.material.metalness = 0;
                    }

                    o.castShadow = true;
                    o.receiveShadow = true;
                    o.material.side = THREE.FrontSide;
                }

                console.log(o.name);

                if (!o.isBone) return;

                joints[ o.name ] = o;
            });

            avatars.push({ model: object, joints });
            scene.add(object);
        });
    } else if (modelData.path.includes(".glb") || modelData.path.includes(".gltf"))
    {
        model = new Promise((resolve, reject) =>
        {
            loader.load(modelData.path, (object) =>
            {
                object.scene.rotation.set(
                    modelData.rotation.x * THREE.MathUtils.DEG2RAD,
                    modelData.rotation.y * THREE.MathUtils.DEG2RAD,
                    modelData.rotation.z * THREE.MathUtils.DEG2RAD,
                );

                object.scene.scale.x = modelData.scale.x;
                object.scene.scale.y = modelData.scale.y;
                object.scene.scale.z = modelData.scale.z;

                object.scene.position.x = modelData.position.x;
                object.scene.position.y = modelData.position.y;
                object.scene.position.z = modelData.position.z;

                object.scene.traverse((o) =>
                {
                    if (o.isMesh)
                    {
                        if (o.material)
                        {
                            o.material.roughness = 1;
                            o.material.metalness = 0;
                        }

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
    }

    await Promise.all([ model, bgModel ]);
    return avatars;
};

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
    controls.zoomTo(0.38, true);

    controls.polarAngle = THREE.MathUtils.DEG2RAD * 80;
    controls.azimuthAngle = THREE.MathUtils.DEG2RAD * 180;

    let timeLine = gsap.timeline({ repeat: -1, yoyo: true });
    timeLine.to(controls, {
        duration: 10,
        azimuthAngle: THREE.MathUtils.DEG2RAD * 190,
        ease: "sine.inOut",
    });
    timeLine.to(controls, {
        duration: 10,
        azimuthAngle: THREE.MathUtils.DEG2RAD * 170,
        ease: "sine.inOut",
    });
    // use gsap to move the polar angle like a sine wave
    gsap.to(controls, {
        duration: 25,
        polarAngle: THREE.MathUtils.DEG2RAD * 90,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
    });
};

const setupDebugging = (thirdEyePop, scene, avatars) =>
{
    if (loading)
    {
        loading.remove();
    }
    // load json file ./test_data/pose_capture_data.json and every 1ms push a frame to thirdEyePop
    let frames = [];
    fetch("./test_data/spider_capture.json")
        .then((response) => response.json())
        .then((data) => (frames = data))
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
};

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
            if ((!"poseData") in activePeople[ 0 ]) return;
            if ((!"faceData") in activePeople[ 0 ]) return;
            if (!activePeople[ 0 ].poseData.points) return;
            if (!activePeople[ 0 ].faceData.points) return;

            const poseData = activePeople[ 0 ].poseData;

            for (const jointKey in joints)
            {
                const joint = joints[ jointKey ];
                let node = jointNodes[ jointKey ];

                // Check and remove the version if found in the mixamorig
                if (!node)
                {
                    // split the joint key by mixamorig
                    const split = jointKey.split("mixamorig");
                    // remove first character of the second part of the split
                    const jointName = split[ 1 ].substring(1);
                    // check if the joint name is in the joint nodes
                    node = jointNodes[ "mixamorig" + jointName ];
                }

                if (!node) continue;

                if (!node.poseParent || !node.poseChild) continue;

                // we get the parent and child points from the poseMap which we map to the model's joints
                const poseParent = averagePoseDataPoints(
                    node.poseParent,
                    poseData.points,
                );
                const poseChild = averagePoseDataPoints(
                    node.poseChild,
                    poseData.points,
                );

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

                let targetInJointSpace = joint
                    .worldToLocal(childTargetWorld.clone())
                    .normalize();

                // we store the initial child position in joint space so this rotation is also preserved
                if (!node.initialChildInJointSpace)
                {
                    let childJoint = joint.children[ 0 ];
                    let childWorldPosition = childJoint.getWorldPosition(
                        new THREE.Vector3(),
                    );
                    node.initialChildInJointSpace = joint
                        .worldToLocal(childWorldPosition.clone())
                        .normalize();
                }

                // we rotate our joint to face the target rotation, which is the direction of the child joint
                joint.quaternion.multiply(
                    new THREE.Quaternion().setFromUnitVectors(
                        node.initialChildInJointSpace,
                        targetInJointSpace,
                    ),
                );
            }
        }
    };
};

