const eyePopConfig = {

    popUUID: "<POP_UUID>",
    apiKey: "<API_KEY>"
};

// Save config to chrome.storage for retrieval in other scripts
chrome.storage.local.set({ eyePopConfig });