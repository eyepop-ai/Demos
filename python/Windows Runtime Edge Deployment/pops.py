from eyepop.worker.worker_types import (
    Pop, InferenceComponent, PopForward, PopForwardOperator, ForwardOperatorType,
    PopCrop, ContourFinderComponent, ContourType, CropForward, FullForward
)

examplePops = {
    "person": Pop(
        components=[
            InferenceComponent(
                model='eyepop.person:latest'
            )
        ]
    ),

    "person2D": Pop(
        components=[
            InferenceComponent(
                model='eyepop.person:latest',
                categoryName="person",
                forward=CropForward(
                    maxItems=128,
                    targets=[
                        InferenceComponent(
                            model='eyepop.person.2d-body-points:latest',
                            categoryName="2d-body-points",
                            confidenceThreshold=0.25
                        )
                    ]
                )
            )
        ]
    ),

    "eye glasses": Pop(
        components=[
            InferenceComponent(
                modelUuid='067ace046c3577208000eb40f14a6f3a'
            )
        ]
    ),

    "eye glasses + person": Pop(
        components=[
            InferenceComponent(
                modelUuid='067ace046c3577208000eb40f14a6f3a'
            ),
            InferenceComponent(
                model='eyepop.person:latest'
            )
        ]
    ),

    "eye glasses + person2D": Pop(
        components=[
            InferenceComponent(
                modelUuid='067ace046c3577208000eb40f14a6f3a'
            ),
            InferenceComponent(
                model='eyepop.person:latest',
                categoryName="person",
                forward=CropForward(
                    maxItems=128,
                    targets=[
                        InferenceComponent(
                            model='eyepop.person.2d-body-points:latest',
                            categoryName="2d-body-points",
                            confidenceThreshold=0.25
                        )
                    ]
                )
            )
        ]
    ),

}


def findKeypoint(biggest_person, classLabel):
    if biggest_person:
        if "keyPoints" in biggest_person and isinstance(biggest_person["keyPoints"], list) and len(biggest_person["keyPoints"]) > 0:
            if "points" in biggest_person["keyPoints"][0] and isinstance(biggest_person["keyPoints"][0]["points"], list):
                for keypoint in biggest_person["keyPoints"][0]['points']:
                    if keypoint.get("classLabel") == classLabel:
                        return keypoint  # Return the found keypoint
    return None  # Return None if not found

def findBiggestPerson(predictions):
    biggest_person = None
    biggest_person_area = 0
    for obj in predictions:
        if obj["classLabel"] == "person":
            area = obj["width"] * obj["height"]
            if area > biggest_person_area:
                biggest_person = obj
                biggest_person_area = area
    return biggest_person

def displayKeypoints(biggest_person, plt):
    if "keyPoints" in biggest_person and isinstance(biggest_person["keyPoints"], list) and len(biggest_person["keyPoints"]) > 0:
        if "points" in biggest_person["keyPoints"][0] and isinstance(biggest_person["keyPoints"][0]["points"], list):
            for keypoint in biggest_person["keyPoints"][0]['points']:
                plt.plot(keypoint["x"], keypoint["y"], 'o', markerfacecolor='lightblue', markeredgecolor='white')
                # print classLabel next to circles
                plt.text(keypoint["x"], keypoint["y"], keypoint["classLabel"], color='white', fontsize=8)
