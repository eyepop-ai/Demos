# 🚀 EyePop Python SDK Demo 🚀

![EyePop Demo](https://your-gif-url.gif)

This repository contains a demo of the EyePop Python SDK. The demo captures the screen and uses the EyePop API to analyze the captured frames.

## 📦 Dependencies

- eyepop
- EyePopPlotCV2
- numpy
- cv2
- mss
- os
- tk

## 🏃‍♂️ How to Run

1. Install the required dependencies.
2. Set the `POP_UUID` and `POP_API_SDK` variables with your EyePop API credentials.
3. Set the `SCREEN_NUMBER` variable with the ID of the screen you want to capture.
4. Run the script.

## 📝 Code Overview

The main class in the script is `ScreenCaptureAnalyzer`. This class captures the screen and analyzes the captured frames using the EyePop API.

### 🛠️ Methods

- `__init__(self, monitor_id)`: Initializes a new instance of the ScreenCaptureAnalyzer class.
- `draw_results(self)`: Draws the detected objects on the frame and returns the blended frame.
- `capture_screen(self)`: Captures the screen and converts it to a numpy array.
- `get_prediction_results(self, endpoint)`: Uploads the captured frame to EyePop API and gets the prediction results.
- `run(self)`: Runs the screen capture and analysis loop.
- `dispose(self)`: Disposes the resources used by the ScreenCaptureAnalyzer.

## 🎮 Usage

When you run the script, it starts an infinite loop that captures the screen and displays the captured frame. If you press the space key, it uploads the current frame to the EyePop API and gets the prediction results. The detected objects are then drawn on the frame and the frame is updated. If you close the window, it breaks the loop and disposes the resources used by the ScreenCaptureAnalyzer.
