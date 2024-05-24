from moviepy.editor import VideoFileClip, concatenate_videoclips, CompositeVideoClip, ColorClip, transfx
from moviepy.video.VideoClip import VideoClip
import os
import subprocess
import numpy as np
import cv2
import subprocess

import twod

sprite = cv2.imread("indicator.png", cv2.IMREAD_UNCHANGED)


def get_bounds_at_time(time_bounds, t):
    """ Interpolate or retrieve bounds at given time `t`. """
    closest_time = min(time_bounds.keys(), key=lambda x: abs(x - t))
    return time_bounds[closest_time]


def create_video(video_path, output_video_path, segments, bounds, resolution=(720, 720), draw_bounds=False):

    video_file_name = os.path.basename(video_path)
    video_file_name = ''.join(e for e in video_file_name if e.isalnum())

    cap = cv2.VideoCapture(video_path)
    frame_rate = cap.get(cv2.CAP_PROP_FPS)

    output_folder = 'output\\' + output_video_path + '_temp\\'

    print(video_file_name, video_path, output_video_path, output_folder)

    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)

    dst = False
    count = 0

    output_rect = twod.get_rect(x=0, y=0, w=resolution[0], h=resolution[1])

    dst_padding = 10
    dst_size = output_rect['min_dim'] - 2 * dst_padding
    dst_rect = twod.get_rect(
        center_x=output_rect['center_x'], center_y=output_rect['center_y'], w=dst_size, h=dst_size)

    for i, (start, end) in enumerate(segments):

        for t in np.arange(start, end, 1.0 / frame_rate):
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(t * frame_rate))
            ret, frame = cap.read()
            output = None

            if not ret:
                print("Error reading frame: " + str(t))
                break

            frame_rect = twod.get_rect(
                x=0, y=0, w=frame.shape[1], h=frame.shape[0])
            blur_rect = twod.get_rect_fit_inside_another_rect(
                inner_rect=output_rect, outer_rect=frame_rect)

            bounds_at_time = get_bounds_at_time(bounds, t)
            x1, y1, w, h = bounds_at_time[0], bounds_at_time[1], bounds_at_time[2], bounds_at_time[3]
            bounds_rect = twod.get_rect(x=x1, y=y1, w=w, h=h)

            count += 1

            if draw_bounds:
                cv2.rectangle(frame, (bounds_rect['left'], bounds_rect['top']),
                              (bounds_rect['right'], bounds_rect['bottom']), (0, 255, 0), 2)

            # calculate the size of the region of interest, keeping it a square
            roi_padding = 200  # w // 2
            desired_roi_size = int(bounds_rect['max_dim'] + 2 * roi_padding)
            roi_size = min(max(500, desired_roi_size), frame_rect['min_dim'])
            roi_rect = twod.get_rect_clamped_inside_another_rect(
                center_x=bounds_rect['center_x'], center_y=bounds_rect['center_y'], w=roi_size, h=roi_size, outer_rect=frame_rect)

            # calculate the size of the sprite
            sprite_min_size = 20
            sprite_max_size = 50
            # Adjust the scale factor as needed
            sprite_width = min(
                max(sprite_min_size, int(w * 0.3)), sprite_max_size)
            sprite_height = int(sprite_width)
            sprite_resized = cv2.resize(sprite, (sprite_width, sprite_height))
            sprite_rect = twod.get_rect_clamped_inside_another_rect(
                center_x=bounds_rect['center_x'], center_y=bounds_rect['top']-sprite_height/2, w=sprite_width, h=sprite_height, outer_rect=roi_rect)

            # Add the sprite to the cropped frame, respecting alpha channel
            alpha = sprite_resized[:, :, 3] / 255.0
            foreground = sprite_resized[:, :, :3]
            background = frame[twod.to_slice(sprite_rect)]

            # Expand the dimensions of alpha to match the shape of foreground and background
            alpha_expanded = np.expand_dims(alpha, axis=2)

            # Multiply alpha_expanded with foreground and (1 - alpha_expanded) with background
            blended = (alpha_expanded * foreground +
                       (1 - alpha_expanded) * background).astype(np.uint8)

            frame[twod.to_slice(sprite_rect)] = blended
            roi = frame[twod.to_slice(roi_rect)]

            # fill in the rest of the frame with a blurred version of the frame
            blurred_frame = cv2.blur(frame, (51, 51))
            blurred_frame = cv2.resize(
                blurred_frame, [frame.shape[1], frame.shape[0]])

            output = cv2.resize(blurred_frame[twod.to_slice(
                blur_rect)], (output_rect['w'], output_rect['h']))

            roi_resized = cv2.resize(roi, (dst_rect['w'], dst_rect['h']))
            output[twod.to_slice(dst_rect)] = roi_resized

            if draw_bounds:
                # uncomment to show roi within frame. red is roi, green is bounds
                cv2.rectangle(frame, *twod.to_corners(roi_rect),
                              (0, 0, 255), 2)
                output = frame

            print(f"Writing frame {
                  t} to " + os.path.join(output_folder, str(count).zfill(4) + ".jpg"))

            cv2.imwrite(os.path.join(output_folder, str(
                count).zfill(4) + ".jpg"), output)

            cv2.imshow('frame' + output_video_path, output)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                exit()
                break
        cv2.destroyAllWindows()

    cap.release()

    combine_images_to_video(
        output_folder, f"output\\{video_file_name}_{output_video_path}.mp4", resolution=resolution, fps=frame_rate)


def combine_images_to_video(image_folder, output_path, resolution, fps):
    current_path = os.path.dirname(os.path.abspath(__file__))
    ffmpeg_cmd = [
        "ffmpeg",
        "-r", str(int(fps)),
        "-i", os.path.join(current_path, image_folder, "%04d.jpg"),
        "-c:v", "libx264",
        "-vf", f"fps={int(fps)}",
        "-pix_fmt", "yuv420p",
        os.path.join(current_path, output_path),
        '-y'
    ]

    print('\n\n\n\n\n\n\n\n', ' '.join(ffmpeg_cmd), '\n\n\n\n\n\n\n\n')

    subprocess.run(ffmpeg_cmd, check=True)

    # Delete the image folder
    subprocess.run(["cmd", "/c", "rmdir", "/s", "/q",
                   os.path.join(current_path, image_folder)])
