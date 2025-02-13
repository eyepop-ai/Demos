from eyepop import EyePopSdk
from eyepop.worker.worker_types import Pop, InferenceComponent


example_image_path = './example.jpg'
secret_key = "<Your EyePop.ai API key>"

with EyePopSdk.workerEndpoint(secret_key=secret_key) as endpoint:
    endpoint.set_pop(Pop(
        components=[InferenceComponent(
            model='eyepop.person:latest'
        )]
    ))

    result = endpoint.upload(example_image_path).predict()
    print(result)