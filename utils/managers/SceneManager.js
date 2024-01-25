/**
 * @class SceneManager
 * @description A class that builds and manages adding meshes and moving them around in a scene.
 */

import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { TextGeometry } from 'https://unpkg.com/three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'https://unpkg.com/three/examples/jsm/loaders/FontLoader.js';
import PeopleManager from './PeopleManager.js';
import { PeopleState } from '../data/Constants.js';
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://unpkg.com/three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'https://unpkg.com/three/examples/jsm/loaders/RGBELoader.js';
import { EXRLoader } from 'https://unpkg.com/three/examples/jsm/loaders/EXRLoader.js';



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
            showFace: false,
            showTraceId: false,
            showHands: true,
        }
    )
    {
        this.scene = scene;
        this.camera = camera;
        this.dimensions = dimensions;
        this.peopleManager = new PeopleManager(dimensions, drawParams.showPath);
        this.activePeople = [];

        this.showPoint = drawParams.showPoint;
        this.showPath = drawParams.showPath;
        this.showBounds = drawParams.showBounds;
        this.showPose = drawParams.showPose;
        this.showFace = drawParams.showFace;
        this.showHands = drawParams.showHands;
        this.showTraceId = drawParams.showTraceId;

        this.font = null;
        const scope = this;
        const loader = new FontLoader();
        loader.load('https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_regular.typeface.json', function (font)
        {
            scope.font = font;
        });

        this.textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.boxLineMaterial = new THREE.LineBasicMaterial({ color: 0x1d47b3 });

        this.pointMaterial = new THREE.MeshBasicMaterial({ color: 0x1d47b3 });
        this.pathMaterial = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 100, });
        this.poseMaterial = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 100, });
        this.faceMaterial = new THREE.PointsMaterial({ vertexColors: true, size: 3 });
        this.handMaterial = new THREE.PointsMaterial({ vertexColors: true, size: 10 });

        this.boxQueue = [];

        this.maxPersons = 100;
        this.personBoxGroup = new Array(this.maxPersons).fill(null);
        this.personPathGeometry = new Array(this.maxPersons).fill(null);


        const dracoLoader = new DRACOLoader()
        // TODO: add a proper decoder library path
        dracoLoader.setDecoderPath(
            'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/libs/draco/'
        )
        this.gltfLoader = new GLTFLoader()
        this.gltfLoader.setDRACOLoader(dracoLoader)

        this.dog = {
            model: null,
            clips: []
        }

        this.person = {
            model: null,
            clips: []
        }
    }

    getScene()
    {
        return this.scene;
    }

    async loadGlbModel(path, parent, rotationY = Math.PI, scale = 0.25)
    {
        return new Promise(resolve =>
        {
            return this.gltfLoader.load(path, (gltf) =>
            {
                // rotate the scene 180 degrees on the z
                gltf.scene.rotation.y = rotationY;

                gltf.scene.scale.set(scale, scale * 2, scale);
                this.scene.add(gltf.scene);
                parent.model = gltf.scene;

                if (!gltf.clips) return resolve(gltf.scene);
                // play animation clip named play_dead
                gltf.clips.forEach((clip) =>
                {
                    parent.clips.push({ name: clip.name, clip });
                });
            });
        });
    }

    getAllPathPoints()
    {
        return this.peopleManager.getAllPathPoints();
    }

    update(predictionData)
    {
        const previousActivePeople = [ ...this.activePeople ];
        this.activePeople = [];

        if (!predictionData.objects) return;

        for (let i = 0; i < predictionData.objects.length && this.activePeople.length < this.maxPersons; i++)
        {
            let objects = predictionData.objects[ i ];
            if (objects.classLabel === "person")
            {
                const person = this.peopleManager.addPerson(objects);

                if (person.state === PeopleState.LOST) continue;

                person.index = this.activePeople.length;
                this.activePeople.push(person);

                this.showTraceId && this.drawTraceIdText(person);
                this.showPath && this.drawPath(person);
                this.showBounds && this.drawBoundingBox(person);
                this.showPose && this.drawPose(person);
                this.showFace && this.drawFace(person);
                this.showHands && this.drawHands(person);
            }
        }

        this.hideInactivePeople(previousActivePeople);

    }

    hideInactivePeople(people)
    {
        // hide people that are no longer in the scene
        for (let i = 0; i < people.length; i++)
        {
            const person = people[ i ];
            const personOnScreen = this.activePeople.includes(person);

            this.showPath && person.pathLine && (person.pathLine.visible = personOnScreen);
            this.showTraceId && person.traceIdText && (person.traceIdText.visible = personOnScreen);
            this.showBounds && person.boundsBoxParent && (person.boundsBoxParent.visible = personOnScreen);
            this.showPose && person.poseData.mesh && (person.poseData.mesh.visible = personOnScreen);
            this.showFace && person.faceData.mesh && (person.faceData.mesh.visible = personOnScreen);
            this.showHands && person.handData.mesh && (person.handData.mesh.visible = personOnScreen);
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
                    break;

                case "path":
                    person.pathLine && (person.pathLine.visible = this.showPath);
                    break;

                case "bounds":
                    person.boundsBoxParent && (person.boundsBoxParent.visible = this.showBounds);
                    break;

                case "traceId":
                    person.traceIdText && (person.traceIdText.visible = this.showTraceId);
                    break;

                case "pose":
                    person.poseData.mesh && (person.poseData.mesh.visible = this.showPose);
                    break;

                case "face":
                    person.faceData.mesh && (person.faceData.mesh.visible = this.showFace);
                    break;

                case "hands":
                    person.handData.mesh && (person.handData.mesh.visible = this.showHands);
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

        text.name = "traceId";
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
        const bounds = person.bounds;
        if (!bounds) return;

        let boundsBoxParent = person.boundsBoxParent;

        let width = person.boundsWidth;
        let height = person.boundsHeight;
        let boundsGeometry = person.boundsGeometry;

        let boundsPlaneMesh = null;

        if (!boundsBoxParent)
        {
            boundsGeometry = new THREE.PlaneGeometry(width, height);
            boundsPlaneMesh = new THREE.Mesh(boundsGeometry, this.GetBoundingBoxMaterial());
            boundsPlaneMesh.name = "bounds";
            this.personBoxGroup[ person.index ] = new THREE.Group();
            this.personBoxGroup[ person.index ].name = "bounds";

            boundsBoxParent = this.personBoxGroup[ person.index ];
            boundsBoxParent.add(boundsPlaneMesh);

            this.scene.add(boundsBoxParent);
            person.boundsGeometry = boundsGeometry;
            person.boundsBoxParent = boundsBoxParent;
        } else
        {
            boundsPlaneMesh = boundsBoxParent.children[ 0 ];
        }


        boundsPlaneMesh.material.uniforms.uDimensions.value = [ width, height ];
        boundsPlaneMesh.material.uniforms.uShowCenter.value = this.showPoint;

        if (!boundsGeometry) return;

        let verticesOfBox = [
            bounds.min.x, bounds.min.y, 0,
            bounds.max.x, bounds.min.y, 0,
            bounds.min.x, bounds.max.y, 0,
            bounds.max.x, bounds.max.y, 0,
        ];

        boundsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(verticesOfBox, 3));
        // set the boundingGeometry to the new bounds
        boundsGeometry.needsUpdate = true;
        boundsGeometry.computeBoundingBox();

    }


    drawPose(person)
    {
        const pose = person.poseData; // { points: {}, connections: [], mesh: [] }
        if (!pose.geometry) return;

        let poseMesh = pose.mesh;

        if (!poseMesh)
        {
            pose.mesh = new THREE.LineSegments(pose.geometry, this.poseMaterial);
            pose.mesh.name = "pose";
            this.scene.add(pose.mesh);
            poseMesh = pose.mesh;
        } else
        {
            // Get the new positions
            let newPositions = pose.geometry.attributes.position.array;

            poseMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));

            let furthesLeftPoint = 9999;
            let furthestRightPoint = 0;

            poseMesh.geometry.attributes.position.array.forEach((position, index) =>
            {
                // get the x vertex position from the geometry array
                if (index % 3 !== 0) return;

                const xPosition = poseMesh.geometry.attributes.position.array[ index ];

                if (xPosition < furthesLeftPoint)
                {
                    furthesLeftPoint = xPosition;
                }

                if (xPosition > furthestRightPoint)
                {
                    furthestRightPoint = xPosition;
                }
            });

            // Update the colors
            const colors = [];
            pose.geometry.attributes.position.array.forEach((position, index) =>
            {
                // create a gradient effect from left to right points from blue to green
                const color = new THREE.Color();
                // get the x vertex position from the geometry array
                if (index % 3 !== 0) return;

                const xPosition = poseMesh.geometry.attributes.position.array[ index ];

                // a gradient from blue to green based on the x position of the vertex
                const red = (xPosition - furthesLeftPoint) / (furthestRightPoint - furthesLeftPoint);
                const green = 1 - red;

                color.setRGB(red, green, 0);
                colors.push(color.r, color.g, color.b);
            });

            poseMesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            poseMesh.geometry.computeBoundingBox();
        }
    }

    drawFace(person)
    {
        const face = person.faceData;
        if (!face.geometry) return;

        let faceMesh = face.mesh;

        if (!faceMesh)
        {
            face.mesh = new THREE.Points(face.geometry, this.faceMaterial);

            faceMesh = face.mesh;
            faceMesh.name = "face";
            this.scene.add(face.mesh);
        } else
        {
            // Get the new positions
            let newPositions = face.geometry.attributes.position.array;

            // Update the positions of the vertices
            faceMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));

            let furthesLeftPoint = 9999;
            let furthestRightPoint = 0;

            face.geometry.attributes.position.array.forEach((position, index) =>
            {
                // get the x vertex position from the geometry array
                if (index % 3 !== 0) return;

                const xPosition = face.geometry.attributes.position.array[ index ];

                if (xPosition < furthesLeftPoint)
                {
                    furthesLeftPoint = xPosition;
                }

                if (xPosition > furthestRightPoint)
                {
                    furthestRightPoint = xPosition;
                }
            });

            // Update the colors
            const colors = [];
            face.geometry.attributes.position.array.forEach((position, index) =>
            {
                // create a gradient effect from left to right points from blue to green
                const color = new THREE.Color();
                // get the x vertex position from the geometry array
                if (index % 3 !== 0) return;

                const xPosition = face.geometry.attributes.position.array[ index ];

                // a gradient from blue to green based on the x position of the vertex
                const blue = (xPosition - furthesLeftPoint) / (furthestRightPoint - furthesLeftPoint);
                const green = 1 - blue;

                color.setRGB(0, green, blue * 20);
                colors.push(color.r, color.g, color.b);

            });

            faceMesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            // set posemesh needsUpdate to true
            faceMesh.geometry.computeBoundingBox();
        }
    }

    drawHands(person)
    {
        const hand = person.handData;
        if (!hand.geometry) return;

        let handMesh = hand.mesh;

        if (!handMesh)
        {
            handMesh = new THREE.Points(hand.geometry, this.handMaterial);
            this.scene.add(handMesh);
            hand.mesh = handMesh;
        } else
        {
            // Get the new positions
            let newPositions = hand.geometry.attributes.position.array;

            handMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));

            let furthesLeftPoint = 9999;
            let furthestRightPoint = 0;

            handMesh.geometry.attributes.position.array.forEach((position, index) =>
            {
                // get the x vertex position from the geometry array
                if (index % 3 !== 0) return;

                const xPosition = handMesh.geometry.attributes.position.array[ index ];

                if (xPosition < furthesLeftPoint)
                {
                    furthesLeftPoint = xPosition;
                }

                if (xPosition > furthestRightPoint)
                {
                    furthestRightPoint = xPosition;
                }
            });

            // Update the colors
            const colors = [];
            handMesh.geometry.attributes.position.array.forEach((position, index) =>
            {
                // create a gradient effect from left to right points from blue to green
                const color = new THREE.Color();
                // get the x vertex position from the geometry array
                if (index % 3 !== 0) return;

                const xPosition = handMesh.geometry.attributes.position.array[ index ];

                // a gradient from blue to green based on the x position of the vertex
                const blue = (xPosition - furthesLeftPoint) / (furthestRightPoint - furthesLeftPoint);
                const green = 1 - blue;

                color.setRGB(0, green, blue);
                colors.push(color.r, color.g, color.b);
            });

            handMesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            handMesh.geometry.computeBoundingBox();
        }
    }

    GetBoundingBoxMaterial() 
    {
        return new THREE.ShaderMaterial({
            uniforms: {
                uCornerLineWidth: { value: 1.0 },
                uCornerLineLength: { value: 0.2 },
                uShowCenter: { value: this.showPoint },
                uCenterRadius: { value: 2.0 },
                uInsetPadding: { value: 8.0 },
                uDimensions: { value: [] },
                uScreenResolution: { value: [ this.dimensions.width, this.dimensions.height ] }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = vec2(1.0 - uv.x, uv.y);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }
            `,
            fragmentShader: `
                uniform vec2 uDimensions; // [-1, 1]
                uniform vec2 uScreenResolution; // pixels
                varying vec2 vUv;

                // BOUNDING BOX
                const vec4 background = vec4(0.14902, 0.45490, 0.76863, 0.5);

                // CORNERS
                uniform float uCornerLineWidth; // pixels
                uniform float uInsetPadding; // padding between corner and inset
                uniform float uCornerLineLength; // percent width
                const vec4 outsetCorner = vec4(0.11373, 0.27843, 0.70196, 1);
                const vec4 insetCorner = vec4(0.588235, 0.854902, 0.973137, 1);

                // CENTER
                uniform bool uShowCenter;
                uniform float uCenterRadius; // percent width
                const vec4 centerColor = vec4(0.40373, 0.70843, 0.99196, 1);

                void main() {
                    vec4 color = background;
                    vec2 res = uScreenResolution * 0.5 * uDimensions;

                    vec2 lineWidth = vec2(uCornerLineWidth) / res;
                    vec2 lineLength = vec2(uCornerLineLength, uCornerLineLength * res.x / res.y);

                    if (((vUv.x < lineLength.x || vUv.x > 1.0 - lineLength.x) && (vUv.y <= lineWidth.y || vUv.y >= 1.0 - lineWidth.y))
                        || ((vUv.y < lineLength.y || vUv.y > 1.0 - lineLength.y) && (vUv.x <= lineWidth.x || vUv.x >= 1.0 - lineWidth.x))) {
                        color = outsetCorner;
                    }

                    vec2 inset = uInsetPadding / res;
                    vec2 insetUV = vUv + inset * vec2(vUv.x < 0.5 ? -1 : 1, vUv.y < 0.5 ? -1 : 1);
                    vec2 insetLength = lineLength - inset;
                    vec2 insetWidth = lineWidth;
                    if ((((0.0 < insetUV.x && insetUV.x < insetLength.x) || (1.0 > insetUV.x && insetUV.x > 1.0 - insetLength.x)) && ((0.0 <= insetUV.y && insetUV.y <= insetWidth.y) || (1.0 >= insetUV.y && insetUV.y >= 1.0 - insetWidth.y)))
                        || (((0.0 < insetUV.y && insetUV.y < insetLength.y) || (1.0 > insetUV.y && insetUV.y > 1.0 - insetLength.y)) && ((0.0 <= insetUV.x && insetUV.x <= insetWidth.x) || (1.0 >= insetUV.x && insetUV.x >= 1.0 - insetWidth.x)))) {
                        color = insetCorner;
                    }

                    if (uShowCenter) {
                        vec2 centerUV = vec2(vUv.x - 0.5, (vUv.y - 0.5) * res.y / res.x);
                        color = mix(centerColor, color, pow(smoothstep(0.0, uCenterRadius / res.x, length(centerUV)), 6.0));
                    }

                    gl_FragColor = color;
                }
            `,
            transparent: true,
            depthTest: true,
            depthWrite: true,
            side: THREE.DoubleSide,
        });
    }

}

