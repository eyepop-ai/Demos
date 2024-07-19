import * as THREE from 'three';
var vehicles = new Map();
var vehiclesArray = [];


class Vehicle
{
    constructor(id, x, y, width, height)
    {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.positions = [];
        this.velocity = { x: 0, y: 0 };
        this.velocities = [];
        this.accelerations = [];
        this.accelerationTimes = [];
        this.collisionFactor = 0.0;
        this.trafficFactor = 0.0;
        this.active = true;
        this.threshold = 10;
        this.wasProcessed = false;
        this.setInactiveTimeout = null;
        this.opacityInterval = null;
        this.opacity = 1.0;
        this.directionalFlow = 0;
    }

    setActive(active)
    {

        if (active)
        {
            clearInterval(this.opacityInterval);
            clearTimeout(this.setInactiveTimeout);
            this.opacity = 1.0;
            this.active = true;
        } else
        {
            this.opacityInterval = setInterval(() =>
            {
                this.opacity -= .1;
            }, 50);

            this.setInactiveTimeout = setTimeout(() =>
            {
                this.active = false;
            }, 500);
        }

    }

    //
    //  This function handles the primary "collision" logic. It updates the position of the vehicle
    //    based on the new position data from the EyePop.ai computer vision pipeline.
    //
    //    NOTE: Most of this functions logic is used to filter out poor vision results which is
    //          uneccessary for clients using custom models.
    //
    updatePosition(time, newX, newY, newWidth, newHeight)
    {
        // First check if the new position is within a threshold distance of the previous position
        //  If it is not, then the new position is not valid and we should ignore it
        const distX = Math.abs(newX - this.x);
        const distY = Math.abs(newY - this.y);
        const changeSampleCount = 5;

        if ((distX < 10 && distY < 10) && (newWidth < 200 && newHeight < 200))
        {
            this.setActive(true);
        } else
        {
            this.setActive(false);
        }


        // We ignore any stagnant positions, as we only care about the position delta
        if (newX === this.x || newY === this.y)
        {
            return;
        }

        // Calculate new velocity
        const newVelocityX = newX - this.x;
        const newVelocityY = newY - this.y;
        const newSpeed = Math.sqrt(newVelocityX ** 2 + newVelocityY ** 2);

        // Calculate acceleration based on the change in speed over one frame
        const oldSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        const acceleration = newSpeed - oldSpeed; // Assuming a constant frame rate

        this.width = newWidth;
        this.height = newHeight;

        this.positions.push({ x: newX, y: newY });

        // Update position and velocity using the average of the positions
        this.x = newX;
        this.y = newY;


        // Update acceleration history, maintaining a fixed size of history
        if (this.accelerations.length >= 40)
        {
            this.accelerations.shift();
            this.accelerationTimes.shift();
            this.positions.shift();
            this.velocities.shift();
        }

        // If the new position is too far from the last position, we ignore it
        //   but preserve the position data for calculating the velocity.
        //   This is a hack to prevent erroneous velocity spikes.
        if (distX > 50 || distY > 50)
        {
            this.setActive(false);
            return;
        }

        this.velocities.push({ x: newVelocityX, y: newVelocityY });
        this.accelerationTimes.push(time);
        this.accelerations.push(acceleration);

        // Another hack is used here to scale up the velocity values to match our canvas size, purely for drawing
        // purposes. This should not be done in a real application.
        this.velocity.x = newVelocityX * 4;
        this.velocity.y = newVelocityY * 4;

        // If we have enough acceleration samples, we use the the average velocities instead of the last velocity
        if (this.accelerations.length > 6)
        {
            this.velocity.x = this.velocities.reduce((sum, vel) => sum + vel.x, 0) / this.velocities.length;
            this.velocity.y = this.velocities.reduce((sum, vel) => sum + vel.y, 0) / this.velocities.length;

            this.velocity.x *= 4;
            this.velocity.y *= 4;
        }
    }

    getVelocity()
    {
        return {
            x: this.velocities.reduce((sum, vel) => sum + vel.x, 0) / this.velocities.length,
            y: this.velocities.reduce((sum, vel) => sum + vel.y, 0) / this.velocities.length
        };
    }

    isAboveThreshold(sample)
    {
        if (this.accelerations.length < 2) { return 100; } // Default threshold if not enough data

        // calculate the mean of accelerations but only sample if the acceleration is less than 2x the previous acceleration
        let meanAcceleration = 0;
        let count = 0;
        for (let i = 1; i < this.accelerations.length; i++)
        {
            if (Math.abs(this.accelerations[ i ] - this.accelerations[ i - 1 ]) < 10)
            {
                meanAcceleration += Math.abs(this.accelerations[ i ]);
                count += 1;
            }
        }


        meanAcceleration /= count;
        this.threshold = meanAcceleration * 15;

        const outlierScale = Math.abs(sample - meanAcceleration);
        // if the sample is an outlier, we ignore it
        if (outlierScale > 20)
        {
            return false;
        }

        return Math.abs(sample) >= this.threshold;
    }

