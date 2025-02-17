# This is a simple example of how to use the EyePop SDK 
# to detect text in an image
from eyepop import EyePopSdk
from eyepop.worker.worker_types import Pop, InferenceComponent
from pops import examplePops, findBiggestPerson,displayKeypoints

# For pretty printing
import json

# For displaying images
from PIL import Image
import matplotlib.pyplot as plt

example_image_path = './images/example1.jpg'

with EyePopSdk.workerEndpoint() as endpoint:
    endpoint.set_pop(examplePops["person2D"])

    result = endpoint.upload(example_image_path).predict()
    print(json.dumps(result, indent=4))

    filtered_objects = [obj for obj in result["objects"] if obj["confidence"] > 0.0]
    filtered_result = {**result, "objects": filtered_objects}

    with Image.open(example_image_path) as image:
        plt.imshow(image)

    plot = EyePopSdk.plot(plt.gca())
    plot.prediction(filtered_result)

    # loop through the objects and find the biggest person based on attributes width * height
    biggest_person = findBiggestPerson(filtered_objects)

    print(json.dumps(biggest_person,indent=4))

    if biggest_person:
        # draw circles at the keypoints
        displayKeypoints(biggest_person, plt)

    plt.show()
