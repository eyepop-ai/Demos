# EyePop Image Analysis without the SDK

This Python project provides tools for analyzing images using the EyePop AI service. It includes functionality to draw visual reticles on detected objects and display images with annotations.

## Features

- Fetching configuration from the EyePop server.
- Posting a URL to the EyePop API for image analysis.
- Uploading a local image file for analysis.
- Displaying images with annotated reticles based on analysis results.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Python 3.6 or above.
- Using a virtual environment is recommended.

## Installation

1. Clone the repository:
   ```bash
   git clone [repository URL]
   ```
2. Install the required Python libraries:
   ```bash
   cd "Demos/Python Upload"
   pip3 install -r requirements.txt
   ```

## Usage

To use the EyePop Image Analysis tool:

1. Set up the configuration for the AI Worker Server. Provide your EyePop API endpoint and token in the `pop_endpoint` and `token` variables.
2. Use the values from above to et environment variables:
   ```bash
   export POP_CONFIG_URL=...
   ```
   ```bash
   export POP_ACCESS_TOKEN=...
   ```
3. Run the example with a public Url:
   ```bash
   python3 main.py https://raw.githubusercontent.com/eyepop-ai/Demos/main/AI%20CDN%20-%20Computer%20Vision%20Endpoint%20%26%20UGC%20Ruleset/images/photo_for_demo4.webp
   ```
4. Run the example with a local file:
   ```bash
   python3 main.py  test_images/morgan-freeman.jpeg
   ```
