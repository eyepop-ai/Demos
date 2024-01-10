## AI Photho Overlay 📷👓

---

### Getting started

- Log into your EyePop account at https://dashboard.eyepop.ai/sign-in
- Create your own **API Pop** and select _Live - People and Common Object_ from the object library
- Check out the **API Info** section of your Pop and copy'n paste the `endpoint` and `Auth Token` into `config.js` of your local copy of this repo.

### Need a Web Server locally to test?

- Easiest: [Web based IDE](https://replit.com/)
- Option 1) Python: `python3 -m http.server 9001`
- Option 2) [LiveServer Extension to VS Code](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

Start your web server from within this directory and check out the examples: http://localhost:9001/upload.html

---

## Overview

[upload.html](./upload.html)

**_Description:_**

In this demo we use the EyePopSDK to place a pair of sunglasses ontop of a person inside of an image by using the simple Low Code Language in this following code block. This will follow the moving pose of any people and anchor to the image the positions of the detected elements.

```
config.Draw = [
    {
        "Type": "posefollow",
        "Targets": ["person"],
        "Anchors": ["right eye", "left eye"],
        "Image": "./fun/sunglasses3.png?raw=true",
        "Scale": 2.6
    },
]
```
