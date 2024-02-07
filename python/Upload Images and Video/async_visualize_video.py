import asyncio
from eyepop import EyePopSdk, Job

from PIL import Image
import matplotlib.pyplot as plt
import tkinter as tk
from tkinter import filedialog
import ctypes
from tkinter import ttk
import cv2
import threading
from tkinter import filedialog

POP_UUID = """YOUR POP UUID"""
POP_API_KEY = """YOUR POP API KEY"""



def upload_and_plot():
    """
    Uploads a photo and plots it asynchronously.
    """
    file_path = filedialog.askopenfilename()

    print("File Upload Callback Triggered ", file_path)
    
    if file_path:
        asyncio.run(async_upload_video(file_path))
        


async def async_upload_video(file_path):
    """
    Uploads a video file to EyePopSdk endpoint and visualizes the predictions.

    Args:
        file_path (str): The path to the video file.

    Returns:
        None
    """

    async def on_ready(job: Job):
        """
        Callback function called when the video is ready to be played.

        Args:
            job (Job): The job object representing the video processing job.

        Returns:
            None
        """
        print("Playing video: ", file_path)
        cap = cv2.VideoCapture(file_path)
        
        plt.show()
        plot = EyePopSdk.plot(plt.gca())

        while result := await job.predict():
            ret, frame = cap.read()

            print(result)

            plt.imshow(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            plot.prediction(result)
        
        cap.release()

    async with EyePopSdk.endpoint(pop_id=POP_UUID, secret_key=POP_API_KEY, is_async=True) as endpoint:

        print("End point started ", file_path)
        await endpoint.upload(file_path, on_ready)
        print("End point finished ", file_path)


def main():
    
    """
    This function initializes the GUI window, sets the DPI scaling, and creates a button for selecting an image file.
    It also calculates the window size based on the screen resolution and displays the window.
    """
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
