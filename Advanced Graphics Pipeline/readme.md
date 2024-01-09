## Advanged Graphics Pipeline

### Quick Start

To get started, run your local server from the root directory of this project **not** the Advanced Graphics Pipeline folder.

This documentation assumes you're up and running with the previous demos. Please refer to the `Getting started` section in the [`AI CDN - Computer Vision Endpoint & UGC Ruleset\readme.md`](../AI%20CDN%20-%20Computer%20Vision%20Endpoint%20%26%20UGC%20Ruleset/readme.md) folder to get started.

---

### Overview

<img src="./imgs/readme_example_heatmap.gif" />

In this documentation, we'll talk about the basic architecture choices to allow for advanced graphics drawing with the EyePopSDK.
To get started let's dive into the [`1-heatmap_shoppers.html`](./1-heatmap_shoppers.html) demo.
Our html contains a background canvas and video element and the main script components are in:

- `run()`: Starts the drawing loop
- `save()`: Saves the prediction data to a json data file
- `load()`: Loads the saved json data file

The majority of this code can be found in the [`develop documentation`](https://docs.google.com/document/d/1Bww57Zfn4csWAebSh-xSDa6c4aJ-l1RgFbSgqbew9S0/edit#heading=h.bxxeegbkyqlg) so next lets dive into the specifics of the Three.js setup.

---

## Advanced Graphics Architecture Overview

This project uses the [`../util/ThirdEyePop.js`]('../utils/ThirdEyePop.js') framework to handle our Three.js setup.

Features:

- Display responsive
- On Hover of Canvas Shows Controls

`../util/ThirdEyePop.js`

Description:

This is the main utility class, it handles rendering the scene, moving meshes to match the prediction data, drawing post effects, including heatmaps, and more.

**API**

- `setup()`: Initializes the renderer and mesh managers
- `getPercentAnalyzed()`: Returns a 0-100 integer percentage of the prediction data loaded.
- `render()`: Runs the render loop manually, automatically renders otherwise
- `pushFrameData(frameData)`: Takes prediction data and stores it to an internal stack.
- `popFrameData()`: Pops one frame off the stack with `frameData.shift()`.
- `getFrameData()`: Gets all the prediction frame data.

`managers/SceneManager.js`

The class that builds and manages adding meshes. Currently handles drawing center points, person paths, person bounds, person trace ids, and person poses.

`managers/RenderManager.js`
