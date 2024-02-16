import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import { UnrealBloomPass } from 'https://unpkg.com/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'https://unpkg.com/three/examples/jsm/postprocessing/RenderPass.js';
import { EffectComposer } from 'https://unpkg.com/three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'https://unpkg.com/three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'https://unpkg.com/three/examples/jsm/postprocessing/SMAAPass.js';
import { GammaCorrectionShader } from 'https://unpkg.com/three/examples/jsm/shaders/GammaCorrectionShader.js';

export default class RenderManager
{
    constructor(
        canvas,
        videoUrl,
        isWebcam,
        drawParams = {
            showHeatmap: false,
            bgCanvas: null,
            showBloom: false,
            showGammaCorrection: false,
            showCameraInCorner: false,
            showVideo: true,
            bloomParams: {
                strength: 0.5,
                radius: 0.5,
                threshold: 0.5
            },
        })
    {
        THREE.Cache.enabled = true
        this.canvas = canvas;
        this.heatmapPass = null;
        this.copyPass = null;

        this.renderer = null;
        this.finalComposer = null;
        this.time = 0;
        this.heatmapPoints = [];
        this.maxHeatmapPoints = 10000;

        this.showBloom = drawParams.showBloom;
        this.bloomParams = drawParams.bloomParams;
        this.showHeatmap = drawParams.showHeatmap;
        this.showVideo = drawParams.showVideo;
        this.showCameraInCorner = drawParams.showCameraInCorner;
        this.showGammaCorrection = drawParams.showGammaCorrection;

        this.heatmapIntensity = 0.25;

        console.log("RenderManager constructor");


        if (!this.canvas)
        {
            console.error(' ..... Canvas not found. Make sure this element is valid:, ', canvas)
        }

        this.width = 0;
        this.height = 0;

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1);
        // Adjust the camera's frustum planes
        this.camera.left = -1;
        this.camera.right = 1;
        this.camera.top = 1;
        this.camera.bottom = -1;
        this.camera.position.set(0, 0, -10);
        this.camera.lookAt(0, 0, 0);

        this.scene = new THREE.Scene();
        this.video = null;
        this.videoTexture = null;
        this.isReady = false;

        this.gridSpacesX = 25.0;
        this.gridSpacesY = 25.0;
        this.testMaterial = null;

        this.domElement = null;
        this.fullScreen = false;

        if (drawParams.bgCanvas)
        {
            // setup the background canvas, and use it as the video texture
            this.bgCanvas = drawParams.bgCanvas;
            this.videoTexture = new THREE.CanvasTexture(this.bgCanvas);
            this.videoTexture.magFilter = THREE.NearestFilter;
            this.videoTexture.minFilter = THREE.NearestFilter;

            this.setupRenderer();
            this.setupEffectComposer();
            this.onWindowResized();
            this.isReady = true;

            return;
        }

