import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { RGBELoader } from 'https://unpkg.com/three/examples/jsm/loaders/RGBELoader.js';
import { EXRLoader } from 'https://unpkg.com/three/examples/jsm/loaders/EXRLoader.js';

const getRandomBrightColor = () =>
{
    const color = new THREE.Color();
    color.setHSL(Math.random(), 1.0, 0.5);
    return color;
}

const createRandomNormalMapTexture = (width = 64, height = 64) =>
{
    const size = width * height;
    const data = new Uint8Array(4 * size);

    for (let i = 0; i < size; i++)
    {
        const stride = i * 4;
        const x = (Math.random() * 2 - 1) * 127.5 + 127.5;
        const y = (Math.random() * 2 - 1) * 127.5 + 127.5;
        const z = 255.0;
        const a = 255.0;

        data[ stride ] = x;
        data[ stride + 1 ] = y;
        data[ stride + 2 ] = z;
        data[ stride + 3 ] = a;
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
}

const createRandomGeometry = (size = 0.1) =>
{
    const random = Math.random();
    if (random < 0.33)
    {
        return new THREE.BoxGeometry(size, size, 0.1);
    } else if (random < 0.66)
    {
        return new THREE.SphereGeometry(size, 32, 32);
    } else
    {
        return new THREE.CylinderGeometry(size, size, size, 32);
    }
}

const createRandomBoxes = (scene, count) =>
{

    const boxes = [];

    for (let i = 0; i < count; i++)
    {

        const box = new THREE.Mesh(
            createRandomGeometry(Math.random() * 0.1 + 0.1),
            new THREE.MeshStandardMaterial({
                color: getRandomBrightColor(),
                normalMap: createRandomNormalMapTexture(),
                roughness: .1,
                metalness: .5
            })
        );
        let x = Math.random() * 2 - 1;
        let y = (Math.random() * 2 - 1);
        let z = (Math.random() * 2 - 1);
        box.position.set(x, y, z);
        let scale = 1.5;

        box.rotation.set(
            Math.random(),
            Math.random(),
            Math.random()
        );
        box.scale.set(
            scale * Math.random(),
            scale * Math.random(),
            scale * Math.random()
        );

        box.castShadow = true;
        box.receiveShadow = true;

        scene.add(box);
        boxes.push(box);
    }

    const boundsGeometry = new THREE.SphereGeometry(2, 16, 16);
    const boundingMaterial = new THREE.MeshLambertMaterial({
        color: 0x000000,
        side: THREE.BackSide
    });
    const boundinMesh = new THREE.Mesh(boundsGeometry, boundingMaterial);
    boundinMesh.name = "bounds";
    boundinMesh.receiveShadow = false;
    boundinMesh.castShadow = false;
    scene.add(boundinMesh);
    boxes.push(boundinMesh);

    const bgPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })
    );

    bgPlane.position.z = 10;
    bgPlane.rotateZ(Math.PI / 2);
    scene.add(bgPlane);

    return boxes;
}

const buildScene = (scene, renderer) =>
{
    const ambientLight = new THREE.AmbientLight(0xffffff, .1);
    scene.add(ambientLight);

    let cylinderGeometry = new THREE.CylinderGeometry(.01, .01, 1, 8);
    cylinderGeometry.rotateX(Math.PI / 2);

    const cylinderL = new THREE.Mesh(
        cylinderGeometry,
        new THREE.MeshPhysicalMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 1 })
    );

    cylinderGeometry = new THREE.CylinderGeometry(.01, .01, 1, 8);
    cylinderGeometry.rotateX(Math.PI / 2);

    const cylinderR = new THREE.Mesh(
        cylinderGeometry,
        new THREE.MeshPhysicalMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 1 })
    );

    const pointLightL = new THREE.PointLight(0x00f0ff, 1, 2);
    pointLightL.castShadow = true;

    const pointLightR = new THREE.PointLight(0x00f0ff, 1, 2);
    pointLightR.castShadow = true;

    // load the blue_particle.jpg texture and make the black background transparent
    const textureLoader = new THREE.TextureLoader();
    const particleTexture = textureLoader.load('./imgs/blue_particle_map.jpg');
    const particleTextureAlpha = textureLoader.load('./imgs/blue_particle_alpha.jpg');

    var particleMaterial = new THREE.MeshBasicMaterial({
        map: particleTexture,
        alphaMap: particleTextureAlpha,
        transparent: true,
        side: THREE.DoubleSide,
    })

    const particleL = new THREE.Mesh(
        new THREE.PlaneGeometry(.5, .5),
        particleMaterial
    );

    const particleR = new THREE.Mesh(
        new THREE.PlaneGeometry(.5, .5),
        particleMaterial
    );

    return { cylinderL, cylinderR, pointLightL, pointLightR, particleL, particleR };
}

const hideInactiveElements = (lasers, activePeople) =>
{
    for (let i = 0; i < lasers.length; i++)
    {
        const laserData = lasers[ i ];
        const key = Object.keys(lasers)[ i ];

        if (!laserData) continue;

        if (!activePeople.find(p => p.traceId === key))
        {
            laserData.cylinderL.visible = false;
            laserData.cylinderR.visible = false;
            laserData.particleL.visible = false;
            laserData.particleR.visible = false;
        } else
        {
            laserData.cylinderL.visible = true;
            laserData.cylinderR.visible = true;
            laserData.particleL.visible = true;
            laserData.particleR.visible = true;
        }
    }
}

