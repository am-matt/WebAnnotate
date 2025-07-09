$ = (e) => {return document.getElementById(e);}
const menu = $("menu");
const drawButton = $("draw-button");
const cursorButton = $("cursor-button");
const saveButton = $("save-button")
const loadButton = $("load-button")
const eraseButton = $("erase-button")
const sizeSlider = $("sizeSlider");
const colorButton = $("addNewColorButton");
const colorSelector = $("colorSelector");
const colorOptions = $("colorButtons");
var defaultColors = ["rgba(255,0,0,1)","rgba(0,255,0,1)","rgba(0,0,255,1)"]
var colors = [];
var mode = cursorButton;

// Color Selection
colorSelector.addEventListener("change", () => {
    addNewColor(colorSelector.value);
})

function addNewColor(color) {
    const newButton = document.createElement("button");
    newButton.className = "colorButton";
    newButton.style.backgroundColor = color;
    newButton.onclick = onColorButtonPress;
    newButton.oncontextmenu = removeColor;
    colors.push(newButton);
    colorOptions.appendChild(newButton);
    colorPressed(newButton);
}

function removeColor(e) {
    if (colors.length > 1) {
        b = e.target;
        var switchColors = false;
        if (b.classList.contains("selected")) {
            switchColors = true;
        }
        const i = colors.indexOf(b);
        colors.splice(i,1);
        b.remove();
        if (switchColors) { colorPressed(colors[0]); }
    }
    return false;
}

function onColorButtonPress(e) {
    colorPressed(e.target);
}

function colorPressed(b) {
    colors.forEach((c) => { c.classList.remove("selected"); })
    b.classList.add("selected");
    updateStatus("newColor", b.style.backgroundColor);
}

// Mode Switching
sizeSlider.addEventListener("change", () => {
    updateStatus("resize", sizeSlider.value);
})

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

document.addEventListener("DOMContentLoaded", () => {
    defaultColors.forEach((c) => {
        addNewColor(c);
    })
})