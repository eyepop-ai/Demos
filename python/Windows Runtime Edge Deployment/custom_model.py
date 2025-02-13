from eyepop import EyePopSdk
from eyepop.worker.worker_types import Pop, InferenceComponent


example_image_path = './example.jpg'

with EyePopSdk.workerEndpoint() as endpoint:
    endpoint.set_pop(Pop(
        components=[InferenceComponent(
            modelUuid='<Your model UUID>'
        )]
    ))

    result = endpoint.upload(example_image_path).predict()
    print(result)