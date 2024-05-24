
# EyePop.ai Automated Sports Highlights

This is an example project to track sports players in a video and output a highlight reel of the players. 
It detects jersey numbers and keeps track of players based on this value, if the jersey goes out of view, we use another tracking method until the jersey number comes back into view. 
This is an example and requires polish in terms of improving the video fidelity and tracking.

## Features

- Analyze a video to obtain EyePop inference data
- Track players in the video
- Draw bounding boxes around tracked people
- Debug mode for additional logging

## Requirements

- Python 3.6 or higher
- EyePop SDK

## Setup

1. Clone the repository
2. Install the required Python packages
3. Setup a Pop via the EyePop documentation at [docs.eyepop.ai](docs.eyepop.ai) and enter your pop id and secret key in the config file found one directory up
4. Create an `output` folder for the results

## Usage

You can run the video analyzer with the following command:

```sh
python main.py --help --video <path_to_video> --target <jersey_number> --analyze --smoothing <smoothing_value> --draw_bounds --debug
```

Here's what each argument does:

--video: The path to the video file you want to analyze.
--target (optional): The jersey number of the person you want to track.
--analyze (optional): If present, the video will be analyzed to obtain EyePop inference data, without this option the cached inference data will be used. So this is only requred once per video - storing all results into the `data.json` file.
--smoothing (optional): The EMA smoothing value used by the person tracker. Defaults to 0.95.
--draw_bounds (optional): If present, bounding boxes will be drawn around tracked people.
--debug (optional): If present, all jersey numbers will be printe.
Debugging
You can debug the current file using the Python Debugger. The launch configuration is set up in .vscode/launch.json.
