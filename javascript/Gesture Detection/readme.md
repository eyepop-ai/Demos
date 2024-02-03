## 🚀 Projectile Gesture Detection 🚀

<video width="320" height="240" controls>
  <source src="./imgs/spider.github.mp4" type="video/mp4">
</video>

---

### Getting started

- Log into your EyePop account at https://dashboard.eyepop.ai/sign-in
- Create an **API Pop**
- After creating your pop, create or copy your API Key into the config.js file, as well as the Pop's UUID. If the token is left empty, you will be navigated to an authentication workflow.

### Need a Web Server locally to test?

- Easiest: [Web-based IDE](https://replit.com/)
- Option 1) Python: `python3 -m http.server 9001`
- Option 2) [LiveServer Extension to VS Code](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

Start your web server from within the **_parent_** directory and open an HTML file found in this directory.

---

## Overview

Gesture Detection here is done by measuring distances between the 3D points provided by the EyePop SDK. We loop over all prediction data, find any hand points, then organize and compare the labeled joints to detect if a gesture is active.
It's important to note that smoothing of these points will provide a much better user experience and help filter out false positives.

### Spider Demo

This example detects the distance of the index, middle, ring, and pinky fingers to the wrist point. Then, when both middle and ring fingers are closer to the wrist than both index and pinky, the "rock on spider" ( ;-) ) gesture is detected.

### Laser Demo

This example shoots a ray from the base of an index finger to the tip of the finger. From there, we move a cylinder to match this path and a light at the ray collision point. The floating objects also have random normal maps applied which create the neat glistening effect.
