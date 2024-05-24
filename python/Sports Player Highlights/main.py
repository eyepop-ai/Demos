from eyepop import EyePopSdk

import os
import asyncio
import logging
import time
import person_tracker as pt
import json
import argparse as ap

import movie_maker as mm
import eyepop_manager as em


def main(video_file_path: str, target_jersey_number: str, analyze=False, smoothing=20, draw_bounds=False, debug=False):

    def upload_video(video_path: str):
        #
        #  0. Obtain the EyePop inference data from the video
        #
        if analyze:
            print("Analyzing video")
            em.get_inference_data(video_path)

        # The PersonTracker class is used to track people in the video
        person_tracker = pt.PersonTracker(smoothing=smoothing)

        time.sleep(1)

        # read the data.json files which contains the results of the eyepop inference
        json_data = open("data.json", "r")
        json_data = json.load(json_data)

        #
        #  1. iterate through the eyepop results and add the people to the person tracker
        #
        source_width = 0
        source_height = 0
        for result in json_data:

            source_width = result['source_width']
            source_height = result['source_height']

            sports_ball_location = {
                'x': -1, 'y': -1, 'width': -1, 'height': -1
            }

            # skip any empty results
            if 'objects' not in result:
                continue

            # iterate through the people in the video
            for obj in result['objects']:

                if obj['classLabel'] != 'person':
                    continue

                # Out primary data points for the players
                ball_distance = -1
                labels = []
                trace_id = None

                # grab the labels from the person if it exists
                if 'objects' in obj:
                    for child in obj['objects']:
                        if child['classLabel'] == 'text' and 'labels' in child and len(child['labels']) > 0:
                            # flattens the labels objects into a list of strings from child['labels'][i]['label]
                            child_labels = [label['label']
                                            for label in child['labels']]
                            labels.extend(child_labels)

                # grab the trace id from the person if it exists
                if 'traceId' in obj:
                    trace_id = obj['traceId']

                # expand the bounds of the person to contain the sports ball location
                if sports_ball_location['x'] != -1:

                    # Calculate new bounding box coordinates and dimensions
                    new_min_x = min(obj['x'], sports_ball_location['x'])
                    new_max_x = max(obj['x'] + obj['width'],
                                    sports_ball_location['x'] + sports_ball_location['width'])
                    new_min_y = min(obj['y'], sports_ball_location['y'])
                    new_max_y = max(obj['y'] + obj['height'],
                                    sports_ball_location['y'] + sports_ball_location['height'])

                    obj['x'] = new_min_x
                    obj['y'] = new_min_y
                    obj['width'] = new_max_x - new_min_x
                    obj['height'] = new_max_y - new_min_y

                # Calculate the normalized distance between the person and the ball
                if sports_ball_location['x'] != -1:
                    # Calculate normalized center coordinates of the sports ball
                    x1 = (sports_ball_location['x'] +
                          (sports_ball_location['width'] / 2)) / source_width
                    y1 = (sports_ball_location['y'] +
                          (sports_ball_location['height'] / 2)) / source_height

                    # Calculate normalized center coordinates of the object (person)
                    x2 = (obj['x'] + (obj['width'] / 2)) / source_width
                    y2 = (obj['y'] + (obj['height'] / 2)) / source_height

                    # Euclidean distance between the two normalized points
                    ball_distance = ((x1 - x2)**2 + (y1 - y2)**2)**0.5

                # if there is no trace id, we ignore the person
                if (trace_id == None and labels == []):
                    continue

                # add the person to the person tracker
                person_tracker.add_person(
                    labels=labels,
                    trace_id=trace_id,
                    frame_time=result['seconds'],
                    bounds=[obj['x'], obj['y'],
                            obj['width'], obj['height']]
                )

        # filter and consolidate the people in the person tracker
        person_tracker.filter_map(source_width, source_height, threshold=2)

        if (debug):
            # print all the keys in the person tracker
            for key in person_tracker.people.keys():
                if len(person_tracker.people[key]['seconds']) > 30:
                    print('Player found:', key,  ' frames detected: ',
                          len(person_tracker.people[key]['seconds']))
            return

        #
        #   2. create the output videos
        #
        for key in person_tracker.people.keys():
            person = person_tracker.people[key]

            if target_jersey_number and target_jersey_number != key:
                continue

            # if the player has less than 30 frames of video, we ignore them
            if len(person['seconds']) < 30:
                continue

            file_name = 'player_' + key + '.mp4'

            print(video_file_path, file_name, person['time_segments'])

            time.sleep(1)

            mm.create_video(video_file_path, file_name,
                            person['time_segments'], person['bounds'], resolution=(720, 600), draw_bounds=draw_bounds)

    upload_video(video_file_path)


# adds command line arguments allowing the user to specify the video file path
#  and a target jersey number that is compared against the detected labels
args = ap.ArgumentParser()
args.add_argument("--video", type=str, default='', required=True)
args.add_argument("--target", type=str, default=None, nargs='?')
args.add_argument("--analyze", action="store_true")
args.add_argument("--smoothing", type=float, default=.95, nargs='?')
args.add_argument("--draw_bounds", action="store_true")
args.add_argument("--debug", action="store_true")
args = args.parse_args()

print(args)

main(args.video, args.target, analyze=args.analyze,
     smoothing=args.smoothing, draw_bounds=args.draw_bounds, debug=args.debug)
