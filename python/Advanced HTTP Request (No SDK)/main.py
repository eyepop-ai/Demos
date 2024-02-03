import argparse
import logging
import os

import matplotlib
import matplotlib.patches as patches
import matplotlib.patheffects as path_effects
import matplotlib.pyplot as plt
import requests
from PIL import Image

matplotlib.use('TkAgg')

def draw_eye_pop_reticle(obj, label, ax):
    mindim = min(obj['height'], obj['width'])
    print("min:"+str(mindim))

    corner_size = max(15, mindim / 5.33333)
    print("corner:"+str(mindim))

    primary_color = (47/255, 167/255, 215/255, 1)
    secondary_color = (148/255, 224/255, 255/255, 1)
    text_color = (255/255, 255/255, 255/255, 1)

    opacity_color = (47/255, 167/255, 215/255, .2)

    x = obj['x']
    y = obj['y']
    w = obj['width']
    h = obj['height']

    # Add Rectangle
    rect = patches.Rectangle((obj['x'], obj['y']), obj['width'], obj['height'],
                             linewidth=1, edgecolor=opacity_color, facecolor=opacity_color)
    ax.add_patch(rect)

    # top left corner
    points = [(x, y+corner_size),
              (x, y),
              (x+corner_size, y)]
    rect = patches.Polygon(
        points, linewidth=1, edgecolor=primary_color, facecolor='none', closed=False)
    ax.add_patch(rect)

    # bottom left corner
    points = [(x, y+h-corner_size),
              (x, y+h),
              (x+corner_size, y+h)]
    rect = patches.Polygon(
        points, linewidth=1, edgecolor=primary_color, facecolor='none', closed=False)
    ax.add_patch(rect)

    # top right corner
    points = [(x+w-corner_size, y),
              (x+w, y),
              (x+w, y+corner_size)]
    rect = patches.Polygon(
        points, linewidth=1, edgecolor=primary_color, facecolor='none', closed=False)
    ax.add_patch(rect)

    # bottom right corner
    points = [(x+w, y+h-corner_size),
              (x+w, y+h),
              (x+w-corner_size, y+h)]
    rect = patches.Polygon(
        points, linewidth=1, edgecolor=primary_color, facecolor='none', closed=False)
    ax.add_patch(rect)

    padding = max(mindim * .02, 5)
    corner_size = corner_size-padding

    # 2nd top left corner
    points = [(x+padding, y+padding+corner_size),
              (x+padding, y+padding),
              (x+padding+corner_size, y+padding)]
    rect = patches.Polygon(
        points, linewidth=1, edgecolor=secondary_color, facecolor='none', closed=False)
    ax.add_patch(rect)

    # 2nd bottom left corner
    points = [(x+padding, y-padding+h-corner_size),
              (x+padding, y-padding+h),
              (x+padding+corner_size, y-padding+h)]
    rect = patches.Polygon(
        points, linewidth=1, edgecolor=secondary_color, facecolor='none', closed=False)
    ax.add_patch(rect)

    # 2nd top right corner
    points = [(x-padding+w-corner_size, y+padding),
              (x-padding+w, y+padding),
              (x-padding+w, y+padding+corner_size)]
    rect = patches.Polygon(
        points, linewidth=1, edgecolor=secondary_color, facecolor='none', closed=False)
    ax.add_patch(rect)

    # 2nd bottom right corner
    points = [(x-padding+w, y-padding+h-corner_size),
              (x-padding+w, y-padding+h),
              (x-padding+w-corner_size, y-padding+h)]
    rect = patches.Polygon(
        points, linewidth=1, edgecolor=secondary_color, facecolor='none', closed=False)
    ax.add_patch(rect)

    text = plt.text(obj['x']+10+padding,
                    obj['y']+10+padding,
                    label,
                    fontsize=10,
                    color=text_color,
                    horizontalalignment='left',
                    verticalalignment='top')

    # fig.figimage(im, 10, 10, zorder=3, alpha=.5)

    text.set_path_effects([
        path_effects.Stroke(linewidth=1, foreground=(1, 1, 1, .7)),
        path_effects.Stroke(linewidth=1, foreground=(0, 0, 0, .7)),
        path_effects.Normal()])

    return ax


