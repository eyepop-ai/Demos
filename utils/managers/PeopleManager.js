import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import * as BufferGeometryUtils from 'https://unpkg.com/three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';

// a class that contains a map of all the people in the scene and their history of positions
import People from "../data/People.js";

export default class PeopleManager
{
    constructor(dimensions)
    {
        this.peopleMap = new Map();
        this.hotSpotMap = new Map();
        this.dimensions = dimensions;

        this.maxPeoplePositions = 50000;
        this.allPeoplePositions = [];

        this.edgesLoaded = false;
        this.edgeObjects = { topLeft: null, topRight: null, bottomLeft: null, bottomRight: null };

        this.loadEdgeObjects();

        this.poseConnections = [
            [ 'mouth (right)', 'mouth (left)' ],
            [ 'right ear', 'right eye (outer)' ],
            [ 'right eye (outer)', 'right eye' ],
            [ 'right eye', 'right eye (inner)' ],
            [ 'right eye (inner)', 'nose' ],
            [ 'nose', 'left eye (inner)' ],
            [ 'left eye (inner)', 'left eye' ],
            [ 'left eye', 'left eye (outer)' ],
            [ 'left eye (outer)', 'left ear' ],

            [ 'right shoulder', 'left shoulder' ],
            [ 'left shoulder', 'left hip' ],
            [ 'left hip', 'right hip' ],
            [ 'right hip', 'right shoulder' ],

            [ 'right shoulder', 'right elbow' ],
            [ 'right elbow', 'right wrist' ],
            [ 'right wrist', 'right thumb' ],
            [ 'right wrist', 'right pinky' ],
            [ 'right wrist', 'right index' ],
            [ 'right pinky', 'right index' ],

            [ 'left shoulder', 'left elbow' ],
            [ 'left elbow', 'left wrist' ],
            [ 'left wrist', 'left thumb' ],
            [ 'left wrist', 'left pinky' ],
            [ 'left wrist', 'left index' ],
            [ 'left pinky', 'left index' ],

            [ 'right hip', 'right knee' ],
            [ 'right knee', 'right ankle' ],
            [ 'right ankle', 'right foot index' ],
            [ 'right ankle', 'right heel' ],
            [ 'right heel', 'right foot index' ],

            [ 'left hip', 'left knee' ],
            [ 'left knee', 'left ankle' ],
            [ 'left ankle', 'left foot index' ],
            [ 'left ankle', 'left heel' ],
            [ 'left heel', 'left foot index' ],
        ]
    }

