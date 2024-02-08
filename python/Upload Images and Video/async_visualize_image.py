import asyncio
from eyepop import EyePopSdk, Job

from PIL import Image
import matplotlib.pyplot as plt
import tkinter as tk
from tkinter import filedialog
import ctypes
from tkinter import ttk



POP_UUID = ''
POP_API_KEY = ''


def upload_and_plot():
    """
    Uploads a photo and plots it asynchronously.
    """
    file_path = filedialog.askopenfilename()

    if file_path:
        asyncio.run(async_upload_photo(file_path))


async def async_upload_photo(file_path):
    """
    Uploads a photo asynchronously and visualizes the prediction result.

    Args:
        file_path (str): The path to the photo file.

    Returns:
        None
    """

    async def on_ready(job: Job):
        result = await job.predict()
        
        with Image.open(file_path) as image:
            plt.imshow(image)

        plot = EyePopSdk.plot(plt.gca())
        plot.prediction(result)
        plt.show()

    async with EyePopSdk.endpoint(pop_id=POP_UUID, secret_key=POP_API_KEY, is_async=True) as endpoint:
        await endpoint.upload(file_path, on_ready)


def main():
    """
    This function initializes the GUI window, sets the DPI scaling, and creates a button for selecting an image file.
    It also calculates the window size based on the screen resolution and displays the window.
    """
    # Set DPI scaling
    ctypes.windll.shcore.SetProcessDpiAwareness(1)

    root = tk.Tk()
    root.title("Image Upload and Plot")
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()

    width_percentage = 15
    height_percentage = 10

    width = int(screen_width * width_percentage / 100)
    height = int(screen_height * height_percentage / 100)

    root.geometry(f"{width}x{height}")

    button = tk.Button(root, text="Select Image File", command=upload_and_plot)
    button.pack(pady=50)

    root.mainloop()


main()