def show_image(image_path, eyepop_results, is_url=True):
    # Open the image
    if is_url:
        img = Image.open(requests.get(image_path, stream=True).raw)
    else:
        img = Image.open(image_path)

    plt.imshow(img)
    ax = plt.gca()

    print(eyepop_results)

    if eyepop_results is None:
        img.close()
        return False

    results = eyepop_results[0]

    # results = json.loads(eyepop_results)
    if (len(results) == 0 or ('objects' not in results)):
        print("blank")
    else:
        print("Objects Found: "+str(len(results['objects'])))
        print('source_height: ' + str(results['source_height']))
        print('source_id: ' + str(results['source_id']))
        print('source_width: ' + str(results['source_width']))
        print('timestamp: ' + str(results['timestamp']))

        print(eyepop_results)

        for obj in results['objects']:
            print(obj['classLabel'])
            label = obj['classLabel']
            if (label == 'person'):
                if ('objects' in obj):
                    for f in obj['objects']:
                        if ('classLabel' in f and f['classLabel'] == 'face'):
                            if ('classes' in f):
                                for c in f['classes']:
                                    if ('classLabel' in c):
                                        if (c['confidence'] == 1):
                                            label = label + "\n" + \
                                                c['classLabel']
                                        else:
                                            label = label + "\n" + \
                                                c['classLabel'] + \
                                                f" {c['confidence']*100:.0f}%" + ""

            ax = draw_eye_pop_reticle(obj, label, ax)

    plt.show()
    plt.pause(1)
    plt.close()
    img.close()
    return True


def fetch_pop_config(pop_endpoint, token):
    headers = {'Accept': 'application/json',
               'Authorization': f'Bearer {token}'}
    response = requests.get(pop_endpoint, headers=headers)
    return response.json() if response.status_code == 200 else {"error": "Something went wrong!"}


def get_json_from_eye_pop(config, token, url):
    target_url = f"{config['base_url']}/pipelines/{config['pipeline_id']}/source?mode=preempt&processing=sync"
    headers = {
        'Accept': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    data = {"sourceType": "URL", "url": url}
    # start_time = time.time()

    try:
        print(target_url, headers, data)
        response = requests.patch(target_url, headers=headers, json=data)
        response.raise_for_status()
        # timing = int((time.time() - start_time) * 1000)

        j = response.json()
        # j["request_time"] = timing
        return j
    except requests.HTTPError as http_err:
        print(f"HTTP error: {http_err}")
    except Exception as err:
        print(f"Error: {err}")


def get_json_from_eye_pop_upload(config, token, file_path):
    with open(file_path, 'rb') as f:
        files = {'file': f}

        target_url = f"{config['base_url']}/pipelines/{config['pipeline_id']}/source?mode=preempt&processing=sync"
        headers = {
            'Accept': 'application/json',
            'Authorization': f'Bearer {token}'
        }

        try:
            response = requests.post(target_url, headers=headers, files=files)
            response.raise_for_status()

            j = response.json()
            # j["request_time"] = timing
            return j
        except requests.HTTPError as http_err:
            print(f"HTTP error: {http_err}")
        except Exception as err:
            print(f"Error: {err}")


logging.basicConfig(level=logging.INFO)
log = logging.getLogger("EyePop")

parser = argparse.ArgumentParser(description='Upload images to EyePop Inference API')
parser.add_argument('--pop-config-url', required=False, help='EyePop Url to fetch Pop Config, defaults to '
                                                             '$POP_CONFIG_URL')
parser.add_argument('--pop-access-token', required=False, help='EyePop access token to authenticate the Pop owner, '
                                                               'defaults to $POP_ACCESS_TOKEN')
parser.add_argument('files', type=str, nargs='+',
                    help='List of files to upload, either local file paths or http(s): Urls')

args = parser.parse_args()

if not args.pop_config_url:
    pop_config_url = os.environ.get("POP_CONFIG_URL")
else:
    pop_config_url = args.pop_config_url

if not pop_config_url:
    log.error("--pop-config-url or $POP_CONFIG_URL is required")
    exit(-1)

if not args.pop_access_token:
    pop_access_token = os.environ.get("POP_ACCESS_TOKEN")
else:
    pop_access_token = args.pop_access_token

if not pop_access_token:
    log.error("--pop-access-token or $POP_ACCESS_TOKEN is required")
    exit(-1)

config = fetch_pop_config(pop_config_url, pop_access_token)
log.info("using config: %s", str(config))

for file in args.files:
    if file.startswith('https:') or file.startswith('http:'):
        log.info('posting url: %s', file)
        data = get_json_from_eye_pop(config, pop_access_token, file)
        show_image(file, data)
    else:
        log.info('posting local file: %s', file)
        data = get_json_from_eye_pop_upload(config, pop_access_token, file)
        show_image(file, data, False)