const setupDebugging = (thirdEyePop, scene, renderer) =>
{

    // load json file ./test_data/pose_capture_data.json and every 100ms push a frame to thirdEyePop
    let frames = [];
    fetch("./test_data/spider_capture.json")
        .then(response => response.json())
        .then(data => frames = data)
        .then(() =>
        {
            let i = 0;
            setInterval(() =>
            {
                thirdEyePop.pushPredictionData(frames[ i++ % frames.length ]);
            }, 10);

        });

    if (loading)
    {
        loading.remove();
    }
}

export const updateScene = (thirdEyePop, debug) =>
{
    const raycaster = new THREE.Raycaster();
    const scene = thirdEyePop.getScene();
    const renderer = thirdEyePop.getRenderer();

    if (debug)
    {
        setupDebugging(thirdEyePop, scene, renderer);
    }

    const randomBoxes = createRandomBoxes(scene, 111);

    const { cylinderL, cylinderR, pointLightL, pointLightR, particleL, particleR } = buildScene(scene, renderer);

    const lasers = [];

    console.log(scene)

    thirdEyePop.onUpdate = function ()
    {
        // rotate random boxes
        randomBoxes.forEach(box =>
        {
            box.rotation.x += Math.random() * 0.01;
            box.rotation.y += Math.random() * 0.01;
        });

        const activePeople = thirdEyePop.getActivePeople();

        if (!activePeople || activePeople.length <= 0)
        {
            return;
        }

        hideInactiveElements(lasers, activePeople);

        for (const person of activePeople)
        {
            if (!person.handData) return;
            if (!(person.handData.geometry)) return;
            if (!person.traceId) return;

            let laserData = lasers[ person.traceId ];
            if (!laserData)
            {

                console.log("creating new laser data for " + person.traceId);

                laserData = {
                    cylinderL: cylinderL.clone(),
                    cylinderR: cylinderR.clone(),
                    pointLightL: pointLightL.clone(),
                    pointLightR: pointLightR.clone(),
                    particleL: particleL.clone(),
                    particleR: particleR.clone(),
                    leftPositionTarget: new THREE.Vector3(),
                    rightPositionTarget: new THREE.Vector3(),

                };

                scene.add(laserData.cylinderL);
                scene.add(laserData.cylinderR);
                scene.add(laserData.pointLightL);
                scene.add(laserData.pointLightR);
                scene.add(laserData.particleL);
                scene.add(laserData.particleR);

                // add pointlight helpers
                const sphereSize = 0.1;
                const pointLightHelperL = new THREE.PointLightHelper(laserData.pointLightL, sphereSize);
                const pointLightHelperR = new THREE.PointLightHelper(laserData.pointLightR, sphereSize);

                scene.add(pointLightHelperL);
                scene.add(pointLightHelperR);
                lasers[ person.traceId ] = laserData;
            }


            for (let i = 0; i < 2; i++)
            {

                let element = null;

                if (i == 0) element = person.handData.leftHandPoints;
                if (i == 1) element = person.handData.rightHandPoints;

                const tip = element[ "index finger tip" ];
                const base = element[ "index finger mcp" ];

                if (!tip || !base)
                {
                    laserData.cylinderL.visible = false;
                    laserData.cylinderR.visible = false;
                    continue;
                }

                const from = base;
                let to = new THREE.Vector3(); // The direction of the raycaster
                to.subVectors(tip, base); // We get the direction by substracting the origin from the target
                to.normalize(); // We normalize the direction to get the unit vector

                raycaster.set(from, to);

                const intersects = raycaster.intersectObjects(randomBoxes);

                if (!intersects || intersects.length <= 0) continue;

                const closestIntersect = intersects.sort((a, b) => a.distance - b.distance)[ 0 ];

                const length = closestIntersect.distance;

                if (i == 0)
                {
                    laserData.cylinderL.visible = true;
                    laserData.pointLightL.position.copy(closestIntersect.point);
                    laserData.particleL.position.copy(closestIntersect.point);
                    laserData.leftPositionTarget.copy(from);
                    laserData.cylinderL.lookAt(closestIntersect.point);
                    laserData.cylinderL.scale.z = length;
                    laserData.cylinderL.translateZ(length / 2);

                } else
                {
                    laserData.cylinderR.visible = true;
                    laserData.pointLightR.position.copy(closestIntersect.point);
                    laserData.particleR.position.copy(closestIntersect.point);
                    laserData.rightPositionTarget.copy(from);
                    laserData.cylinderR.lookAt(closestIntersect.point);
                    laserData.cylinderR.scale.z = length;
                    laserData.cylinderR.translateZ(length / 2);

                }

            }

            laserData.cylinderL.position.lerp(laserData.leftPositionTarget, 0.5);
            laserData.cylinderR.position.lerp(laserData.rightPositionTarget, 0.5);

        }
    };
}
