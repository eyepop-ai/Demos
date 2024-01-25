import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import Stats from 'https://unpkg.com/three/examples/jsm/libs/stats.module.js';
import { GUI } from 'https://unpkg.com/dat.gui/build/dat.gui.module.js';
import RenderManager from './managers/RenderManager.js';
import PredictionDataManager from './managers/PredictionDataManager.js';
import SceneManager from './managers/SceneManager.js';
import AnimationManager from './managers/AnimationManager.js';
import CameraControls from 'https://unpkg.com/camera-controls/dist/camera-controls.module.js';

CameraControls.install({ THREE: THREE });


// TODO: 
//   - Add workflow for dispose and reset of objects


export default class ThirdEyePop
{
    constructor({
        DEBUG = true,
        canvas = null,
        videoUrl = null,
        predictionData = [],
        frameBufferSize = 1,
        drawParams: {
            bgCanvas = null,
            showHeatmap = false,
            showPoint = false,
            showPath = false,
            showBounds = false,
            showTraceId = false,
            showPose = false,
            showFace = false,
            showHands = false,
            showCameraInCorner = false,
            showBloom = false,
            showGammaCorrection = false,
            bloomParams = {
                strength: 1,
                radius: .5,
                threshold: 0.01,
            }
        }
    })
    {
        console.log("ThirdEyePop constructor");
        console.log("canvas: ", canvas);

        // ///////////////////// VARIABLES /////////////////////////////
        let scope = this;
        let renderManager = null;
        let predictionDataManager = null;
        let sceneManager = null;
        let animationManager = null;
        let cameraControls = null;

        // render automatically, or manually
        let autoRender = true;

        // flag to reset the canvas when the window size changes
        let canvasNeedsReset = false

        // stats for debugging
        let stats = null;

        let isWebcam = videoUrl == "webcam";
        let videoTime = 0;
        let pause = false;
        // ///////////////////// END VARIABLES /////////////////////////////

        window.DEBUG_thirdEyePop = {
            pathDistanceThreshold: 0.1,
            showFootTraffic: true,
        };

        // ///////////////////// BODY /////////////////////////////
        async function setup()
        {

            await initManagers();
            initEventListeners();

            DEBUG && setupDebuggingTools();
            autoRender && render();

        }

        async function initManagers()
        {
            renderManager = new RenderManager(
                canvas,
                videoUrl,
                isWebcam,
                {
                    showCameraInCorner: showCameraInCorner,
                    showHeatmap: showHeatmap,
                    bgCanvas: bgCanvas,
                    showBloom,
                    showGammaCorrection,
                    bloomParams,
                }
            );

            predictionDataManager = new PredictionDataManager(predictionData, frameBufferSize);

            await renderManager.isLoadedPromise();

            sceneManager = new SceneManager(
                renderManager.getScene(),
                renderManager.getCamera(),
                renderManager.getDimensions(),
                {
                    showPoint,
                    showPath,
                    showBounds,
                    showPose,
                    showFace,
                    showTraceId,
                    showHands,
                });

            animationManager = new AnimationManager(renderManager.getScene());

            cameraControls = new CameraControls(
                renderManager.getCamera(),
                renderManager.renderer.domElement
            );

            cameraControls.saveState();

            window.addEventListener('keydown', event =>
            {
                if (event.key == "Escape")
                {
                    cameraControls.reset(true);
                } else if (event.key == "f")
                {
                    renderManager.toggleFullscreen();
                }
            });

        }

        function initEventListeners()
        {

            window.addEventListener('keydown', event =>
            {
                if (event.key == "ArrowLeft")
                {
                    console.log("Skip Backwards 1s");
                    renderManager.setTime(renderManager.getVideoTime() - 1);
                } else if (event.key == "ArrowRight")
                {
                    console.log("Skip Forwards 1s");
                    renderManager.setTime(renderManager.getVideoTime() + 1);
                } else if (event.key == " ")
                {
                    pause = !pause;

                    if (pause)
                    {
                        renderManager.pauseVideo();
                    } else
                    {
                        renderManager.playVideo();
                    }
                }
                renderManager.render();
            });

            let resizeTimeout;
            window.addEventListener(
                'resize',
                () =>
                {
                    // Resetting in this callback created a memory leak, instancing multiple scenes in the background.
                    //   A flag fixes this.
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(() =>
                    {
                        canvasNeedsReset = true;
                    }, 100)
                },
                true
            );

        }

        function setupDebuggingTools()
        {
            if (!DEBUG) return;


            function addScript(src)
            {
                var s = document.createElement('script')
                s.setAttribute('src', src)
                s.async = true
                document.body.appendChild(s)
            };

            addScript(
                'https://markknol.github.io/console-log-viewer/console-log-viewer.js?align=bottom?minimized=true?closed=true'
            );
            stats = new Stats();
            stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            document.body.appendChild(stats.dom);
            stats.dom.style.display = 'none';


            const gui = new GUI({ autoPlace: false, closed: false });
            const canvasParent = document.getElementById('canvasParent');

            // on hover of the canvas, show the gui and stats panel
            canvasParent.addEventListener('mouseenter', () =>
            {
                gui.domElement.style.display = 'block';
                stats.dom.style.display = 'block';
            });

            // on mouse leave of the canvas, hide the gui and stats panel
            canvasParent.addEventListener('mouseleave', () =>
            {
                gui.domElement.style.display = 'none';
                stats.dom.style.display = 'none';
            });

            // add it as the first child of the canvas parent div
            canvasParent.insertBefore(gui.domElement, canvasParent.firstChild);

            // make this gui render in the top right of the canvas parent div using bootstrap classes
            gui.domElement.classList.add('position-absolute', 'align-self-start', 'z-3');

            var playObj = { Play: function () { pause = false; renderManager.playVideo(); renderManager.render(); } };
            var pauseObj = { Pause: function () { pause = true; renderManager.pauseVideo(); renderManager.render(); } };

            if (!isWebcam && videoUrl)
            {
                gui.add(renderManager.video, 'currentTime', 0, renderManager.video.duration).name('Video Time').listen();
                gui.add(playObj, 'Play');
                gui.add(pauseObj, 'Pause');
            }

            gui.add(window.DEBUG_thirdEyePop, 'pathDistanceThreshold', 0, 1)
                .name('Path Distance Threshold')
                .onChange(function (value) { renderManager.render(); });

            gui.add(renderManager, 'heatmapIntensity', 0, 1)
                .name('Heatmap Opacity')
                .onChange(function (value) { renderManager.render(); });
            gui.add(renderManager, 'showHeatmap')
                .name('Show Heatmap')
                .onChange(function (value) { renderManager.render(); });
            gui.add(window.DEBUG_thirdEyePop, 'showFootTraffic')
                .name('Track Foot Position')
                .onChange(function (value) { renderManager.render(); });

            gui.add(sceneManager, 'showPoint')
                .name('Show Center Sphere')
                .onChange(function (value) { sceneManager.toggleVisibility('point'); renderManager.render(); });
            gui.add(sceneManager, 'showPath')
                .name('Show Path Lines')
                .onChange(function (value) { sceneManager.toggleVisibility('path'); renderManager.render(); });
            gui.add(sceneManager, 'showBounds')
                .name('Show Bounds')
                .onChange(function (value) { sceneManager.toggleVisibility('bounds'); renderManager.render(); });
            gui.add(sceneManager, 'showTraceId')
                .name('Show People ID')
                .onChange(function (value) { sceneManager.toggleVisibility('traceId'); renderManager.render(); });
            gui.add(sceneManager, 'showPose')
                .name('Show Pose')
                .onChange(function (value) { sceneManager.toggleVisibility('pose'); renderManager.render(); });
            gui.add(sceneManager, 'showFace')
                .name('Show Face')
                .onChange(function (value) { sceneManager.toggleVisibility('face'); renderManager.render(); });
            gui.add(sceneManager, 'showHands')
                .name('Show Hands')
                .onChange(function (value) { sceneManager.toggleVisibility('hands'); renderManager.render(); });
        }

        function bufferVideo()
        {
            if (!videoUrl) return;
            if (isWebcam) return;
            // If the latest prediction datais more than 1 seconds away from the current frame
            // or if the last frame videoTime is greater than the video videoTime
            // then we need to pause and wait for more prediction frames

            const currentFrameTime = predictionDataManager.getCurrentFrameTime();
            const onlyHaveOldFrames = Math.abs(currentFrameTime - videoTime) > 5;
            const needsMoreFrames = predictionDataManager.getLastFrameTime() < videoTime;
            const videoPlaying = renderManager.video.duration <= videoTime - 1;


            if (videoPlaying && needsMoreFrames || onlyHaveOldFrames)
            {
                renderManager.pauseVideo();
            } else
            {
                renderManager.playVideo();
            }

        }


        function resetCanvas()
        {

            if (!canvasNeedsReset) return;
            if (!renderManager) return;

            canvasNeedsReset = false;
            renderManager.reset();

        }

        function getPercentAnalyzed()
        {
            const currentFrameTime = predictionDataManager.getLastFrameTime();
            const percentLoaded = currentFrameTime / renderManager.video.duration;
            return (percentLoaded * 100).toFixed(0);
        }



        // Main loop
        function render()
        {
            if (pause || !predictionDataManager.hasPredictionData())
            {
                renderManager.render();
                autoRender && requestAnimationFrame(render);
                return;
            }

            DEBUG && stats.begin();


            videoTime = renderManager.getVideoTime();

            // This is where we handle the rendering, including video playback
            renderManager.render();

            if (!predictionDataManager.setCurrentFrame(videoTime))
            {
                autoRender && requestAnimationFrame(render);
                return;
            }

            // This is where we draw and manage meshes
            sceneManager.update(predictionDataManager.getCurrentFrame());

            // Now we update the heatmap with the new path points
            showHeatmap && renderManager.updateHeatmapPoints(sceneManager.getAllPathPoints());

            cameraControls && cameraControls.update(.01);

            // We buffer video if we need more prediction frames
            bufferVideo();

            // We also reset the canvas when window size changes
            resetCanvas();


            scope.onUpdate && scope.onUpdate();
            DEBUG && stats.end();
            autoRender && requestAnimationFrame(render);

        }

        function pushPredictionData(predictionData)
        {
            predictionDataManager.pushPredictionData(predictionData);
        }

        function popPredictionData()
        {
            predictionDataManager.popPredictionData();
        }

        function getPredictionData()
        {
            return predictionDataManager.getPredictionData();
        }

        function getScene()
        {
            return sceneManager.getScene();
        }

        function getCamera()
        {
            return renderManager.getCamera();
        }


        function getRenderer()
        {
            return renderManager.renderer;
        }

        function getActivePeople()
        {
            return sceneManager.activePeople;
        }

        // //////////////////// end BODY /////////////////////////////


        // //////////////////// API /////////////////////////////

        scope.setup = setup;
        scope.render = render;
        scope.getPercentAnalyzed = getPercentAnalyzed;
        scope.pushPredictionData = pushPredictionData;
        scope.popPredictionData = popPredictionData;
        scope.getPredictionData = getPredictionData;
        scope.onUpdate = null;
        scope.getControls = () => cameraControls;
        scope.getScene = getScene;
        scope.getCamera = getCamera;
        scope.getRenderer = getRenderer;
        scope.getActivePeople = getActivePeople;


        // //////////////////// end API /////////////////////////////

    }
}

