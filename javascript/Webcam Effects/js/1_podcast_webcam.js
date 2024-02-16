import * as THREE from 'https://unpkg.com/three/build/three.module.js';


let objectPool = [];
let webcamTexture = undefined;

let scene = null;
let material = null;

const createPlane = () =>
{
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.0, 0.0),
        material
    );

    plane.geometry.computeBoundingBox();
    plane.geometry.computeBoundingSphere();
    plane.visible = false;
    scene.add(plane);
    return plane;
}

const getPlaneFromPool = () =>
{

    for (const object of objectPool)
    {
        if (!object.mesh.visible && object.mesh.geometry.parameters.width === 0.0 && object.mesh.geometry.parameters.height === 0.0)
        {
            return object;
        }
    }

    const newPlane = { id: null, mesh: createPlane(scene, material), target: new THREE.Vector3(), inactiveFrames: 0 };

    objectPool.push(newPlane);

    return newPlane;
}

export const updateScene = async (thirdEyePop) =>
{
    const raycaster = new THREE.Raycaster();
    scene = thirdEyePop.getScene();
    const renderer = thirdEyePop.getRenderer();
    const renderManager = thirdEyePop.getRenderManager();
    const controls = thirdEyePop.getControls();

    const buildScene = async (scene, renderer) =>
    {

        webcamTexture = renderManager.videoTexture;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        scene.add(ambientLight);
        scene.background = new THREE.Color(0x000000);

        // build a pool of plane meshes to be used to display all the people in the webcam feed
        objectPool = [];
        const planeCount = 25;
        material = new THREE.MeshBasicMaterial({ map: webcamTexture, side: THREE.DoubleSide });

        for (let i = 0; i < planeCount; i++)
        {
            getPlaneFromPool();
        }

    }

    await buildScene(scene, renderer);

    const updatePersonPlane = (person) =>
    {
        const plane = person.frame.mesh;

        // update the uv coordinates of the plane to only show the part of the webcam feed that the person is in
        const bounds = person.bounds;

        const width = Math.abs(bounds.max.x - bounds.min.x);
        const height = Math.abs(bounds.max.y - bounds.min.y);

        plane.scale.set(1, 1, 1);

        if (Math.abs(width - plane.geometry.parameters.width) > 0.05 && Math.abs(height - plane.geometry.parameters.height) > 0.05)
        {
            // create a new plane geometry with the calculated width and height
            plane.geometry.dispose();
            plane.geometry = new THREE.PlaneGeometry(width, height);


            // convert bounds coordinates to uv coordinates
            const uvMin = new THREE.Vector2(1 - (bounds.min.x + 1) / 2, (bounds.min.y + 1) / 2);
            const uvMax = new THREE.Vector2(1 - (bounds.max.x + 1) / 2, (bounds.max.y + 1) / 2);

            // update the uv coordinates
            plane.geometry.attributes.uv.setXY(0, uvMin.x, uvMin.y);
            plane.geometry.attributes.uv.setXY(1, uvMax.x, uvMin.y);
            plane.geometry.attributes.uv.setXY(2, uvMin.x, uvMax.y);
            plane.geometry.attributes.uv.setXY(3, uvMax.x, uvMax.y);
            plane.geometry.attributes.uv.needsUpdate = true;


            // set the boundingGeometry to the new bounds
            plane.geometry.needsUpdate = true;
            plane.geometry.computeBoundingBox();
            plane.geometry.computeBoundingSphere();

        }
    }


    const showActivePeople = () =>
    {
        for (const object of objectPool)
        {
            object.mesh.visible = false;
        }

        const activeIds = [];

        for (const person of thirdEyePop.getActivePeople())
        {

            // get a plane from the pool if the person doesn't have one
            if (!person.frame)
            {
                person.frame = getPlaneFromPool(scene);
                person.frame.id = person.id;
            }

            // if ther person is less than 25% of the screen, ignore them
            if (person.boundsWidth < 0.25 || person.boundsHeight < 0.25)
            {
                continue;
            }

            person.inactiveFrames = 0;
            activeIds.push(person.id);
            person.frame.mesh.visible = true;

            // update the plane mesh to scale of the person
            updatePersonPlane(person);
        }

        // hide any planes that are no longer active
        for (const object of objectPool)
        {
            if (object.mesh.visible && !activeIds.includes(object.id))
            {
                object.inactiveFrames++;
                if (object.inactiveFrames > 25)
                {
                    object.mesh.visible = false;
                    object.mesh.position.set(-100, -100, -100);
                }
            }
        }

    }

    // Position the planes in a dynamic grid layout
    function positionPlanes(planesObjects, padding)
    {
        // get object meshes which are visible
        let planes = [];

        for (const object of planesObjects)
        {
            if (object.mesh.visible)
            {
                planes.push(object);
            }
        }

        // Calculate the number of rows and columns for the grid
        var gridRows = Math.floor(Math.sqrt(planes.length));
        var gridColumns = Math.ceil(planes.length / gridRows);

        // Calculate the width and height of each cell
        var cellWidth = (2 - padding * (gridColumns - 1)) / gridColumns;
        var cellHeight = (2 - padding * (gridRows - 1)) / gridRows;

        // Position each plane in its cell
        for (var i = planes.length - 1; i >= 0; i--)
        {
            var plane = planes[ i ].mesh;

            // Calculate the cell's x and y position
            const cellX = (i % gridColumns) * (cellWidth + padding) - 1 + cellWidth / 2;
            const cellY = Math.floor(i / gridColumns) * (cellHeight + padding) - 1 + cellHeight / 2;

            // Calculate the scale factor to fit the plane in the cell
            const scaleFactor = Math.min(cellWidth / plane.geometry.parameters.width, cellHeight / plane.geometry.parameters.height);

            // Position and scale the plane in the cell
            plane.scale.setScalar(scaleFactor);

            planes[ i ].target.set(cellX, -cellY, 0);

            plane.position.lerp(planes[ i ].target, .1);
        }
    }

    // runs every frame
    thirdEyePop.onUpdate = function ()
    {

        showActivePeople();

        positionPlanes(objectPool, 0.01);

    };


}
