
import * as THREE from 'https://unpkg.com/three/build/three.module.js';


export default class AnimationManager
{

    constructor(scene)
    {
        this.scene = scene;
        this.mixer = new THREE.AnimationMixer(this.scene);
    }

    playClip(name)
    {
        const clip = THREE.AnimationClip.findByName(this.scene.animations, name);
        const action = this.mixer.clipAction(clip);
        action.play();
    }

    update(deltaTime)
    {
        this.mixer.update(deltaTime);
    }

}
