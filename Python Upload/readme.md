# EyePop Image Analysis

This Python project provides tools for analyzing images using the EyePop AI service. It includes functionality to draw visual reticles on detected objects and display images with annotations.

## Features

- Fetching configuration from the EyePop server.
- Posting a URL to the EyePop API for image analysis.
- Uploading a local image file for analysis.
- Displaying images with annotated reticles based on analysis results.

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Python 3.6 or above.
- Required Python libraries: `requests`, `matplotlib`, `Pillow`.

## Installation

1. Clone the repository:
   ```bash
   git clone [repository URL]
   ```
2. Install the required Python libraries:
   ```bash
   pip install requests matplotlib Pillow
   ```

## Usage

To use the EyePop Image Analysis tool:

1. Set up the configuration for the AI Worker Server. Provide your EyePop API endpoint and token in the `pop_endpoint` and `token` variables.
2. For analyzing a publicly accessible image URL, provide the URL in the `url` variable and call `get_json_from_eye_pop`.
3. For analyzing a local image file, provide the file path in the `file_path` variable and call `get_json_from_eye_pop_upload`.
4. Use `show_image` to display the analyzed image.

Example:
```python
pop_endpoint = ''  # Your EyePop API endpoint
token = ''  # Your API token

config = fetch_pop_config(pop_endpoint, token)

# Analyze a public URL
url = 'https://example.com/image.jpg'
data = get_json_from_eye_pop(config, url)
show_image(url, data)

# Analyze a local file
file_path = '/path/to/your/image.jpg'
data = get_json_from_eye_pop_upload(config, file_path)
show_image(file_path, data, False)
```
