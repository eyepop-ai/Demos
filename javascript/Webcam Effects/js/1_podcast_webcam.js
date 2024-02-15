import * as THREE from 'https://unpkg.com/three/build/three.module.js';

const meshPool = [];
const activeMeshes = [];
const webcamTexture = undefined;

const getMeshFromPool = () =>
{
    for (const mesh of meshPool)
    {
        if (!mesh.visible)
        {
            return mesh;
        }
    }
    return null;
}

export const updateScene = async (thirdEyePop) =>
{
    const raycaster = new THREE.Raycaster();
    const scene = thirdEyePop.getScene();
    const renderer = thirdEyePop.getRenderer();
    const renderManager = thirdEyePop.getRenderManager();
    webcamTexture = renderManager.videoTexture;

    // remove web rfom scene
    const buildScene = async (scene, renderer) =>
    {

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        const bgPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })
        );

        bgPlane.position.z = 10;
        bgPlane.rotateZ(Math.PI / 2);
        // scene.add(bgPlane);

        // build a pool of plane meshes to be used to display all the people in the webcam feed
        meshPool = [];
        const planeCount = 50;
        for (let i = 0; i < planeCount; i++)
        {
            const plane = new THREE.Mesh(
                new THREE.PlaneGeometry(1, 1),
                new THREE.MeshBasicMaterial({ map: webcamTexture, side: THREE.DoubleSide })
            );

            plane.visible = false;
            scene.add(plane);
            meshPool.push(plane);

        }

    }

    await buildScene(scene, renderer);


    // runs every frame
    thirdEyePop.onUpdate = function ()
    {

        // get active people
        const activePeople = thirdEyePop.getActivePeople();
        activeMeshes = [];

        for (const person of activePeople)
        {
            console.log(person);


            if (person.mesh === undefined)
            {
                person.mesh = getMeshFromPool();
            }

            activeMeshes.push(person.mesh);

        }

    };


}
