# This is a simple example of how to use the EyePop SDK 
# to detect text in an image
from eyepop import EyePopSdk
from eyepop.worker.worker_types import Pop, InferenceComponent
from pops import examplePops, findKeypoint, findBiggestPerson, displayKeypoints

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

    biggest_person = findBiggestPerson(filtered_objects)

    print(json.dumps(biggest_person,indent=4))

    if biggest_person:
        # draw circles at the keypoints
        displayKeypoints(biggest_person, plt)

        # Find the left shoulder keypoint
        left_shoulder = findKeypoint(biggest_person,"left shoulder")
        left_wrist = findKeypoint(biggest_person,"left wrist")
        right_shoulder = findKeypoint(biggest_person,"right shoulder")
        right_wrist = findKeypoint(biggest_person,"right wrist")

        if (left_shoulder and left_wrist and left_wrist['y']<left_shoulder['y']) or (right_shoulder and right_wrist and right_wrist['y']<right_shoulder['y']):
             plt.text(0, 50,"Hand Raised.", color='black', fontsize=16)

            
    plt.show()
