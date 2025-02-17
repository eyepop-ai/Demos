from eyepop import EyePopSdk
from eyepop.worker.worker_types import Pop, InferenceComponent
from pops import examplePops
import json

example_image_path = './images/example1.jpg'

with EyePopSdk.workerEndpoint() as endpoint:
    endpoint.set_pop(examplePops["person"])

    result = endpoint.upload(example_image_path).predict()
    print(json.dumps(result, indent=4))
