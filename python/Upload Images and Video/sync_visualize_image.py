from PIL import Image
import matplotlib.pyplot as plt
from eyepop import EyePopSdk
import tkinter as tk
from tkinter import filedialog
import ctypes
from tkinter import ttk



POP_UUID = """YOUR POP UUID"""
POP_API_KEY = """YOUR POP API KEY"""


def upload_and_plot():
    
    file_path = filedialog.askopenfilename()
    
    if file_path:

        with EyePopSdk.endpoint(pop_id=POP_UUID, secret_key=POP_API_KEY) as endpoint:
            result = endpoint.upload(file_path).predict()


            if result is None:
                print("No results found for this image.")


            with Image.open(file_path) as image:
                plt.imshow(image)

            plot = EyePopSdk.plot(plt.gca())
            plot.prediction(result)
            plt.show()


import ctypes
import tkinter as tk

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
