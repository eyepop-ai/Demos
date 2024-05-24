import numpy as np
import scipy.signal

# A PersonTracker class which has a map of people, where the key is a traceID and the values are the person's jersey number and the number of frames the person has been in the video.


class PersonTracker:

    def __init__(self, smoothing=20):
        self.people = {}
        self.smoothing = smoothing

    # add a person to the people map
    def add_person(self, labels: [], trace_id: int, frame_time: float, bounds: []) -> None:

        # If there are not labels, we try to find the person by trace_id
        #   This may introduce error if the traceID Jumps from one player to another
        if len(labels) == 0:
            for person in self.people:
                if trace_id in self.people[person]['ids']:
                    labels.append(person)
                    break

        for label in labels:

            if not label or not type(label) == str or not label.isnumeric():
                continue

            if label not in self.people:

                self.people[label] = {
                    'ids': [trace_id],
                    'seconds': [],
                    'time_segments': [],
                    'bounds': {},
                }

            self.people[label]['ids'].append(trace_id)
            self.people[label]['seconds'].append(frame_time)
            self.people[label]['bounds'][frame_time] = bounds

    def filter_map(self,  width, height, threshold=2):
        # self.consolidate_people()
        self.filter_times(threshold)
        # self.scale_bounds(max_width=width, max_height=height)
        self.smooth_bounds()

    # combine any people entries with the same jersey number, and remove the duplicates
    def consolidate_people(self):
        people = self.people

        for person in people:

            for other_person in people:

                people[person]['seconds'].extend(
                    people[other_person]['seconds'])
                people[person]['seconds'].sort()

                people[person]['bounds'].update(
                    people[other_person]['bounds'])

                people[person]['ids'].extend(
                    people[other_person]['ids'])

                people[other_person]['ids'] = []

        people_to_remove = []

        for person in people:

            # next we remove duplicate labels
            people[person]['ids'] = list(set(people[person]['ids']))
            people[person]['seconds'] = list(
                set(people[person]['seconds']))
            people[person]['seconds'].sort()

            # add the person to the removal list if they have no labels
            if people[person]['ids'] == []:
                people_to_remove.append(person)

        # remove the people with no labels
        for person in people_to_remove:
            del people[person]

    # scale the bounds up to a minimum size of 500x500 and keep the center of the bounding box the same
    def scale_bounds(self, max_width, max_height):
        for person in self.people:

            for time in self.people[person]['bounds']:

                x, y, w, h = self.people[person]['bounds'][time]

                # Calculate the center of the bounding box
                x_center = x + w / 2
                y_center = y + h / 2

                # Calculate the new width and height
                new_w = max(max_width//1.5, w)
                new_h = max(max_width//1.5, h)

                # Ensure the x+width and y+height are less than the max_width and max_height
                if x + new_w > max_width:
                    new_w = max_width - x
                if y + new_h > max_height:
                    new_h = max_height - y

                # Calculate the new x and y
                new_x = x_center - new_w / 2
                new_y = y_center - new_h / 2

                self.people[person]['bounds'][time] = [
                    new_x, new_y, new_w, new_h]

    # consolidate person time list into segments of times in tuples with a threshold of seconds
    def filter_times(self, threshold=2):

        for key in self.people.keys():

            times = self.people[key]['seconds']
            start_time = times[0]

            for j in range(1, len(times)):
                if times[j] - times[j - 1] > threshold:
                    self.people[key]['time_segments'].append(
                        (start_time, times[j - 1]))
                    start_time = times[j]

            # Add the last segment
            self.people[key]['time_segments'].append((start_time, times[-1]))

    def average_bounds(self):
        if self.smoothing <= 0:
            return

        same_person_threshold = np.inf
        times_before = 4
        times_after = 4

        for key in self.people.keys():
            bounds = self.people[key]['bounds']
            seconds = self.people[key]['seconds']

            for s in range(len(seconds)):
                second = seconds[s]

                times_to_average = seconds[max(
                    0, s - times_before):min(len(seconds), s + times_after + 1)]

                x_values = []
                y_values = []
                w_values = []
                h_values = []

                x_start = bounds[second][0]
                y_start = bounds[second][1]
                w_start = bounds[second][2]
                h_start = bounds[second][3]

                x_current_center = bounds[second][0] + bounds[second][2] / 2
                y_current_center = bounds[second][1] + bounds[second][3] / 2

                # average distance between the centers of the bounding boxes
                average_distance = 0
                for time in times_to_average:
                    x1, y1, w, h = bounds[time]
                    x_center = x1 + w / 2
                    y_center = y1 + h / 2

                    average_distance += np.sqrt((x_center - x_current_center)
                                                ** 2 + (y_center - y_current_center)**2)

                same_person_threshold = average_distance / 2

                for time in times_to_average:
                    x1, y1, w, h = bounds[time]
                    x_center = x1 + w / 2
                    y_center = y1 + h / 2

                    if abs(x_center - x_current_center) > same_person_threshold or \
                            abs(y_center - y_current_center) > same_person_threshold:
                        continue

                    x_values.append(x1)
                    y_values.append(y1)
                    w_values.append(w)
                    h_values.append(h)

                x_mean = np.mean(x_values)
                y_mean = np.mean(y_values)
                w_mean = np.mean(w_values)
                h_mean = np.mean(h_values)

                bounds[times_to_average[0]] = [x_mean, y_mean, w_mean, h_mean]

    def smooth_bounds(self):
        if self.smoothing <= 0.0:
            return

        self.average_bounds()

        alpha = self.smoothing  # Smoothing factor. Adjust this to increase or decrease smoothing

        for key in self.people.keys():
            bounds = self.people[key]['bounds']
            seconds = self.people[key]['seconds']
            ema_bounds = {}

            sorted_seconds = sorted(seconds)
            if sorted_seconds:
                ema_bounds[sorted_seconds[0]] = bounds[sorted_seconds[0]]

            for i in range(1, len(sorted_seconds)):
                current_time = sorted_seconds[i]
                previous_time = sorted_seconds[i - 1]

                previous_bounds = ema_bounds[previous_time]
                current_bounds = bounds[current_time]

                x1, y1, w, h = current_bounds
                prev_x, prev_y, prev_w, prev_h = previous_bounds

                # Calculate the exponential moving average
                x_mean = alpha * x1 + (1 - alpha) * prev_x
                y_mean = alpha * y1 + (1 - alpha) * prev_y
                w_mean = alpha * w + (1 - alpha) * prev_w
                h_mean = alpha * h + (1 - alpha) * prev_h

                ema_bounds[current_time] = [x_mean, y_mean, w_mean, h_mean]

            # Update the original bounds with the smoothed values
            bounds.update(ema_bounds)