    clearAccelerations()
    {
        this.accelerations = [];
        this.accelerationTimes = [];
    }

    hasEnoughConsecutiveSamples(threshold = 35)
    {
        let count = 0;

        for (let i = 1; i < this.accelerationTimes.length; i++)
        {

            const lastPosition = this.positions[ i - 1 ];
            const currentPosition = this.positions[ i ];
            const lastTime = this.accelerationTimes[ i - 1 ];
            const time = this.accelerationTimes[ i ];

            if (
                time - lastTime <= .2 &&
                Math.abs(lastPosition.x - currentPosition.x) < 25 &&
                Math.abs(lastPosition.y - currentPosition.y) < 25
            )
            {
                count += 1;
            }
        }

        return count > threshold;
    }

    reset()
    {
        this.active = false;
        this.positions = [];
        this.velocities = [];
        this.accelerations = [];
        this.accelerationTimes = [];
        this.collisionFactor = 0.0;
        this.trafficFactor = 0.0;
        this.wasProcessed = false;

    }

}

function findClosestVehicle(object, vehiclesMap, threshold = 100)
{

    if (!object.traceId) return null;

    let closestVehicle = vehiclesMap.get(object.traceId);

    return closestVehicle;
}


function getPerpendicularVectors(point1, point2)
{
    // Convert the 2D points to 3D vectors (z = 0)
    const v1 = new THREE.Vector3(point1.x, point1.y, 0);
    const v2 = new THREE.Vector3(point2.x, point2.y, 0);

    // Calculate the direction vector
    const direction = new THREE.Vector3().subVectors(v2, v1);
    direction.normalize();

    // Find a vector perpendicular to the direction vector in the XY plane
    const perpendicular1 = new THREE.Vector3(-direction.y, direction.x, 0);
    perpendicular1.normalize();

    // The second perpendicular vector is simply the negative of the first one
    const perpendicular2 = new THREE.Vector3(direction.y, -direction.x, 0);
    perpendicular2.normalize();

    return { perpendicular2, perpendicular1 };
}

const lineBox = new THREE.Box3();
const vehicleBox = new THREE.Box3();

function isVehiclePassingThroughLine(vehicle, pointA, pointB, perpendiculars)
{
    if (!vehicle || !pointA || !pointB || !perpendiculars) return false;
    if (!vehicle.x || !vehicle.y || !vehicle.width || !vehicle.height) return false;
    if (!pointA.x || !pointA.y || !pointB.x || !pointB.y) return false;

    const vehicleCorners = [
        new THREE.Vector3(vehicle.x, vehicle.y, 0),
        new THREE.Vector3(vehicle.x + vehicle.width, vehicle.y, 0),
        new THREE.Vector3(vehicle.x, vehicle.y + vehicle.height, 0),
        new THREE.Vector3(vehicle.x + vehicle.width, vehicle.y + vehicle.height, 0) // Fixed typo "heigh" to "height"
    ];

    const pointCorners = [
        new THREE.Vector3(pointA.x, pointA.y, 0),
        new THREE.Vector3(pointA.x, pointA.y, 0),
        new THREE.Vector3(pointB.x, pointB.y, 0),
        new THREE.Vector3(pointB.x, pointB.y, 0)
    ];


    // Create a threejs plane from the two points
    lineBox.setFromPoints(pointCorners);
    // Create a box for the vehicle
    vehicleBox.setFromPoints(vehicleCorners);

    // Check if the line intersects the vehicle box
    return vehicleBox.intersectsBox(lineBox);
}

