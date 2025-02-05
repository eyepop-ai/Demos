# This is a simple example of how to use the EyePop SDK
# to detect text in an image
from eyepop import EyePopSdk

# For pretty printing
import json

# For loading environment variables
import env


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
