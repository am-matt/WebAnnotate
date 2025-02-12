$ = (e) => {return document.getElementById(e);}
const drawButton = $("draw-button");
const cursorButton = $("cursor-button");
const statusText = $("mode-info")
var mode = "cursor";

cursorButton.addEventListener("click", () => {
    updateStatus("cursor")
})

drawButton.addEventListener("click", () => {
    updateStatus("draw")
})

function updateStatus(status) {
    mode = status;
    statusText.innerHTML = status;
    browser.runtime.sendMessage({command:"updateStatus",status:status})
}