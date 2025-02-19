document.getElementById("copy").addEventListener("click", async () => {
    const textArea = document.getElementById("text-output");
    textArea.select();
    document.execCommand("copy");
    alert("Copied to clipboard!");
});
