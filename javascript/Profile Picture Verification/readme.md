## Person Picture Verification

---

### Getting started

- Log into your EyePop account at https://dashboard.eyepop.ai/sign-in
- Create an **API Pop**
- After creating your pop, create or copy your API Key into the config.js file, as well as the Pop's UUID.

### Need a Web Server locally to test?

- Easiest: [Web-based IDE](https://replit.com/)
- Option 1) Python: `python3 -m http.server 9001`
- Option 2) [LiveServer Extension to VS Code](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

Start your web server from within this directory and check out the examples: http://localhost:9001/1_upload_image.html

---

## Overview

This demo works by performing simple image analysis to detect the number of people in a given image.
It scans a profile picture and throws an error when more or less than 1 person is detected in the image.
