## 🚀 Projectile Gesture Detection 🚀

<video src="./imgs/spider.github.mp4" controls></video>

---

### Getting started

- Log into your EyePop account at https://dashboard.eyepop.ai/sign-in
- Create your own **API Pop** and select a model with 3D body points from the object library
- Create an API Key or copy your prviously made API key into the config file, along with the UUID of your Pop.

### Need a Web Server locally to test?

- Easiest: [Web based IDE](https://replit.com/)
- Option 1) Python: `python3 -m http.server 9001`
- Option 2) [LiveServer Extension to VS Code](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

Start your web server from within the **_parent_** directory and open an html file found in this directory.

---

## Overview

Gesture Detection here is done by measuring distances between the 3D points provided by the EeyPop SDK. We loop over all prediction data, find any hand points, then organize, and compare the labeled joints to detect if a gesture is active.
It's important to note that smoothing of these points will provide a much better user experience and help filter out false-positives.
