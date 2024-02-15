import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import * as BufferGeometryUtils from 'https://unpkg.com/three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'https://unpkg.com/three/examples/jsm/loaders/GLTFLoader.js';

// a class that contains a map of all the people in the scene and their history of positions
import People from "../data/People.js";
// TODO:
//   - Rename to object manager


export default class PeopleManager
{
    constructor(dimensions, showPath = false, smoothingAmount = 10)
    {
        this.peopleMap = new Map();
        this.hotSpotMap = new Map();
        this.dimensions = dimensions;
        this.showPath = showPath;
        this.smoothingAmount = smoothingAmount;

        this.maxPeoplePositions = 50000;
        this.allPeoplePositions = [];

        this.poseConnections33 = [
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

    normalizePosition(position, sourceWidth, sourceHeight, maxDepth = 1000)
    {
        let normalizedX = position.x * (this.dimensions.width / sourceWidth);
        let normalizedY = position.y * (this.dimensions.height / sourceHeight);
        let normalizedZ = position.z / maxDepth;

        // now map the normalized position to -1 to 1
        normalizedX = (normalizedX / (this.dimensions.width / 2)) - 1;
        normalizedY = (normalizedY / (this.dimensions.height / 2)) - 1;

        normalizedX *= -1;
        normalizedY *= -1;

        return { x: normalizedX, y: normalizedY, z: normalizedZ };
    }

    addPerson(person)
    {
        let trackedPerson = null;
        let id = person.traceId;
        if (!id)
        {
            id = person.id;
        }

        trackedPerson = this.getPerson(id);
        // Sanity check for valid frame data
        if (!person.source_width || !person.source_height)
        {
            return trackedPerson;
        }

        this.peopleMap.set(id, trackedPerson);

        trackedPerson.children = person.objects;
        trackedPerson.traceId = id;

        let normalizedTopLeft = this.normalizePosition(person, person.source_width, person.source_height);

        // BOUNDING BOX
        this.updateBounds(person, trackedPerson, normalizedTopLeft);

        // PATH
        this.updatePath(trackedPerson, normalizedTopLeft);

        // POSE
        this.updatePoseGeometry(person, trackedPerson);


        return trackedPerson;

    }

    // the bounding box of the person
    // the top left position of the person
    // Flip the X, Y coordinates to match THREE.js
    updateBounds(person, trackedPerson, normalizedTopLeft)
    {
        trackedPerson.topLeftPoint.x = normalizedTopLeft.x / 2;
        trackedPerson.topLeftPoint.y = normalizedTopLeft.y / 2;

        let maxX = person.x + person.width;
        let maxY = person.y + person.height;

        const normalizedBottomRight = this.normalizePosition(
            { x: maxX, y: maxY },
            person.source_width,
            person.source_height
        );

        trackedPerson.bottomRightPoint.x = normalizedBottomRight.x / 2;
        trackedPerson.bottomRightPoint.y = normalizedBottomRight.y / 2;

        trackedPerson.bounds = new THREE.Box3();
        trackedPerson.bounds.min.x = normalizedTopLeft.x;
        trackedPerson.bounds.min.y = normalizedTopLeft.y;
        trackedPerson.bounds.max.x = normalizedBottomRight.x;
        trackedPerson.bounds.max.y = normalizedBottomRight.y;

        trackedPerson.boundsWidth = Math.abs(normalizedTopLeft.x - normalizedBottomRight.x);
        trackedPerson.boundsHeight = Math.abs(normalizedTopLeft.y - normalizedBottomRight.y);

        // the center of the bounding box
        trackedPerson.position = new THREE.Vector3();
        trackedPerson.position.x = (normalizedTopLeft.x + normalizedBottomRight.x) / 2;
        trackedPerson.position.y = (normalizedTopLeft.y + normalizedBottomRight.y) / 2;
    }


    updatePath(trackedPerson, normalizedBottomRight)
    {
        if (!this.showPath) return;

        let yOffset = 0;
        // Capturing the path of the person
        if (window.DEBUG_thirdEyePop.showFootTraffic)
        {

            // Here we use the bottom right bounding box as the Y coordinate to track the foot path

            const pathPoint = { ...normalizedBottomRight };
            // clamp path point to -1 and 1
            pathPoint.x = trackedPerson.position.x;
            pathPoint.y = Math.min(Math.max(pathPoint.y - trackedPerson.boundsHeight, -1), 1);

            this.trackNewPosition(pathPoint);

            // next we store the Y offset incase we want to draw from the center
            yOffset = Math.abs(pathPoint.y - trackedPerson.position.y);
        } else
        {
            this.trackNewPosition(trackedPerson.position);
        }

        trackedPerson.addPathPoint(new THREE.Vector3(
            trackedPerson.position.x,
            trackedPerson.position.y - yOffset,
            trackedPerson.position.z));
    }

    updatePoseGeometry(person, trackedPerson)
    {
        let poseIndex = null;
        let faceIndex = null;
        let palmIndices = [];

        if ("objects" in person)
        {
            // find the pose index, there may be other objects like face, and hands in the array
            for (let i = 0; i < person.objects.length; i++)
            {
                const element = person.objects[ i ];
                if (element.classLabel === 'pose')
                {
                    poseIndex = i;
                } else if (element.classLabel === 'face')
                {
                    faceIndex = i;
                } else if (element.classLabel === 'palm')
                {
                    palmIndices.push(i);
                }
            }
        }

        // if theres no pose index found, assume ther pose data is in the keyPoints array
        if (poseIndex < 0)
        {
            poseIndex = null
        }

        this.buildPoseGeometryMediaPipe33(person, trackedPerson, poseIndex);
        this.buildFaceGeometry(person, trackedPerson, faceIndex);
        this.buildHandGeometry(person, trackedPerson, palmIndices);
    }

    buildHandGeometry(person, trackedPerson, palmIndices = [])
    {
        if (palmIndices.length <= 0) return;

        let leftHand = null;
        let rightHand = null;

        for (let x = 0; x < palmIndices.length; x++)
        {
            const palmIndex = palmIndices[ x ];

            const palm = person.objects[ palmIndex ].objects;

            for (let i = 0; i < palm.length; i++)
            {
                const element = palm[ i ];
                if (element.classLabel === "hand circumference")
                {
                    if (!("classes" in element)) continue;

                    for (let j = 0; j < element.classes.length; j++)
                    {
                        if (element.classes[ j ].classLabel === "right")
                        {
                            rightHand = element.keyPoints[ 0 ].points;
                        } else if (element.classes[ j ].classLabel === "left")
                        {
                            leftHand = element.keyPoints[ 0 ].points;
                        }
                    }

                }
            }
        }

        trackedPerson.handData.points = [];
        trackedPerson.handData.geometry = null;

        if (leftHand)
        {
            trackedPerson.handData.leftHandPoints = {};
            leftHand.forEach((point) =>
            {
                const tempPoint = new THREE.Vector3(point.x, point.y, point.z);
                const normalizedPoint = this.normalizePosition(tempPoint, person.source_width, person.source_height, 100);

                trackedPerson.handData.points.push(normalizedPoint.x, normalizedPoint.y, normalizedPoint.z);

                trackedPerson.handData.leftHandPoints[ point.classLabel ] = new THREE.Vector3(normalizedPoint.x, normalizedPoint.y, normalizedPoint.z);
            });
        }

        if (rightHand)
        {
            trackedPerson.handData.rightHandPoints = {};

            rightHand.forEach((point) =>
            {
                const tempPoint = new THREE.Vector3(point.x, point.y, point.z);
                const normalizedPoint = this.normalizePosition(tempPoint, person.source_width, person.source_height, 100);

                trackedPerson.handData.points.push(normalizedPoint.x, normalizedPoint.y, normalizedPoint.z);

                trackedPerson.handData.rightHandPoints[ point.classLabel ] = new THREE.Vector3(normalizedPoint.x, normalizedPoint.y, normalizedPoint.z);
            });
        }

        if (trackedPerson.handData.points.length > 0)
        {
            trackedPerson.handData.geometry = new THREE.BufferGeometry();
            trackedPerson.handData.geometry.setAttribute('position', new THREE.Float32BufferAttribute(trackedPerson.handData.points, 3));
        }
    }

    buildFaceGeometry(person, trackedPerson, faceIndex = null)
    {
        if (!faceIndex || !("meshs" in person.objects[ faceIndex ])) return;

        let vertices = null;

        if (faceIndex)
        {
            vertices = person.objects[ faceIndex ].meshs[ 0 ].points;
        } else
        {
            vertices = person.meshs[ 0 ].points;
        }

        trackedPerson.faceData.points = [];

        vertices.forEach((point) =>
        {
            const tempPoint = new THREE.Vector3(point.x, point.y, point.z);
            const normalizedPoint = this.normalizePosition(tempPoint, person.source_width, person.source_height, 1000);

            trackedPerson.faceData.points.push(normalizedPoint.x, normalizedPoint.y, normalizedPoint.z - .08);
        });

        if (trackedPerson.faceData.points.length > 0)
        {
            trackedPerson.faceData.geometry = new THREE.BufferGeometry();
            trackedPerson.faceData.geometry.setAttribute('position', new THREE.Float32BufferAttribute(trackedPerson.faceData.points, 3));
        } else
        {
            trackedPerson.faceData.geometry = null;
        }
    }

    buildPoseGeometryMediaPipe33(person, trackedPerson, poseIndex = null)
    {
        if (!("keyPoints" in person) && !poseIndex) return;

        let keyPoints = null;

        if (poseIndex)
        {
            keyPoints = person.objects[ poseIndex ].keyPoints[ 0 ].points;
        }
        else
        {
            keyPoints = person.keyPoints[ 0 ].points;
        }

        trackedPerson.poseData.points = {};

        // average pose data for smoother results
        if (!trackedPerson.poseData.smoothedPoints)
        {
            trackedPerson.poseData.smoothedPoints = {};
        }

        for (let i = 0; i < keyPoints.length; i++)
        {
            const point = keyPoints[ i ];
            const tempPoint = new THREE.Vector3(point.x, point.y, point.z);
            const normalizedPoint = this.normalizePosition(tempPoint, person.source_width, person.source_height, 5000);

            // if the average points are empty, set them to the current points
            if (!(i in trackedPerson.poseData.smoothedPoints))
            {
                trackedPerson.poseData.smoothedPoints[ i ] = {
                    points: [],
                    average: null
                };
            }

            // create a rolling average of the keyPoints[i] in the smoothedPoints[i] array
            trackedPerson.poseData.smoothedPoints[ i ].points.push(normalizedPoint);
            if (trackedPerson.poseData.smoothedPoints[ i ].points.length > this.smoothingAmount)
            {
                trackedPerson.poseData.smoothedPoints[ i ].points.shift();
            }

            trackedPerson.poseData.smoothedPoints[ i ].average = trackedPerson.poseData.smoothedPoints[ i ].points.reduce((accumulator, point) => accumulator.add(point), new THREE.Vector3()).divideScalar(trackedPerson.poseData.smoothedPoints[ i ].points.length);


            trackedPerson.poseData.points[ point.classLabel ] = trackedPerson.poseData.smoothedPoints[ i ].average
        }

        // next we create a 2d array of the connection points based on the poseDataConnections array
        trackedPerson.poseData.edges = this.poseConnections33.map((connection) =>
        {
            return [ trackedPerson.poseData.points[ connection[ 0 ] ], trackedPerson.poseData.points[ connection[ 1 ] ] ];
        });

        let poseGeometry = [];

        trackedPerson.poseData.edges.forEach((edgePoints) =>
        {
            // skip if any edgePoints are null
            if (!edgePoints[ 0 ] || !edgePoints[ 1 ])
            {
                return;
            }
            const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edgePoints);

            poseGeometry.push(edgeGeometry);
        });


        if (poseGeometry.length > 0)
        {
            trackedPerson.poseData.geometry = BufferGeometryUtils.mergeGeometries(poseGeometry, 0);
        }
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
        let returnPerson = this.peopleMap.get(traceID);

        if (!returnPerson)
        {
            returnPerson = new People(this.showPath);
        }

        return returnPerson;
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
