chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "extractText",
        title: "Extract Text with EyePop.ai",
        contexts: ["image"]
    });
    chrome.contextMenus.create({
        id: "cropToPerson",
        title: "Crop to Person with EyePop.ai",
        contexts: ["image"]
    });
    chrome.contextMenus.create({
        id: "removeBackground",
        title: "Remove Background with EyePop.ai",
        contexts: ["image"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "extractText") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractTextFromImage,
            args: [info.srcUrl]
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "extractedText") {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            func: showToastNotification,
            args: [message.text]
        });
    }
});

async function extractTextFromImage(imageUrl) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const reader = new FileReader();

    console.log("extractTextFromImage", imageUrl);

    function processEyePopResponse(response) {
        if (!response || !response.objects) return "";

        const objects = response.objects;

        // Sort objects top-to-bottom initially (before clustering into rows)
        objects.sort((a, b) => a.y - b.y);

        let rows = [];

        objects.forEach(obj => {
            const objBottom = obj.y + obj.height; // Bottom Y coordinate

            // Find an existing row that this text belongs to
            let matchedRow = rows.find(row => {
                const rowBottom = row.y + row.height;
                return obj.y <= rowBottom && objBottom >= row.y; // Vertical overlap check
            });

            if (matchedRow) {
                matchedRow.items.push(obj);
                matchedRow.y = Math.min(matchedRow.y, obj.y); // Adjust row position
                matchedRow.height = Math.max(matchedRow.height, obj.height);
            } else {
                rows.push({ y: obj.y, height: obj.height, items: [obj] });
            }
        });

        // Sort rows top-to-bottom, then sort each row left-to-right
        rows.sort((a, b) => a.y - b.y);

        let sortedText = rows.map(row =>
            row.items
                .sort((a, b) => a.x - b.x) // Sort left-to-right
                .flatMap(obj => obj.texts?.map(t => t.text) || [])
        ).flat(); // Flatten all text into a single array

        console.log("sortedText", sortedText.join(" "));

        return sortedText.join(" ");
    }

    async function performOCR(blob) {
       
        console.log("performOCR", window.EyePop.endpoint);

        let results = await window.EyePop.endpoint.process({
            file: blob,
            mimeType: 'image/*',
        })

        for await (let result of results) {
            console.log("pass to processresponse",result)

            return processEyePopResponse(result);
        }

        return "";
    }

    const extractedText = await performOCR(blob);

    // Send message to trigger toast
    chrome.runtime.sendMessage({ type: "extractedText", text: extractedText });

}

function showToastNotification(text) {
    // Copy text to clipboard
    navigator.clipboard.writeText(text).then(() => {
        // Create toast container
        let toast = document.createElement("div");
        toast.innerText = `Text copied: ${text}`;
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.padding = "10px 20px";
        toast.style.background = "rgba(0, 0, 0, 0.8)";
        toast.style.color = "#fff";
        toast.style.fontSize = "14px";
        toast.style.borderRadius = "5px";
        toast.style.zIndex = "9999";
        toast.style.transition = "opacity 0.5s ease-in-out";

        document.body.appendChild(toast);

        // Fade out after 3 seconds
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => document.body.removeChild(toast), 500);
        }, 3000);
    }).catch(() => {
        alert("Failed to copy text. Please try manually.");
    });
}



