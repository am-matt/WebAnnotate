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
var colorsString = [];
var mode = cursorButton;
var colorAdd = "new"

// Color Selection
colorSelector.addEventListener("change", () => {
    if (colorAdd == "new") {
        addNewColor(colorSelector.value);
    } else {
        colors.forEach((b) => {
            if (b.classList.contains("selected")) {
                const i = colorsString.indexOf(b.style.backgroundColor);
                b.style.backgroundColor = colorSelector.value;
                colorsString[i] = b.style.backgroundColor;
                updateStatus("newColor", b.style.backgroundColor);
                updateStatus("colorUpdate",colorsString);
                colorAdd = "new";
            }
        })
    }
})

function addNewColor(color) {
    const newButton = document.createElement("button");
    newButton.className = "colorButton";
    newButton.style.backgroundColor = color;
    newButton.onclick = onColorButtonPress;
    newButton.oncontextmenu = removeColor;
    colors.push(newButton);
    colorsString.push(color);
    colorOptions.appendChild(newButton);
    colorPressed(newButton);
    updateStatus("colorUpdate",colorsString);
}

function removeColor(e) {
    if (colors.length > 1) {
        b = e.target;
        var switchColors = false;
        if (b.classList.contains("selected")) {
            switchColors = true;
        }
        const y = colorsString.indexOf(b.style.backgroundColor);
        colorsString.splice(y,1);
        const i = colors.indexOf(b);
        colors.splice(i,1);
        b.remove();
        if (switchColors) { colorPressed(colors[0]); }
        updateStatus("colorUpdate",colorsString);
    }
    return false;
}

function onColorButtonPress(e) {
    if (e.target.classList.contains("selected")) {
        colorAdd = "update";
        colorSelector.click();
    } else {
        colorPressed(e.target);
    }
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

window.addEventListener("message", (e) => {
    console.log(e.data);
    e.data.forEach((c) => {
        console.log(c);
        if (!colorsString.includes(c)) {
            addNewColor(c);
        }
    });
})