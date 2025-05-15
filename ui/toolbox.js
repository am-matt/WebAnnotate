$ = (e) => {return document.getElementById(e);}
const menu = $("menu");
const drawButton = $("draw-button");
const cursorButton = $("cursor-button");
const saveButton = $("save-button")
const loadButton = $("load-button")
const eraseButton = $("erase-button")
var mode = cursorButton;

menu.addEventListener("onmouseenter", () => {
    updateStatus("changeMenu","in");
})

menu.addEventListener("onmouseleave", () => {
    updateStatus("changeMenu", "out");
})

cursorButton.addEventListener("click", () => {
    updateStatus("updateStatus","cursor",cursorButton)
})

drawButton.addEventListener("click", () => {
    updateStatus("updateStatus","draw",drawButton)
})

eraseButton.addEventListener("click", () => {
    updateStatus("updateStatus","erase",eraseButton)
})

saveButton.addEventListener("click", () => {
    updateStatus("saveLoad","save");
})

loadButton.addEventListener("click", () => {
    updateStatus("saveLoad","load");
})

function updateStatus(command, status, button) {
    if (command == "updateStatus") {
        mode.classList.remove("selected");
        button.classList.add("selected");
        mode = button;
    }
    browser.runtime.sendMessage({command:command,status:status})
}