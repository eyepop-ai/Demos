# EyePop Windows Developer Preview Workshop

## Overview
This guide provides step-by-step instructions for downloading, setting up, and running the EyePop Windows Runtime.

## Installation & Setup

### 1. Download Windows Runtime
Follow the instructions in the [EyePop Developer Documentation](https://docs.eyepop.ai/developer-documentation/self-service-training/how-to-train-a-model/deployment/deploy-to-windows-runtime) to download and install the Windows Runtime.

### 2. Start the Runtime
Launch the Windows Runtime after installation.

### 3. Enter Your API Key
When prompted, enter your API key to authenticate your session.

### 4. Navigate to the Python Directory
Ensure you are in the correct Python project directory before proceeding with dependencies installation.

### 5. Install Requirements
Run the following command to install required dependencies:

```sh
pip install -r requirements.txt
```

### 6. Enable Local Mode
Set the environment variable to enable local mode:

```powershell
$env:EYEPOP_LOCAL_MODE = "True"
```

## Support
For further assistance, visit the [EyePop.ai Developer Documentation](https://docs.eyepop.ai).
