// a class to store the people data such as traceID, keypoints like nose, eyes, ears, etc., bounding box, and position in the scene
import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { PeopleState } from './Constants.js';

// TODO: Organize path, bounds, and traceIdText into a single object such as poseData and faceData
export default class People
{

    constructor(track = false)
    {
        this.track = track;
        this.traceId = null;

        this.position = new THREE.Vector3();
        this.topLeftPoint = new THREE.Vector3();
        this.bottomRightPoint = new THREE.Vector3();

        this.poseData = { points: {}, edges: [], mesh: null, geometry: null }
        this.faceData = { points: [], mesh: null, geometry: null };
        this.handData = { leftHandPoints: [], rightHandPoints: [], points: [], mesh: null, geometry: null };

        this.path = [];
        this.pathLine = null;
        this.pathLineGeometry = null;

        this.traceIdText = null;
        this.centerSphere = null;

        this.bounds = null;
        this.boundsBoxParent = null;
        this.boundsGeometry = null;

        this.boundsWidth = null;
        this.boundsHeight = null;

        this.state = PeopleState.TRACKING;

    }

    addPathPoint(point)
    {
        this.state = PeopleState.TRACKING;
        // If there is a large jump in the path, reset it
        if (this.path.length > 0 && this.track)
        {
            const lastPoint = this.path[ this.path.length - 1 ];
            const distance = lastPoint.distanceTo(point);

            if (distance > window.DEBUG_thirdEyePop.pathDistanceThreshold)
            {
                this.state = PeopleState.LOST;
                this.path = [];
            }
        }

        this.path.push(point);

        this.path = this.path.slice(-1000);
    }

}
