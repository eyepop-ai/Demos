import asyncio
from eyepop import EyePopSdk, Job

from PIL import Image
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import tkinter as tk
from tkinter import filedialog
import ctypes
from tkinter import ttk
import cv2
import threading
from tkinter import filedialog
import time

POP_UUID, POP_API_SECRET = '', ''

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



def upload_and_plot():
    """
    Uploads a photo and plots it asynchronously.
    """
    file_path = filedialog.askopenfilename()

    print("File Upload Callback Triggered ", file_path)
    if not file_path:
        return

    frames = upload_video(file_path)

    # show the frames of the cv2 extracted video inside the matplotlib plot
    fig, ax = plt.subplots()
    plot = EyePopSdk.plot(ax)

    # Set the aspect ratio of the plot to 'auto'
    ax.set_aspect('auto')

    # Adjust the plot margins to fit the video frames
    plt.subplots_adjust(left=0, right=1, bottom=0, top=1)

    plt.ion()

    for i in range(len(frames)):
        ax.clear()

        frame = frames[i]
        ax.imshow(cv2.cvtColor(frame["frame"], cv2.COLOR_BGR2RGB))
        plot.prediction(frame["prediction"])        
        plt.pause(0.01)

        # if user closes the plot, stop the loop
        if not plt.fignum_exists(1):
            break

    # Show the plot
    plt.ioff()
    plt.show()

def upload_video(file_path):
    """
    Uploads a video file to EyePopSdk endpoint and visualizes the predictions.

    Args:
        file_path (str): The path to the video file.

    Returns:
        frames (list): A list of frames from the video.
    """
    predictions = []
    frames = []
    with EyePopSdk.endpoint(pop_id=POP_UUID, secret_key=POP_API_SECRET) as endpoint:
        print("End point started ", file_path)
        job = endpoint.upload(file_path)
        
        while result := job.predict():
            
            if result is not None and "seconds" in result:

                print('Getting frame predicting... ',  result['seconds'])
                predictions.append(result)

    # open the video file and extract the frames
    cap = cv2.VideoCapture(file_path)

    while True:
        ret, frame = cap.read()

        if not ret:
            break
        
        # get closest prediction to the current frame time by comparing prediction.seconds to the frame time in a for loop
        closest_prediction = None
        closest_prediction_diff = None
        
        for prediction in predictions:

            if "seconds" not in prediction:
                continue
            
            diff = abs(prediction['seconds'] - cap.get(cv2.CAP_PROP_POS_MSEC) / 1000)
            if closest_prediction is None or diff < closest_prediction_diff:
                closest_prediction = prediction
                closest_prediction_diff = diff

        print("Extracting video frame: ", closest_prediction['seconds'])

        frames.append({"frame": frame, "prediction": closest_prediction})

    cap.release()
    
    return frames

def main():
    """
    This function initializes the GUI window, sets the DPI scaling, and creates a button for selecting an image file.
    It also calculates the window size based on the screen resolution and displays the window.
    """    
    POP_UUID, POP_API_SECRET = get_config_data()
    ctypes.windll.shcore.SetProcessDpiAwareness(1)

    root = tk.Tk()
    root.title("Video Upload and Plot")
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()

    width_percentage = 15
    height_percentage = 10

    width = int(screen_width * width_percentage / 100)
    height = int(screen_height * height_percentage / 100)

    root.geometry(f"{width}x{height}")

    button = tk.Button(root, text="Select Video File", command=upload_and_plot)
    button.pack(pady=50)

    root.mainloop()


main()
