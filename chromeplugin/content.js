(async function initEyePop() {
    if (!document.getElementById("eyepop-sdk")) {
        let script = document.createElement("script");
        script.id = "eyepop-sdk";
        script.src = chrome.runtime.getURL("eyepop.min.js");
        script.async = true;

        script.onload = async function () {
            console.log("EyePop SDK loaded");

            // Ensure EyePop is ready
            await waitForEyePop();

            chrome.storage.local.get("eyePopConfig", async (data) => {
                if (!data.eyePopConfig) {
                    console.error("EyePop Config not found in storage!");
                    return;
                }

                console.log("EyePop Config loaded", data.eyePopConfig);

                const { popUUID, apiKey } = data.eyePopConfig;

                window.EyePop = window.EyePop || {};

                // Initialize the EyePop worker endpoint
                window.EyePop.endpoint = await EyePop.workerEndpoint({
                    auth: { secretKey: apiKey },
                    popId: popUUID,  // Replace with actual Pop ID
                })
                    .onStateChanged((from, to) => {
                        console.log('Endpoint state transition from ' + from + ' to ' + to);
                    })
                    .onIngressEvent(ingressEvent => {
                        console.log(ingressEvent);
                    })
                    .connect();

                console.log("EyePop endpoint initialized", window.endpoint);
            })
        };

        document.head.appendChild(script);
    }
})();

// Helper function to wait for EyePop to be available
async function waitForEyePop() {
    return new Promise(resolve => {
        let checkInterval = setInterval(() => {
            if (window.EyePop) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
    });
}