        if (isWebcam)
        {
            // setup the webcam
            this.setupWebCam();
        } else if (videoUrl)
        {
            // setup the video
            this.setupVideo(videoUrl);
        } else
        {
            // no video, just setup the renderer
            this.setupRenderer();
            this.setupEffectComposer();
            this.onWindowResized();
            this.isReady = true;
        }

    }

    toggleFullscreen()
    {
        // toggle fullscreen
        if (this.fullScreen)
        {
            this.domElement.style.position = '';
            this.domElement.style.top = '';
            this.domElement.style.left = '';
            this.domElement.style.width = '';
            this.domElement.style.height = '';

            // if document is in fullscreen
            if (document.fullscreenElement)
            {
                document.exitFullscreen();
            }
        } else
        {
            // make renderer canvas render fullscreen behind other dom elements
            this.domElement.style.position = 'fixed';
            this.domElement.style.top = 0;
            this.domElement.style.left = 0;
            this.domElement.style.width = '100%';
            this.domElement.style.height = '100%';
            this.domElement.style.zIndex = 9999;
            this.domElement.requestFullscreen({ navigationUI: "show" });
        }
        this.fullScreen = !this.fullScreen;
    }

    isLoadedPromise()
    {
        return new Promise((resolve, reject) =>
        {
            const interval = setInterval(() =>
            {
                if (this.isLoaded())
                {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    isLoaded()
    {
        return this.isReady;
    }

    updateHeatmapPoints(points)
    {
        if (!points) return;
        if (!this.heatmapPass) return;

        let heatGrid = new Float32Array(this.gridSpacesX * this.gridSpacesY).fill(0.0);
        let maxHeat = 0;

        // loop through each point, and increment the heatGrid point that it's closest to
        for (let i = 0; i < points.length; i++)
        {
            let gridX = this.gridSpacesX - 1 - Math.floor((0.5 + 0.5 * points[ i ].x) * this.gridSpacesX);
            let gridY = Math.floor((0.5 + 0.5 * points[ i ].y) * this.gridSpacesY);

            heatGrid[ gridX + gridY * this.gridSpacesX ] += 1;

            maxHeat = Math.max(maxHeat, heatGrid[ gridX + gridY * this.gridSpacesX ]);
        }

        maxHeat = Math.max(maxHeat, 1);

        // normalize the heatGrid
        for (let i = 0; i < heatGrid.length; i++)
        {
            heatGrid[ i ] /= maxHeat;
        }

        this.heatmapPass.uniforms.uGridSpacesX.value = this.gridSpacesX;
        this.heatmapPass.uniforms.uGridSpacesY.value = this.gridSpacesY;
        this.heatmapPass.uniforms.uHeatGrid.value = heatGrid;
    }

    getDimensions()
    {
        return {
            width: this.width,
            height: this.height
        }
    }

    getCamera()
    {
        return this.camera;
    }

    getScene()
    {
        return this.scene;
    }

    setupVideo(videoUrl)
    {
        //render the video url to a texture
        this.video = document.createElement('video');
        this.video.playsInline = true;
        this.video.crossOrigin = "Anonymous";
        this.video.loop = true;
        this.video.preload = "auto";
        this.video.autoplay = false;
        this.video.volume = 1;
        this.video.src = videoUrl;
        this.video.load();
        this.video.play();

        const scope = this;


        this.video.addEventListener('loadedmetadata', () =>
        {
            scope.videoTexture = new THREE.VideoTexture(scope.video);
            scope.videoTexture.flipY = false;
            scope.videoTexture.premultiplyAlpha = false;
            scope.videoTexture.crossOrigin = "Anonymous";
            scope.videoTexture.minFilter = THREE.LinearFilter;
            scope.videoTexture.magFilter = THREE.LinearFilter;
            scope.videoTexture.generateMipmaps = false;
            scope.videoTexture.flipY = true;

            scope.width = scope.video.videoWidth;
            scope.height = scope.video.videoHeight;

            scope.setupRenderer();
            scope.setupEffectComposer();
            scope.onWindowResized();
            scope.isReady = true;
        });
    }

    setupWebCam()
    {
        const scope = this;
        this.video = document.getElementById('myLocalVideo');
        this.video.playsInline = true;
        this.video.crossOrigin = "Anonymous";
        this.video.loop = true;
        this.video.preload = "auto";
        this.video.autoplay = true;

        const constraints = {
            audio: false,
            video: {
                facingMode: "user",
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (mediaStream)
            {
                scope.video.srcObject = mediaStream;
                scope.video.onloadedmetadata = function (e)
                {
                    scope.video.play();
                    scope.videoTexture = new THREE.VideoTexture(scope.video);
                    scope.videoTexture.crossOrigin = "Anonymous";
                    scope.videoTexture.minFilter = THREE.LinearFilter;
                    scope.videoTexture.magFilter = THREE.LinearFilter;
                    scope.videoTexture.flipY = false;
                    scope.videoTexture.premultiplyAlpha = false;
                    scope.videoTexture.flipY = true;

                    scope.width = scope.video.videoWidth;
                    scope.height = scope.video.videoHeight;

                    scope.setupRenderer();
                    scope.setupEffectComposer();
                    scope.onWindowResized();

                    scope.isReady = true;

                };
            })
            .catch(function (err) { console.log(err.name + ": " + err.message); });
    }

    pauseVideo()
    {
        if (!this.video) return;
        if (this.video.paused) return;
        this.video.pause();
    }

    playVideo()
    {
        if (!this.video) return;
        if (!this.video.paused) return;

        this.video.play();
    }

    setupRenderer()
    {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
        });

        this.renderer.shadowMap.enabled = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.backgroundColor = new THREE.Color(0x000000);

        // Adjust the camera's frustum planes
        this.camera.left = -1;
        this.camera.right = 1;
        this.camera.top = 1;
        this.camera.bottom = -1;

        // Update the camera's projection matrix
        this.camera.updateProjectionMatrix();

        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;

        if (this.bgCanvas)
        {
            this.width = this.bgCanvas.clientWidth;
            this.height = this.bgCanvas.clientHeight;
        }

        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.domElement = this.renderer.domElement;
    }

    onWindowResized()
    {
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;

        if (this.bgCanvas)
        {
            this.width = this.bgCanvas.clientWidth;
            this.height = this.bgCanvas.clientHeight;
        }

        if (!this.renderer) return;

        this.renderer.setSize(this.width, this.height);

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.finalComposer.setSize(this.width, this.height);

        this.finalComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    reset()
    {
        this.onWindowResized();
        this.setupEffectComposer();
    }

    createPasses()
    {

        // A pass that copies the texture on the bufferCanvas to the main canvas
        // todo: can we stream the video directly to the main canvas?
        this.copyPass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                tImage: { value: this.videoTexture },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }`,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform sampler2D tImage;
                varying vec2 vUv;
                void main() {
                    vec2 uv = vUv;
                    vec4 texelSrc = texture2D( tImage, vUv );
                    vec4 texel = texture2D( tDiffuse, vUv );

                    texel = mix(texelSrc, texel, texel.a);

                    gl_FragColor = texel; // RGBA color

                }`
        });


        // flip screen pass and add small video texture in bottom right corner like the copy pass
        this.cornerCameraPass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                tImage: { value: this.videoTexture },
                uFlip: { value: false },
                uSaturationScalar: { value: this.showBloom ? 0.2 : 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                }`,
            fragmentShader: `
                
                uniform sampler2D tDiffuse;
                uniform sampler2D tImage;
                uniform bool uFlip;
                uniform float uSaturationScalar;
                varying vec2 vUv;
                void main() {
                    vec2 uv = vUv;

                    if(uFlip){
                        uv.x = 1.0 - uv.x;
                    }
                    
                    vec4 texel = texture2D( tDiffuse, uv );

                    // if in the bottom right corner 15 percent of screen height and width, show video scaled down
                    if (uv.x > 0.85 && uv.y < 0.15) {
                        vec2 scaledUv = vec2((uv.x - 0.85) / 0.15, uv.y / 0.15);
                        vec4 texel2 = texture2D(tImage, scaledUv);
                        texel = mix(texel, texel2, 1.0);
                        // make texel darker
                        texel = texel * uSaturationScalar;
                    }

                    gl_FragColor = texel; // RGBA color
                }`
        });

        this.heatmapPass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                uGridSpacesX: { value: this.gridSpacesX },
                uGridSpacesY: { value: this.gridSpacesY },
                uIntensity: { value: 0.5 },
                uHeatGrid: { value: new Array(this.gridSpacesY * this.gridSpacesX).fill(0.5) },
                uShowHeatmap: { value: this.showHeatmap }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader:
                `
                uniform sampler2D tDiffuse;
                uniform float uGridSpacesX;
                uniform float uGridSpacesY;
                uniform float uIntensity;
                uniform float uHeatGrid[${this.gridSpacesY * this.gridSpacesX}];
                uniform bool uShowHeatmap;

                varying vec2 vUv;
                void main() {
                    vec3 video = texture2D(tDiffuse, vUv).rgb;

                    if (!uShowHeatmap) {
                        gl_FragColor = vec4(video, 1);
                        return; 
                    }

                    float gridX = floor(vUv.x * uGridSpacesX);
                    float gridY = floor(vUv.y * uGridSpacesY);
                    
                    float heat = uHeatGrid[ int(gridX + gridY * uGridSpacesX) ];
                    vec3 low = vec3(1, 1, 0); // yellow
                    vec3 high = vec3(1, 0, 0); // red
                    vec3 heatColor = mix(low, high, heat);
                    
                    if (heat > 0.0) {
                        video = mix(video, heatColor, uIntensity);
                    }
                    
                    gl_FragColor = vec4(video, 1);
                }
            `
        });

    }

    // TODO: modularize post effects and split this into multiple functions
    setupEffectComposer()
    {
        const renderScene = new RenderPass(this.scene, this.camera);
        this.createPasses();

        // Add the shader pass to the composer
        this.finalComposer = new EffectComposer(this.renderer);
        this.finalComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.finalComposer.setSize(this.width, this.height);


        this.finalComposer.addPass(renderScene);

        const newSMAAPass = new SMAAPass(this.width / 2, this.height / 2);
        this.finalComposer.addPass(newSMAAPass);

        if (this.showVideo && this.videoTexture)
        {
            this.finalComposer.addPass(this.copyPass);
            this.copyPass.renderToScreen = true;
        }

        if (this.showCameraInCorner)
        {
            this.finalComposer.addPass(this.cornerCameraPass);
        }

        if (this.showBloom)
        {
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), this.bloomParams.intesity, this.bloomParams.radius, this.bloomParams.threshold);
            this.finalComposer.addPass(bloomPass);
        }

        if (this.showHeatmap)
        {
            this.finalComposer.addPass(this.heatmapPass);
        }

        if (this.showGammaCorrection)
        {
            // adds a gamma correction pass
            const gammaCorrection = new ShaderPass(GammaCorrectionShader);
            gammaCorrection.renderToScreen = true;
            this.finalComposer.addPass(gammaCorrection);
        }
    }

    getVideoTime()
    {
        return this.time;
    }

    setTime(time)
    {
        if (!this.video) return;

        if (time < 0) time = 0;
        if (time > this.video.duration) time = this.video.duration;

        this.video.currentTime = time;
    }

    render()
    {
        if (!this.isReady) return;

        if (this.bgCanvas)
        {
            this.videoTexture = new THREE.CanvasTexture(this.bgCanvas);
            this.videoTexture.premultiplyAlpha = false;
        }

        if (this.videoTexture)
        {
            this.copyPass.uniforms.tImage.value = this.videoTexture;
            this.cornerCameraPass.uniforms.tImage.value = this.videoTexture;
            this.heatmapPass.uniforms.uIntensity.value = this.heatmapIntensity;
            this.heatmapPass.uniforms.uShowHeatmap.value = this.showHeatmap;
        }

        if (this.video)
        {
            this.time = this.video.currentTime;
        }

        if (this.finalComposer)
        {
            this.finalComposer.render();
        }

    }

}
