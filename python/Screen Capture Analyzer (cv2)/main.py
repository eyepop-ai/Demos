from eyepop import EyePopSdk, Job
from EyePopPlotCV2 import EyePopPlotCV2

import numpy as np
import cv2
from mss import mss
import os

SCREEN_NUMBER = 1
POP_UUID = ""
POP_API_SECRET = ""

def get_config_data():
    """
    Reads and returns the configuration data from the config file which has the following format:
    POP_UUID=
    POP_API_SECRET=
    """
    with open("../config") as file:
        data = file.readlines()
        uuid = data[0].strip().split("=")[1]
        secret = data[1].strip().split("=")[1]
        return uuid, secret



class ScreenCaptureAnalyzer:

    """
    Class for capturing screen and analyzing the captured frames using EyePop API.

    Attributes:
        sct (mss): The mss object for capturing screen.
        monitor (dict): The monitor information for capturing screen.
        result (dict): The result of the prediction from EyePop API.
        frame (numpy.ndarray): The captured frame from the screen.
        ep_cv2_plotter (EyePopPlot): The object for plotting the detected objects on the frame.

    Methods:
        draw_results(): Draws the detected objects on the frame and returns the blended frame.
        capture_screen(): Captures the screen and converts it to a numpy array.
        get_prediction_results(endpoint): Uploads the captured frame to EyePop API and gets the prediction results.
        run(): Runs the screen capture and analysis loop.
    """

    def __init__(self, monitor_id):

        """
        Initializes a new instance of the ScreenCaptureAnalyzer class.

        Args:
            monitor_id (int): The ID of the monitor to capture the screen from.
        """

        self.sct = mss()
        self.monitor = self.sct.monitors[monitor_id]

        self.result = None
        self.frame = None
        self.ep_cv2_plotter = None
        self.temp_file = 'temp.jpg'

    def draw_results(self):

        """
        Draws the detected objects on the frame and returns the blended frame.

        Returns:
            numpy.ndarray: The blended frame with the detected objects.
        """

        if self.result is None:
            
            return self.frame
        
        if "objects" not in self.result:

            return self.frame

        self.ep_cv2_plotter = EyePopPlotCV2(self.frame)

        for obj in self.result['objects']:

            self.ep_cv2_plotter.object(obj)
        
        # Blend the original frame and the frame with objects
        blended_frame = cv2.addWeighted(self.frame, 0.5, self.ep_cv2_plotter.frame, 0.5, 0)

        return blended_frame

    def capture_screen(self):

        """
        Captures the screen and converts it to a numpy array.
        """

        # get the screen shot of the monitor and convert it to a numpy array
        self.frame = self.sct.grab(self.monitor)
        self.frame = np.array(self.frame)

    def get_prediction_results(self, endpoint):

        """
        Uploads the captured frame to EyePop API and gets the prediction results.

        Args:
            endpoint: The EyePop API endpoint.

        Raises:
            Exception: If there is an error uploading the frame or getting the prediction results.
        """

        try:

            cv2.imwrite(self.temp_file, self.frame)
            self.result = endpoint.upload(self.temp_file).predict()

        except Exception as e:

            print ("Error uploading frame or getting prediction results: " + str(e))

    def run(self):

        """
        Runs the screen capture and analysis loop.
        """

        with EyePopSdk.endpoint(pop_id=POP_UUID, secret_key=POP_API_SECRET) as endpoint:

            cv2.namedWindow("screencap", cv2.WINDOW_NORMAL) 

            # infinite loop to capture the screen and send to EyePop API
            while True:
            
                self.capture_screen()

                drawing = self.draw_results()
                
                cv2.imshow('screencap', drawing)

                # if the space key is pressed, upload the image to EyePop API
                if cv2.waitKey(1) & 0xFF == ord(' '):

                    self.get_prediction_results(endpoint)

                # if the window is closed, break the loop and close the window
                if cv2.getWindowProperty('screencap', cv2.WND_PROP_VISIBLE) < 1:

                    break

    def dispose(self):

        """
        Disposes the resources used by the ScreenCaptureAnalyzer.
        """

        self.sct.close()
        cv2.destroyAllWindows()

        if os.path.exists(self.temp_file):

            os.remove(self.temp_file)


POP_UUID, POP_API_SECRET = get_config_data()
screen_capture_analyzer = ScreenCaptureAnalyzer(SCREEN_NUMBER)

try:
    screen_capture_analyzer.run()
finally:
    screen_capture_analyzer.dispose()
