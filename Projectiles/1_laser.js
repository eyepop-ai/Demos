import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { RGBELoader } from 'https://unpkg.com/three/examples/jsm/loaders/RGBELoader.js';
import { EXRLoader } from 'https://unpkg.com/three/examples/jsm/loaders/EXRLoader.js';

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
            new THREE.MeshStandardMaterial({ color: getRandomBrightColor(), roughness: .5, metalness: .8 })
        );
        let x = Math.random() * 2 - 1;
        let y = (Math.random() * 2 - 1);
        let z = (Math.random() * 2 - 1) - 1;
        box.position.set(x, y, z);
        let scale = 3;
        box.rotation.set(Math.random(), Math.random(), Math.random());
        box.scale.set(scale * Math.random(), scale * Math.random(), scale * Math.random());
        box.castShadow = true;
        box.receiveShadow = true;

        scene.add(box);
        boxes.push(box);
    }

    const boundsGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const boundingMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, side: THREE.BackSide });
    const boundinMesh = new THREE.Mesh(boundsGeometry, boundingMaterial);
    boundinMesh.name = "bounds";
    scene.add(boundinMesh);
    boxes.push(boundinMesh);

    return boxes;

}

const buildScene = (scene, renderer) =>
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


    let cylinderGeometry = new THREE.CylinderGeometry(.01, .01, 1, 8);
    cylinderGeometry.rotateX(Math.PI / 2);
    const cylinderL = new THREE.Mesh(
        cylinderGeometry,
        new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 5, transparent: true, roughness: 0.5, opacity: 0.1 })
    );

    cylinderGeometry = new THREE.CylinderGeometry(.01, .01, 1, 8);
    cylinderGeometry.rotateX(Math.PI / 2);

    const cylinderR = new THREE.Mesh(
        cylinderGeometry,
        new THREE.MeshStandardMaterial({ color: 0x00aaff, emissive: 0x00aaff, emissiveIntensity: 5, transparent: true, roughness: 0.5, opacity: 0.1 })
    );

    const pointLightL = new THREE.PointLight(0x00f0ff, 10, 1);

    pointLightL.position.set(-999, 0, 0);
    pointLightL.castShadow = true;

    const pointLightR = new THREE.PointLight(0x00f0ff, 10, 1);

    pointLightR.position.set(-999, 0, 0);
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

export const updateScene = (thirdEyePop) =>
{
    const raycaster = new THREE.Raycaster();
    const scene = thirdEyePop.getScene();
    const renderer = thirdEyePop.getRenderer();

    const randomBoxes = createRandomBoxes(scene, 100);

    const { cylinderL, cylinderR, pointLightL, pointLightR, particleL, particleR } = buildScene(scene, renderer);

    const lasers = [];

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

                // remove all intersected object from scene and add an explosion animated sprite of the laser beam on impact that fades out
                for (let i = 0; i < intersects.length; i++)
                {
                    const intersect = intersects[ i ];
                    if (intersect.object.name === "bounds") continue;
                    scene.remove(intersect.object);
                }


            }

            laserData.cylinderL.position.lerp(laserData.leftPositionTarget, 0.5);
            laserData.cylinderR.position.lerp(laserData.rightPositionTarget, 0.5);

        }
    };
}
