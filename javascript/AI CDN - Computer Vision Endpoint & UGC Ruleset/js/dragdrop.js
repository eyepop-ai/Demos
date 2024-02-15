//DRAG AND DROP 

let dropArea = document.getElementById('drop-area');

;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
})

;['dragenter', 'dragover'].forEach(eventName => {
   dropArea.addEventListener(eventName, highlight, false)
})

;['dragleave'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
})

dropArea.addEventListener('drop', handleDrop, false);

function highlight(e) {
    dropArea.classList.add('highlight')
}
function unhighlight(e) {
    dropArea.classList.remove('highlight')
}
function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;
    unhighlight(e);
    handleFiles(files);

    return false;
}
function preventDefaults (e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleFiles(files) {
    console.log("HANDLING FILE");
    ([...files]).forEach(GetJSONFromEyePop_file)
}