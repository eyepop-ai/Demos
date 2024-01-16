import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { RGBELoader } from 'https://unpkg.com/three/examples/jsm/loaders/RGBELoader.js';

// import "https://unpkg.com/three-laser-pointer@1.2.3/dist/three-laser-pointer.min.js";


const getRandomBrightColor = () =>
{
    const color = new THREE.Color();
    color.setHSL(Math.random(), 1.0, 0.5);
    return color;
}

const createRandomBoxes = (scene, count) =>
{
    const boxes = [];

    for (let i = 0; i < count; i++)
    {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.1),
            new THREE.MeshStandardMaterial({ color: getRandomBrightColor(), roughness: .01, transparent: true, opacity: .5 + (Math.random() * .5) })
        );
        let x = Math.random() * 2 - 1;
        let y = Math.random() * 2 - 1;
        let z = Math.random() * 2 - 1;
        box.position.set(x, y, z);
        box.rotation.set(Math.random(), Math.random(), Math.random());
        box.scale.set(5 * Math.random(), 5 * Math.random(), 5 * Math.random());
        scene.add(box);
        boxes.push(box);
    }


    const boundingBoxGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const boundingBoxMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, side: THREE.BackSide });
    const boundingBoxMesh = new THREE.Mesh(boundingBoxGeometry, boundingBoxMaterial);
    scene.add(boundingBoxMesh);
    boxes.push(boundingBoxMesh);

    return boxes;

}

const buildScene = (scene, renderer) =>
{

    // add an hdr environment map to the scene
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new RGBELoader().load(
        './imgs/bg.hdr',
        (envMap) =>
        {
            scene.environment = envMap;

            const boxGeometry = new THREE.BoxGeometry(3, 3, 3); // adjust size to your needs
            boxGeometry.scale(-1, 1, 1); // invert the geometry on the x-axis so that all of the faces point inward
            const sphereMaterial = new THREE.MeshBasicMaterial({ map: envMap });
            const bgCube = new THREE.Mesh(boxGeometry, sphereMaterial);
            scene.add(bgCube);

            pmremGenerator.dispose()
        });


    let cylinderGeometry = new THREE.CylinderGeometry(.01, .01, 1, 8);
    cylinderGeometry.rotateX(Math.PI / 2);
    const cylinderL = new THREE.Mesh(
        cylinderGeometry,
        new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 4, transparent: true, roughness: 0, opacity: 0.2 })
    );

    scene.add(cylinderL);

    cylinderGeometry = new THREE.CylinderGeometry(.01, .01, 1, 8);
    cylinderGeometry.rotateX(Math.PI / 2);

    const cylinderR = new THREE.Mesh(
        cylinderGeometry,
        new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 4, transparent: true, roughness: 0, opacity: 0.2 })
    );

    scene.add(cylinderR);

    const pointLightL = new THREE.PointLight(0x00f0ff, 10, 1);

    pointLightL.position.set(0, 0, 0);
    pointLightL.castShadow = true;
    scene.add(pointLightL);

    const pointLightR = new THREE.PointLight(0x00f0ff, 10, 1);

    pointLightR.position.set(0, 0, 0);
    pointLightR.castShadow = true;
    scene.add(pointLightR);

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
    scene.add(particleL);

    const particleR = new THREE.Mesh(
        new THREE.PlaneGeometry(.5, .5),
        particleMaterial
    );
    scene.add(particleR);

    return { cylinderL, cylinderR, pointLightL, pointLightR, particleL, particleR };
}

export const updateScene = (thirdEyePop) =>
{
    const raycaster = new THREE.Raycaster();
    const scene = thirdEyePop.getScene();
    const renderer = thirdEyePop.getRenderer();

    const randomBoxes = createRandomBoxes(scene, 30);

    let leftPositionTarget = new THREE.Vector3();

    let rightPositionTarget = new THREE.Vector3();

    const { cylinderL, cylinderR, pointLightL, pointLightR, particleL, particleR } = buildScene(scene, renderer);

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

        const person = activePeople[ 0 ];

        if (!(person.handData.geometry)) return;

        const leftIndexTip = person.handData.leftHandPoints[ "index finger tip" ];
        const leftIndexBase = person.handData.leftHandPoints[ "index finger mcp" ];

        const rightIndexTip = person.handData.rightHandPoints[ "index finger tip" ];
        const rightIndexBase = person.handData.rightHandPoints[ "index finger mcp" ];

        if (leftIndexTip && leftIndexBase)
        {

            const from = leftIndexBase;
            let to = new THREE.Vector3(); // The direction of the raycaster
            to.subVectors(leftIndexTip, leftIndexBase); // We get the direction by substracting the origin from the target
            to.normalize(); // We normalize the direction to get the unit vector

            raycaster.set(from, to);

            const intersects = raycaster.intersectObjects(randomBoxes);

            if (intersects && intersects.length > 0)
            {
                const firstIntersect = intersects[ 0 ];
                const length = firstIntersect.distance;
                cylinderL.visible = true;

                pointLightL.position.lerp(firstIntersect.point, .5);
                particleL.position.lerp(firstIntersect.point, .5);

                leftPositionTarget.copy(from);
                cylinderL.lookAt(firstIntersect.point);

                cylinderL.scale.z = length;
                cylinderL.translateZ(length / 2);

            } else
            {
                cylinderL.visible = false;
            }
        }

        cylinderL.position.lerp(leftPositionTarget, 0.5);


        if (rightIndexTip && rightIndexBase)
        {
            const from = rightIndexBase;
            let to = new THREE.Vector3(); // The direction of the raycaster
            to.subVectors(rightIndexTip, rightIndexBase); // We get the direction by substracting the origin from the target
            to.normalize(); // We normalize the direction to get the unit vector

            raycaster.set(from, to);

            const intersects = raycaster.intersectObjects(randomBoxes);

            if (intersects && intersects.length > 0)
            {
                const firstIntersect = intersects[ 0 ];
                const length = firstIntersect.distance;
                cylinderR.visible = true;

                pointLightR.position.lerp(firstIntersect.point, .5);
                particleR.position.lerp(firstIntersect.point, .5);

                rightPositionTarget.copy(from);
                cylinderR.lookAt(firstIntersect.point);


                cylinderR.scale.z = length;
                cylinderR.translateZ(length / 2);

            } else
            {
                cylinderR.visible = false;
            }
        }

        cylinderR.position.lerp(rightPositionTarget, 0.5);

    };
}