    loadEdgeObjects()
    {
        const scope = this;
        const loader = new GLTFLoader();
        loader.load('../utils/assets/edges.glb', (gltf) =>
        {
            const cornerMaterial = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, reflectivity: 0, fog: false, blending: THREE.MixOperation });

            gltf.scene.traverse((child) =>
            {
                if (child.isMesh)
                {

                    cornerMaterial.map = child.material.map;
                    child.material = cornerMaterial;
                    child.rotation.y = Math.PI / 2;

                    switch (child.name)
                    {
                        case 'edge_top_left':
                            scope.edgeObjects.topLeft = child;
                            break;
                        case 'edge_top_right':
                            scope.edgeObjects.topRight = child;
                            break;
                        case 'edge_bottom_left':
                            scope.edgeObjects.bottomLeft = child;
                            break;
                        case 'edge_bottom_right':
                            scope.edgeObjects.bottomRight = child;
                            break;
                    }

                }
            });
            scope.edgesLoaded = true;
        });
    }

    normalizePosition(position, sourceWidth, sourceHeight)
    {
        let normalizedX = position.x * (this.dimensions.width / sourceWidth);
        let normalizedY = position.y * (this.dimensions.height / sourceHeight);

        // now map the normalized position to -1 to 1
        normalizedX = (normalizedX / (this.dimensions.width / 2)) - 1;
        normalizedY = (normalizedY / (this.dimensions.height / 2)) - 1;

        normalizedX *= -1;
        normalizedY *= -1;

        return { x: normalizedX, y: normalizedY };
    }

    addPerson(person)
    {
        let cachedPerson = this.getPerson(person.traceId);

        if (!cachedPerson)
        {
            cachedPerson = new People();
        }

        if (!person.source_width || !person.source_height)
        {
            return cachedPerson;
        }


        cachedPerson.traceId = person.traceId;
        cachedPerson.pose = person.objects;


        // BOUNDING BOX
        // the bounding box of the person
        // the top left position of the person
        // Flip the X, Y coordinates to match THREE.js
        let normalizedTopLeft = this.normalizePosition(person, person.source_width, person.source_height);
        cachedPerson.topLeftPoint.x = normalizedTopLeft.x / 2;
        cachedPerson.topLeftPoint.y = normalizedTopLeft.y / 2;

        let maxX = person.x + person.width;
        let maxY = person.y + person.height;

        const normalizedBottomRight = this.normalizePosition(
            { x: maxX, y: maxY },
            person.source_width,
            person.source_height
        );

        cachedPerson.bottomRightPoint.x = normalizedBottomRight.x / 2;
        cachedPerson.bottomRightPoint.y = normalizedBottomRight.y / 2;

        cachedPerson.bounds = new THREE.Box3();
        cachedPerson.bounds.min.x = normalizedTopLeft.x;
        cachedPerson.bounds.min.y = normalizedTopLeft.y;
        cachedPerson.bounds.max.x = normalizedBottomRight.x;
        cachedPerson.bounds.max.y = normalizedBottomRight.y;

        cachedPerson.boundsWidth = Math.abs(normalizedTopLeft.x - normalizedBottomRight.x);
        cachedPerson.boundsHeight = Math.abs(normalizedTopLeft.y - normalizedBottomRight.y);

        cachedPerson.position = new THREE.Vector3();
        cachedPerson.position.x = (normalizedTopLeft.x + normalizedBottomRight.x) / 2;
        cachedPerson.position.y = (normalizedTopLeft.y + normalizedBottomRight.y) / 2;

        // PATH
        // Capturing the path of the person
        if (window.DEBUG_thirdEyePop.showFootTraffic)
        {
            const pathPoint = { ...normalizedBottomRight };
            // clamp path point to -1 and 1
            pathPoint.x = cachedPerson.position.x;

            pathPoint.y = Math.min(Math.max(pathPoint.y, -1), 1);

            this.trackNewPosition(pathPoint);
            cachedPerson.position.x = pathPoint.x;
            cachedPerson.position.y = pathPoint.y;
        } else
        {
            this.trackNewPosition(cachedPerson.position);
        }

        cachedPerson.addPathPoint(cachedPerson.position);
        this.peopleMap.set(person.traceId, cachedPerson);


        // POSE
        // the pose of the person, person.objects[0].keypoints
        // the keypoints of the person
        if (person.objects && person.objects.length > 0 && "keyPoints" in person.objects[ 0 ])
        {
            // cachedPerson.poseData = { points: {}, edges: [], mesh: null, geometry: null };

            person.objects[ 0 ].keyPoints[ 0 ].points.forEach((point) =>
            {
                const tempPoint = new THREE.Vector3(point.x, point.y, 0);
                const normalizedPoint = this.normalizePosition(tempPoint, person.source_width, person.source_height);

                cachedPerson.poseData.points[ point.classLabel ] = new THREE.Vector3(normalizedPoint.x, normalizedPoint.y, 0);
            });

            // next we create a 2d array of the connection points based on the poseDataConnections array
            cachedPerson.poseData.edges = this.poseConnections.map((connection) =>
            {
                return [ cachedPerson.poseData.points[ connection[ 0 ] ], cachedPerson.poseData.points[ connection[ 1 ] ] ];
            });

            // create multiple line segments based on the edges and merge them all into one mesh then add that to the poseData.mesh object
            let poseGeometry = [];
            cachedPerson.poseData.edges.forEach((edgePoints) =>
            {
                // skip if any edgePoints are null
                if (!edgePoints[ 0 ] || !edgePoints[ 1 ])
                {
                    return;
                }
                const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edgePoints);

                poseGeometry.push(edgeGeometry);
            });

            cachedPerson.poseData.geometry = BufferGeometryUtils.mergeGeometries(poseGeometry, 0);

        }


        return cachedPerson;

    }

    removePerson(traceID)
    {
        this.peopleMap.delete(traceID);
    }

    trackNewPosition(position)
    {
        if (this.allPeoplePositions.length > this.maxPeoplePositions)
        {
            this.allPeoplePositions.shift();
        }

        this.allPeoplePositions.push(position);
    }

    getPerson(traceID)
    {
        return this.peopleMap.get(traceID);
    }

    getPeople()
    {
        return this.peopleMap;
    }

    getPeopleArray()
    {
        return Array.from(this.peopleMap.values());
    }

    getAllPathPoints()
    {
        return this.allPeoplePositions;
    }

    getPeoplePositions()
    {
        let positions = [];
        this.peopleMap.forEach((person) =>
        {
            positions.push(person.position);
        });
        return positions;
    }

    dispose()
    {
        this.peopleMap.clear();
        this.hotSpotMap.clear();
        this.allPeoplePositions = [];
    }


}
