import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { RGBELoader } from 'https://unpkg.com/three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'https://unpkg.com/three/examples/jsm/geometries/DecalGeometry.js';
import { EXRLoader } from 'https://unpkg.com/three/examples/jsm/loaders/EXRLoader.js';

// import * as CANNON from "https://unpkg.com/cannon-es/dist/cannon-es.js";
// const world = new CANNON.World();
// world.gravity.set(0, 0, 0); // m/s²

var envTexture;

export const updateScene = async (thirdEyePop) =>
{
    const raycaster = new THREE.Raycaster();
    const scene = thirdEyePop.getScene();
    const renderer = thirdEyePop.getRenderer();

    const getRandomBrightColor = (max = 1) =>
    {
        const color = new THREE.Color();
        color.setHSL(Math.random() * max, 1.0, 0.5);
        return color;
    }

    const createRandomSceneObjects = (scene, count) =>
    {
        const boxes = [];

        const group = new THREE.Group();
        boxes.push(group);

        for (let i = 0; i < count; i++)
        {

            const box = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 16, 16),
                new THREE.MeshStandardMaterial({
                    color: getRandomBrightColor(),
                    metalness: .8, // Reflectivity of the material
                    roughness: .1, // Smoothness of the material
                    envMap: envTexture,
                })
            );

            let distance = 2;

            let x = (Math.random() * 2 - 1) * distance;
            let y = (Math.random() * 2 - 1) * distance;
            let z = (Math.random() * 2 - 1) * distance;

            let scale = Math.random() * 2;

            box.position.set(x, y, z);
            box.rotation.set(Math.random(), Math.random(), Math.random());
            box.scale.set(scale, scale, scale);

            group.add(box);
            boxes.push(box);

        }

        scene.add(group);

        const boundsGeometry = new THREE.SphereGeometry(1.2, 16, 16);
        const boundingMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, side: THREE.DoubleSide });
        const boundinMesh = new THREE.Mesh(boundsGeometry, boundingMaterial);
        scene.add(boundinMesh);
        boxes.push(boundinMesh);

        return boxes;

    }

    let randomSceneObjects = createRandomSceneObjects(scene, 0);

    // remove web rfom scene
    const buildScene = async (scene, renderer) =>
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
            texture.encoding = THREE.sRGBEncoding;
            texture.mapping = THREE.EquirectangularReflectionMapping;

            // Set the environment map to the loaded texture
            scene.environment = pmremGenerator.fromEquirectangular(texture).texture;
            envTexture = texture;
            // scene.background = texture;
            pmremGenerator.dispose();

        });

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);

        // load a web mesh called ./web.glb
        const gltfLoader = new GLTFLoader();

        let web;

        web = await new Promise((resolve, reject) =>
        {
            gltfLoader.load('./models/web.glb', (gltf) =>
            {
                const child = gltf.scene.children[ 0 ];
                web = child;
                web.scale.set(.01, .01, 1);
                resolve(web);

            }, undefined, reject);
        });

        return { web };
    }

    const { web } = await buildScene(scene, renderer);

    // person tracked webs
    let webProjectiles = [];
    let wasOctoInkCount = 0;

    let octoInkWebTexture1 = new THREE.TextureLoader().load('./imgs/ink.png');
    let octoInkWebTexture2 = new THREE.TextureLoader().load('./imgs/ink.png');

    let helper = new THREE.Object3D();
    let decalMaterial1 = new THREE.MeshBasicMaterial({
        map: octoInkWebTexture1,
        depthWrite: false,
        depthTest: false,
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        side: THREE.DoubleSide
    });

    let decalMaterial2 = new THREE.MeshBasicMaterial({
        map: octoInkWebTexture2,
        depthWrite: false,
        depthTest: false,
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        side: THREE.DoubleSide
    });

    const shootWeb = (webProjectileData, wristPosition, direction) =>
    {
        webProjectileData.isDone = false;
        webProjectileData.webMesh.visible = true;

        raycaster.set(wristPosition, direction);

        const intersects = raycaster.intersectObjects(randomSceneObjects);


        if (intersects && intersects.length > 0)
        {
            const closestHit = intersects.reduce((prev, current) => (prev.distance < current.distance) ? prev : current);

            webProjectileData.endPosition = closestHit.point;
            webProjectileData.startPosition = wristPosition;

            webProjectileData.webMesh.position.copy(wristPosition);
            webProjectileData.webMesh.lookAt(webProjectileData.endPosition);

            // create decal
            var n = closestHit.face.normal.clone();
            n.transformDirection(closestHit.object.matrixWorld);
            n.add(closestHit.point);

            helper.position.copy(closestHit.point);
            helper.lookAt(n);

            var position = closestHit.point;
            var size = new THREE.Vector3(1, 1, 1);

            var decalGeometry = new DecalGeometry(closestHit.object, position, helper.rotation, size);

            var decalMaterial = Math.random() < 0.5 ? decalMaterial1 : decalMaterial2;
            var decal = new THREE.Mesh(decalGeometry, decalMaterial);

            closestHit.object.add(decal);
            decal.position.copy(position);

            //randomize decal rotation to make it look more natural
            decal.rotation.z = decal.rotation.z + (.1 * Math.random());

            // create timeout to remove decal
            setTimeout(() =>
            {
                closestHit.object.remove(decal);
                scene.remove(decal);
                decal = null;

            }, 3000);

        }
    }

    const createWeb = (scene, person, web) =>
    {
        const newWeb = {
            webMesh: web.clone(),
            isDone: false,
            startPosition: new THREE.Vector3(),
            endPosition: new THREE.Vector3(),
        };

        scene.add(newWeb.webMesh);
        webProjectiles.push(newWeb);

        return newWeb;
    }

    const updateBackgroundElements = () =>
    {

        // rotate random boxes
        randomSceneObjects[ 0 ].rotation.x += 0.001;
        randomSceneObjects[ 0 ].rotation.y += 0.001;
        randomSceneObjects[ 0 ].rotation.z += 0.001;

    }

    const isHandInOctoInkPosition = (person) =>
    {

        const handData = person.handData;

        let wristPosition = new THREE.Vector3();
        let indexPosition = new THREE.Vector3();
        let direction = new THREE.Vector3();
        let isOctoInk = false;

        for (let i = 0; i < 2; i++)
        {

            let element = null;

            if (i == 0) element = handData.leftHandPoints;
            if (i == 1) element = handData.rightHandPoints;

            if ("middle finger tip" in element == false) continue;
            if ("index finger tip" in element == false) continue;
            if ("pinky tip" in element == false) continue;
            if ("wrist" in element == false) continue;

            const middleFingerTip = element[ "middle finger tip" ];
            const ringFingerTip = element[ "ring finger tip" ];
            const pinkyFingerTip = element[ "pinky tip" ];
            const thumbFingerMcp = element[ "thumb tip" ];

            indexPosition = element[ "middle finger tip" ];
            wristPosition = element[ "wrist" ];

            // if middle finger is close to wrist and pinky and index finger are far away from wrist, return true
            const thumbDistance = thumbFingerMcp.distanceTo(wristPosition);
            const indexFingerDistance = indexPosition.distanceTo(wristPosition);
            const pinkyFingerDistance = pinkyFingerTip.distanceTo(wristPosition);
            const ringFingerDistance = ringFingerTip.distanceTo(wristPosition) < indexFingerDistance || ringFingerTip.distanceTo(wristPosition) < pinkyFingerDistance;
            const middleFingerDistance = middleFingerTip.distanceTo(wristPosition) < indexFingerDistance || middleFingerTip.distanceTo(wristPosition) < pinkyFingerDistance;

            isOctoInk = middleFingerDistance && ringFingerDistance;

            if (isOctoInk)
            {
                wasOctoInkCount++;

                // get the web direction
                direction = new THREE.Vector3(); // The direction of the raycaster

                const averageFingerPosition = new THREE.Vector3();
                averageFingerPosition.add(middleFingerTip);
                averageFingerPosition.add(indexPosition);
                averageFingerPosition.add(pinkyFingerTip);
                averageFingerPosition.divideScalar(3);

                direction.subVectors(averageFingerPosition, wristPosition); // We get the direction by substracting the origin from the target
                direction.normalize(); // We normalize the direction to get the unit vector

                direction = indexPosition.clone().sub(wristPosition).normalize();

                return { isOctoInk, wristPosition, direction };

                break;
            } else
            {
                wasOctoInkCount = 0;
            }
        }

        isOctoInk = isOctoInk && wasOctoInkCount == 2;

        return { isOctoInk, wristPosition, direction };
    }

    const handleOctoInk = (person) =>
    {
        if (!person.handData) return;
        if (!(person.handData.geometry)) return;

        const { isOctoInk, wristPosition, direction } = isHandInOctoInkPosition(person);

        if (!isOctoInk) return;

        let newWeb = createWeb(scene, person, web);
        shootWeb(newWeb, wristPosition, direction);
    }


    const updateProjectiles = () =>
    {

        for (let i = 0; i < webProjectiles.length; i++)
        {
            const web = webProjectiles[ i ];

            if (!web) continue;
            if (web.isDone) continue;

            web.webMesh.position.lerp(web.endPosition, 0.1);

            const isAtTarget = web.webMesh.position.distanceTo(web.endPosition) < .1;

            if (isAtTarget)
            {
                web.isDone = true;
                // remove decal

                setTimeout(() =>
                {
                    web.webMesh.children.forEach(child =>
                    {
                        scene.remove(child);
                    });
                    scene.remove(web.webMesh);
                }, 500);

            }

        }

        webProjectiles = webProjectiles.filter(web => !web.isDone);

    }


    // runs every frame
    thirdEyePop.onUpdate = function ()
    {
        // rotates circles
        updateBackgroundElements();

        // get active people
        const activePeople = thirdEyePop.getActivePeople();

        for (const person of activePeople)
        {
            // shoots webs of people
            handleOctoInk(person);
        }

        // moves webs
        updateProjectiles();

    };


}
