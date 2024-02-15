from PIL import Image
import matplotlib.pyplot as plt
from eyepop import EyePopSdk
import tkinter as tk
from tkinter import filedialog
import ctypes
from tkinter import ttk



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

    if file_path:
        
        result = None

        with EyePopSdk.endpoint(pop_id=POP_UUID, secret_key=POP_API_SECRET) as endpoint:
            result = endpoint.upload(file_path).predict()

        with Image.open(file_path) as image:
            plt.imshow(image)

        plot = EyePopSdk.plot(plt.gca())
        plot.prediction(result)
        plt.show()



def main():
    """
    This function initializes the GUI window, sets the DPI scaling, and creates a button for selecting an image file.
    It also calculates the window size based on the screen resolution and displays the window.
    """

    POP_UUID, POP_API_SECRET = get_config_data()

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
