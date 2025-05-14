$ = (e) => {return document.getElementById(e);}
const drawButton = $("draw-button");
const cursorButton = $("cursor-button");
const saveButton = $("save-button")
const loadButton = $("load-button")
const eraseButton = $("erase-button")
const statusText = $("mode-info")
var mode = "cursor";

cursorButton.addEventListener("click", () => {
    updateStatus("updateStatus","cursor")
})

drawButton.addEventListener("click", () => {
    updateStatus("updateStatus","draw")
})

eraseButton.addEventListener("click", () => {
    updateStatus("updateStatus","erase")
})

saveButton.addEventListener("click", () => {
    updateStatus("saveLoad","save");
})

loadButton.addEventListener("click", () => {
    updateStatus("saveLoad","load");
})

function updateStatus(command, status) {
    mode = status;
    statusText.innerHTML = status;
    browser.runtime.sendMessage({command:command,status:status})
}