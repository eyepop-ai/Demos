# This is a simple example of how to use the EyePop SDK 
# to detect text in an image
from eyepop import EyePopSdk

# For pretty printing
import json

# For loading environment variables
import env

# For displaying images
from PIL import Image
import matplotlib.pyplot as plt

POP_ID = env.EYEPOP_POP_ID
SECRET_KEY = env.EYEPOP_SECRET_KEY

example_image_path = './images/text_example1.jpg'
# example_image_path = './images/text_example2.jpg'

with EyePopSdk.workerEndpoint(
    pop_id=POP_ID,
    secret_key=SECRET_KEY
) as endpoint:

    result = endpoint.upload(example_image_path).predict()

    print(json.dumps(result, indent=4))

    filtered_objects = [obj for obj in result["objects"] if obj["confidence"] > 0.0]
    filtered_result = {**result, "objects": filtered_objects}

    with Image.open(example_image_path) as image:
        plt.imshow(image)

    plot = EyePopSdk.plot(plt.gca())
    plot.prediction(filtered_result)

    if filtered_result["objects"]:
        text_to_display = filtered_result["objects"][0]["texts"][0]["text"]
        print("\n\nFOUND TEXT: \n" + text_to_display)
        plt.text(0, 0, text_to_display, fontsize=40, color='blue', bbox=dict(facecolor='white', alpha=1))

    plt.show()