function getFlowStatistics(pointA, pointB)
{
    // detect all vehicles in the scene passing through the line segment defined by pointA and pointB
    // and calculate the flow statistics for the two directions
    if (!pointA || !pointB) return null;
    if (!pointA.x || !pointA.y || !pointB.x || !pointB.y) return null;

    const result = {
        flow1: {
            direction: new THREE.Vector2(0, 0),
            count: 0,
            angle: 0
        },
        flow2: {
            direction: new THREE.Vector2(0, 0),
            count: 0,
            angle: 0
        }
    };

    const perpendiculars = getPerpendicularVectors(pointA, pointB);
    result.flow1.direction.copy(perpendiculars.perpendicular1);
    result.flow2.direction.copy(perpendiculars.perpendicular2);
    result.flow1.angle = vectorToAngle(perpendiculars.perpendicular1)
    result.flow2.angle = vectorToAngle(perpendiculars.perpendicular2)

    const allVehicles = getVehicles(true); // Assuming this function returns a list of vehicles with positions and velocities

    for (let i = 0; i < allVehicles.length; i++)
    {
        const vehicle = allVehicles[ i ];
        const vehicleVelocity = new THREE.Vector2(vehicle.getVelocity().x, vehicle.getVelocity().y);

        // Calculate if the vehicle is passing through the line between pointA and pointB
        //   mark it as passing through the first direction or the second direction based on the angle
        const angle1 = vehicleVelocity.angleTo(result.flow1.direction);
        const angle2 = vehicleVelocity.angleTo(result.flow2.direction);

        const isPassing = isVehiclePassingThroughLine(vehicle, pointA, pointB, perpendiculars);

        if (isPassing && vehicle.active)
        {
            if (angle1 > angle2)
            {
                vehicle.directionalFlow = 1;
            } else
            {
                vehicle.directionalFlow = 2;
            }
        }
    }

    // Calculate the flow statistics
    for (let i = 0; i < allVehicles.length; i++)
    {
        const vehicle = allVehicles[ i ];
        if (vehicle.directionalFlow === 0) continue;

        if (vehicle.directionalFlow === 1)
        {
            result.flow1.count += 1;
        } else if (vehicle.directionalFlow === 2)
        {
            result.flow2.count += 1;
        }
    }

    return result;
}

function vectorToAngle(vector)
{
    // Get the angle in radians between the positive x-axis and the point (vector.x, vector.y)
    const angleRadians = Math.atan2(vector.y, vector.x);
    // Convert the angle from radians to degrees
    const angleDegrees = angleRadians * (180 / Math.PI);
    // Ensure the angle is in the range [0, 360)
    return (angleDegrees + 360) % 360;
}

function detectCollision(vehicleMap)
{
    let collisionDetected = false;
    let trafficDetected = false;
    let vehiclesInTraffic = 0;
    for (const vehicle of getVehicles())
    {
        // detect dynamic collision based on acceleration change
        const lastAcceleration = Math.abs(vehicle.accelerations[ vehicle.accelerations.length - 1 ] || 0);

        if (
            vehicle.isAboveThreshold(lastAcceleration) &&
            vehicle.hasEnoughConsecutiveSamples() &&
            !vehicle.wasProcessed
        )
        {

            vehicle.collisionFactor = 1.0;
            collisionDetected = true;
        }

        // detect traffic congestion based on average velocity
        if (vehicle.velocities.length >= 5)
        {
            const velocities = vehicle.velocities.slice(vehicle.velocities.length - 5, vehicle.velocities.length);
            const averageVelocity = Math.sqrt(velocities.reduce((sum, vel) => sum + vel.x ** 2 + vel.y ** 2, 0) / velocities.length);

            if (averageVelocity < 10)
            {
                vehicle.trafficFactor = 1.0;
                vehiclesInTraffic += 1;
            } else
            {
                vehicle.trafficFactor = 0.0;
            }

        }
    }

    if (vehiclesInTraffic > 3)
    {
        trafficDetected = true;
    }

    return { traffic: trafficDetected, collision: collisionDetected };
}



function processFrame(frameData)
{
    if (!frameData) { return; }
    if (!frameData.objects) { return; }

    // mark all vehicles as inactive if they were not updated in the current frame
    for (const vehidle of vehicles.values())
    {
        if (vehidle.active)
        {
            vehidle.setActive(false);
        }
    }

    for (const object of frameData.objects)
    {

        if (
            object.classLabel === 'car' ||
            object.classLabel === 'motorcycle' ||
            object.classLabel === 'bus' ||
            object.classLabel === 'truck'
        )
        {

            const closestVehicle = findClosestVehicle(object, vehicles);

            if (closestVehicle)
            {
                closestVehicle.updatePosition(frameData.seconds, object.x, object.y, object.width, object.height);
                vehicles.set(closestVehicle.id, closestVehicle);

            } else
            {

                const newId = object.traceId;
                if (!newId) continue;

                const newVehicle = new Vehicle(newId, object.x, object.y, object.width, object.height);
                vehicles.set(newId, newVehicle);
                vehiclesArray.push(newVehicle);
            }

        }

    }


    return detectCollision(vehicles);
}



function getVehicles(includeInactive = false)
{
    if (includeInactive)
    {
        return vehiclesArray
    }

    // Return only active vehicles
    return vehiclesArray.filter(vehicle => vehicle.active);
}

function resetCollisionDetection()
{
    // clear the vehicles map
    vehicles.clear();
    vehiclesArray = [];
}

export { processFrame, getVehicles, getFlowStatistics, resetCollisionDetection };
