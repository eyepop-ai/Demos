## 🎥 Real-time 3D Motion Capture Demo 🎥

<video width="320" height="240" controls>
  <source src="./imgs/mocap.mashup.github.mp4" type="video/mp4">
</video>

---

### Getting started

- Sign up for your EyePop account at https://dashboard.eyepop.ai/auth/sign-up
- Create your own **API Pop** and select a model with 3D pose data from the object library
- After creating your pop, create or copy your API Key into the config.js file, as well as the Pop's UUID. If token is left empty, you will be navigated to an authentication workflow.
- Edit the model.js file to change the 3d model file.

### Need a Web Server locally to test?

- Easiest: [Web based IDE](https://replit.com/)
- Option 1) Python: `python3 -m http.server 9001`
- Option 2) [LiveServer Extension to VS Code](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

Start your web server from within the **_parent_** directory and check out the examples: http://localhost:9001/1_upload_image.html

---

## Overview

The basic setup we have in this demo is to retrieve prediction data from the EyePop.ai SDK then pass that data into a 3D rendered scene controled by Three.js. From there, we handle the real-time 3D motion capture in the `1_motion_capture.js` file, finding all pose prediction data, calculating a mapping of pose points to mixamorig bones and a corresponding rotation. It's important to note that the bones are sometimes arbritrarily rotated, so we must store this rotation, make our movement, and then apply back our original rotation - on both child and parent bones.
To add more bone support, simply find the corresponding pose points to a bone then add that relationship to the bones map at the top of the file!

Note: Our HTML contains a background canvas and video element - this will likely change very soon as these demos are continued to be built up
