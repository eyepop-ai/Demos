import cv2
import numpy as np

class EyePopPlotCV2:
    def __init__(self, frame):
        self.frame = frame.copy()

    def object(self, obj: dict):
        label = self._label(obj)
        min_dim = min(obj['height'], obj['width'])

        corner_size = max(15, min_dim / 5.33333)

        primary_color = (215, 167, 47)
        secondary_color = (255, 224, 148)
        text_color = (255, 255, 255)

        opacity_color = (215, 167, 47)

        x = int(obj['x'])
        y = int(obj['y'])
        w = int(obj['width'])
        h = int(obj['height'])

        # Add Rectangle
        cv2.rectangle(self.frame, (x, y), (x+w, y+h), opacity_color, -1)

        # Add corners
        corners = [(x, y), (x, y+h-int(corner_size)), (x+w-int(corner_size), y), (x+w-int(corner_size), y+h-int(corner_size))]
        for corner in corners:
            cv2.rectangle(self.frame, corner, (corner[0]+int(corner_size), corner[1]+int(corner_size)), primary_color, 1)

        padding = max(min_dim * .02, 5)
        corner_size = corner_size - padding

        # Add inner corners
        corners = [(x+int(padding), y+int(padding)), (x+int(padding), y+h-int(padding)-int(corner_size)), 
                   (x+w-int(padding)-int(corner_size), y+int(padding)), (x+w-int(padding)-int(corner_size), y+h-int(padding)-int(corner_size))]
        for corner in corners:
            cv2.rectangle(self.frame, corner, (corner[0]+int(corner_size), corner[1]+int(corner_size)), secondary_color, 1)

        # Add text
        cv2.putText(self.frame, label, (x + 10 + int(padding), y + 10 + int(padding)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, text_color, 1)

    def _label(self, obj: dict) -> str:
        label = obj['classLabel']
        if label == 'person':
            if 'objects' in obj:
                for f in obj['objects']:
                    if 'classLabel' in f and f['classLabel'] == 'face':
                        if 'classes' in f:
                            for c in f['classes']:
                                if 'classLabel' in c:
                                    if c['confidence'] == 1:
                                        label = label + "\n" + c['classLabel']
                                    else:
                                        label = label + "\n" + c['classLabel'] + f" {c['confidence'] * 100:.0f}%" + ""
        return label
