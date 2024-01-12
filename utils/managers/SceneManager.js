/**
 * @class SceneManager
 * @description A class that builds and manages adding meshes and moving them around in a scene.
 */

import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { TextGeometry } from 'https://unpkg.com/three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'https://unpkg.com/three/examples/jsm/loaders/FontLoader.js';
import PeopleManager from './PeopleManager.js';
import { PeopleState } from '../data/Constants.js';


export default class SceneManager
{

    constructor(
        scene,
        camera,
        dimensions,
        drawParams = {
            showPoint: false,
            showPath: false,
            showBounds: false,
            showPose: false,
            showTraceId: false
        }
    )
    {
        this.scene = scene;
        this.camera = camera;
        this.dimensions = dimensions;
        this.peopleManager = new PeopleManager(dimensions);
        this.activePeople = [];

        this.showPoint = drawParams.showPoint;
        this.showPath = drawParams.showPath;
        this.showBounds = drawParams.showBounds;
        this.showPose = drawParams.showPose;
        this.showTraceId = drawParams.showTraceId;

        this.font = null;
        const scope = this;
        const loader = new FontLoader();
        loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_regular.typeface.json', function (font)
        {
            scope.font = font;
        });

        this.textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        // #FFFFFF - white
        // #30A7D7 - light blue (inset corner) (0.188235, 0.654902, 0.843137)
        // #2674C4 - dark blue (background) (0.14902, 0.45490, 0.76863)
        // #1D47B3 - darker blue (outset corner) (0.11373, 0.27843, 0.70196)
        // #000000 - black
        this.boxMaterial = new THREE.MeshBasicMaterial({ color: 0x30A7D7, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
        this.boxLineMaterial = new THREE.LineBasicMaterial({ color: 0x1d47b3 });

        this.boxMaterial.blending = THREE.CustomBlending;
        this.boxMaterial.blendEquation = THREE.AddEquation; //default 
        this.boxMaterial.blendSrc = THREE.OneFactor;  //default 

        this.pointMaterial = new THREE.MeshBasicMaterial({ color: 0x1d47b3 });
        this.pathMaterial = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 100, });
        this.poseMaterial = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 100, });

        this.boxQueue = [];

        this.maxPersons = 100;
        this.personBoxGroup = new Array(this.maxPersons).fill(null);
        this.personPathGeometry = new Array(this.maxPersons).fill(null);
    }

    getAllPathPoints()
    {
        return this.peopleManager.getAllPathPoints();
    }

    update(frameData)
    {
        const previousActivePeople = [ ...this.activePeople ];
        this.activePeople = [];

        for (let i = 0; i < frameData.objects.length && this.activePeople.length < this.maxPersons; i++)
        {
            let objects = frameData.objects[ i ];
            if (objects.classLabel === "person")
            {
                const person = this.peopleManager.addPerson(objects);

                if (person.state === PeopleState.LOST) continue;

                person.index = this.activePeople.length;
                this.activePeople.push(person);

                this.showPoint && this.drawPoint(person);
                this.showTraceId && this.drawTraceIdText(person);
                this.showPath && this.drawPath(person);
                this.showBounds && this.drawBoundingBox(person);
                this.showPose && this.drawPose(person);
            }
        }

        this.hideInactivePeople(previousActivePeople);

    }

    hideInactivePeople(previousActivePeople)
    {
        // hide people that are no longer in the scene
        for (let i = 0; i < previousActivePeople.length; i++)
        {
            const person = previousActivePeople[ i ];
            const personOnScreen = this.activePeople.includes(person);

            this.showPoint && person.centerSphere && (person.centerSphere.visible = personOnScreen);
            this.showPath && person.pathLine && (person.pathLine.visible = personOnScreen);
            this.showTraceId && person.traceIdText && (person.traceIdText.visible = personOnScreen);
            this.showBounds && person.boundsBoxParent && (person.boundsBoxParent.visible = personOnScreen);
            this.showPose && person.poseData.mesh && (person.poseData.mesh.visible = personOnScreen);
        }
    }

    toggleVisibility(name)
    {
        // loop over active people and toggle visibility
        this.activePeople.forEach((person) =>
        {
            switch (name)
            {
                case "point":
                    this.showPoint = !this.showPoint;
                    person.centerSphere && (person.centerSphere.visible = this.showPoint);
                    break;

                case "path":
                    this.showPath = !this.showPath;
                    person.pathLine && (person.pathLine.visible = this.showPath);
                    break;

                case "bounds":
                    this.showBounds = !this.showBounds;
                    person.boundsBoxParent && (person.boundsBoxParent.visible = this.showBounds);
                    break;

                case "traceId":
                    this.showTraceId = !this.showTraceId;
                    person.traceIdText && (person.traceIdText.visible = this.showTraceId);
                    break;

                case "pose":
                    this.showPose = !this.showPose;
                    person.poseData.mesh && (person.poseData.mesh.visible = this.showPose);
                    break;

            }
        });
    }

    drawPoint(person)
    {
        if (!person) return;

        let sphere = person.centerSphere;

        if (!sphere)
        {
            let geometry = new THREE.SphereGeometry(0.01, 8, 8);
            sphere = new THREE.Mesh(geometry, this.pointMaterial);

            this.scene.add(sphere);
            person.centerSphere = sphere;

            sphere = person.centerSphere;
        }
        sphere.name = "point";

        let point = person.position;
        sphere.position.x = point.x;
        sphere.position.y = point.y;
        sphere.position.z = 0;

    }

    drawTraceIdText(person)
    {
        if (!this.font) return;
        if (!person) return;
        if (!person.traceId) return;

        let text = person.traceIdText;

        if (!text)
        {
            let geometry = new TextGeometry("" + person.traceId, {
                font: this.font,
                size: .025,
                height: 0,
                curveSegments: 12,
                bevelEnabled: false,
            });
            text = new THREE.Mesh(geometry, this.textMaterial);
            text.name = "traceId";
            this.scene.add(text);
            person.traceIdText = text;
        }

        text.name = "traceIdText";
        let point = person.position;
        text.scale.x = -1;
        text.position.x = point.x + person.boundsWidth / 2;
        text.position.y = person.bounds.min.y;
        text.position.z = 0;
    }

    drawPath(person)
    {
        if (person.path.length < 4) return;

        let pathLine = person.pathLine;
        let pathLineGeometry = person.pathLineGeometry;

        if (!pathLine)
        {
            pathLineGeometry = new THREE.BufferGeometry().setFromPoints(person.path);
            pathLine = new THREE.Line(pathLineGeometry, this.pathMaterial);
            pathLine.name = "path";
            this.scene.add(pathLine)

            person.pathLine = pathLine;
            person.pathLineGeometry = pathLineGeometry;
        }
        else
        {
            pathLineGeometry.setFromPoints(person.path);
            // set the vertex color of the line from hot red to cool blue based on the length of the path
            let colors = [];
            let color = new THREE.Color();
            let pathLength = person.path.length;
            for (let i = 0; i < pathLength; i++)
            {
                color.setHSL(0.7 * (pathLength - i) / pathLength, 1, 0.5);
                colors.push(color.r, color.g, color.b);
            }
            pathLineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        }

    }


    // TODO: Draw a sexier bounding box with a sprite or shader
    drawBoundingBox(person)
    {
        if (!this.peopleManager.edgesLoaded) return;

        const bounds = person.bounds;
        if (!bounds) return;

        let boundsBoxParent = person.boundsBoxParent;

        let width = person.boundsWidth;
        let height = person.boundsHeight;
        let boundsGeometry = person.boundsGeometry;
        let edgeObjects = person.edgeObjects;
        let topLeftEdgeMesh = null;
        let topRightEdgeMesh = null;
        let bottomLeftEdgeMesh = null;
        let bottomRightEdgeMesh = null;


        if (!boundsBoxParent)
        {
            boundsGeometry = new THREE.PlaneGeometry(width, height);
            const boundsPlaneMesh = new THREE.Mesh(boundsGeometry, this.boxMaterial);
            boundsPlaneMesh.name = "bounds";
            this.personBoxGroup[ person.index ] = new THREE.Group();
            this.personBoxGroup[ person.index ].name = "bounds";

            boundsBoxParent = this.personBoxGroup[ person.index ];
            boundsBoxParent.add(boundsPlaneMesh);

            // next we add the four edgeObject corners to the corners of the boundsPlaneMesh so that we can use them to draw the inset and outset corners
            edgeObjects = this.peopleManager.edgeObjects;

            // create a buffer geometry for the top left vertex, at .01 units in size
            // and add it to a LineSegments object to be added to the parent
            // const topLeftGeometry = new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(person.bounds.min.x, person.bounds.min.y, 0), new THREE.Vector3(person.bounds.min.x + width / 4, person.bounds.min.y, 0) ]);
            // topLeftEdgeMesh = new THREE.LineSegments(topLeftGeometry, this.boxLineMaterial);

            topLeftEdgeMesh = edgeObjects.topLeft.clone();
            topRightEdgeMesh = edgeObjects.topRight.clone();
            bottomLeftEdgeMesh = edgeObjects.bottomLeft.clone();
            bottomRightEdgeMesh = edgeObjects.bottomRight.clone();

            // add the edges of the bounds to the parent
            boundsBoxParent.add(topLeftEdgeMesh);
            boundsBoxParent.add(topRightEdgeMesh);
            boundsBoxParent.add(bottomLeftEdgeMesh);
            boundsBoxParent.add(bottomRightEdgeMesh);

            this.scene.add(boundsBoxParent);
            person.boundsGeometry = boundsGeometry;
            person.boundsBoxParent = boundsBoxParent;
        } else
        {
            topLeftEdgeMesh = boundsBoxParent.children[ 1 ];
            topRightEdgeMesh = boundsBoxParent.children[ 2 ];
            bottomLeftEdgeMesh = boundsBoxParent.children[ 3 ];
            bottomRightEdgeMesh = boundsBoxParent.children[ 4 ];
        }

        let verticesOfBox = [
            bounds.min.x, bounds.min.y, 0,
            bounds.max.x, bounds.min.y, 0,
            bounds.min.x, bounds.max.y, 0,
            bounds.max.x, bounds.max.y, 0,
        ];

        boundsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(verticesOfBox, 3));
        // set the boundingGeometry to the new bounds
        boundsGeometry.needsUpdate = true;


        let scaleFactor = width / 2;

        // move the edges to the corners of the bounds
        topLeftEdgeMesh.position.x = bounds.min.x;
        topLeftEdgeMesh.position.y = bounds.min.y;
        topLeftEdgeMesh.scale.x = scaleFactor;
        topLeftEdgeMesh.scale.y = scaleFactor;
        topLeftEdgeMesh.scale.z = scaleFactor;

        topRightEdgeMesh.position.x = bounds.max.x;
        topRightEdgeMesh.position.y = bounds.min.y;
        topRightEdgeMesh.scale.x = scaleFactor;
        topRightEdgeMesh.scale.y = scaleFactor;
        topRightEdgeMesh.scale.z = scaleFactor;

        bottomLeftEdgeMesh.position.x = bounds.min.x;
        bottomLeftEdgeMesh.position.y = bounds.max.y;
        bottomLeftEdgeMesh.scale.x = scaleFactor;
        bottomLeftEdgeMesh.scale.y = scaleFactor;
        bottomLeftEdgeMesh.scale.z = scaleFactor;

        bottomRightEdgeMesh.position.x = bounds.max.x;
        bottomRightEdgeMesh.position.y = bounds.max.y;
        bottomRightEdgeMesh.scale.x = scaleFactor;
        bottomRightEdgeMesh.scale.y = scaleFactor;
        bottomRightEdgeMesh.scale.z = scaleFactor;

    }


    drawPose(person)
    {
        const pose = person.poseData; // { points: {}, connections: [], mesh: [] }
        if (!pose.geometry) return;

        let poseMesh = pose.mesh;

        if (!poseMesh)
        {
            pose.mesh = new THREE.LineSegments(pose.geometry, this.poseMaterial);

            poseMesh = pose.mesh;
            this.scene.add(pose.mesh);
        } else
        {
            // Get the new positions
            let newPositions = pose.geometry.attributes.position.array;

            // If the new geometry has fewer vertices, fill the remaining space with duplicates of the last vertex
            if (newPositions.length < poseMesh.geometry.attributes.position.count * 3)
            {
                let lastVertex = newPositions.slice(-3);
                while (newPositions.length < poseMesh.geometry.attributes.position.count * 3)
                {
                    newPositions = newPositions.concat(lastVertex);
                }
            }

            // If the new geometry has more vertices, slice it to the correct length
            if (newPositions.length > poseMesh.geometry.attributes.position.count * 3)
            {
                newPositions = newPositions.slice(0, poseMesh.geometry.attributes.position.count * 3);
            }

            // Update the positions of the vertices
            poseMesh.geometry.attributes.position.array = new Float32Array(newPositions);
            poseMesh.geometry.attributes.position.needsUpdate = true;

            // Update the colors
            const colors = [];
            pose.geometry.attributes.position.array.forEach((position, index) =>
            {
                const color = new THREE.Color();
                // get the x vertex position from the geometry array
                if (index % 3 !== 0) return;

                const xPosition = pose.geometry.attributes.position.array[ index ];

                const onLeft = xPosition < person.position.x;
                const red = onLeft ? 1 : 0;
                const green = 1 - red;

                color.setRGB(red, green, 0);

                colors.push(color.r, color.g, color.b);
            });

            poseMesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            // set posemesh needsUpdate to true
            poseMesh.geometry.attributes.color.needsUpdate = true;
        }


    }


}

