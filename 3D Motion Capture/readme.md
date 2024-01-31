## 🎥 Real-time 3D Motion Capture Demo 🎥

<video width="320" height="240" controls>
  <source src="./imgs/mocap.mashup.github.mp4" type="video/mp4">
</video>

---

### Getting started

- Log into your EyePop account at https://dashboard.eyepop.ai/sign-in
- Create your own **API Pop** and select a model with 3D pose data from the object library
- After creating your pop, create or copy your API Key into the config.js file, as well as the Pop's UUID.

### Need a Web Server locally to test?

- Easiest: [Web based IDE](https://replit.com/)
- Option 1) Python: `python3 -m http.server 9001`
- Option 2) [LiveServer Extension to VS Code](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

Start your web server from within the **_parent_** directory and check out the examples: http://localhost:9001/1_upload_image.html

---

## Overview

<img src="./imgs/.gif"  width="75%"/>

The basic setup we have in this demo is to retrieve prediction data from the EyePop.ai SDK then pass that data into a 3D rendered scene controled by Three.js. From there, we handle the real-time 3D motion capture in the `1_motion_capture.js` file, finding all pose prediction data, calculating a mapping of pose points to mixamorig bones and a corresponding rotation. It's important to note that the bones are sometimes arbritrarily rotated, so we must store this rotation, make our movement, and then apply back our original rotation - on both child and parent bones.
To add more bone support, simply find the corresponding pose points to a bone then add that relationship to the bones map at the top of the file!

Note: Our HTML contains a background canvas and video element - this will likely change very soon as these demos are continued to be built up

The majority of this code can be found in the [`develop documentation`](https://docs.google.com/document/d/1Bww57Zfn4csWAebSh-xSDa6c4aJ-l1RgFbSgqbew9S0/edit#heading=h.bxxeegbkyqlg).
