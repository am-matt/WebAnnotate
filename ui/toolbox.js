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
const undoButton = $("undoButton");
const redoButton = $("redoButton");
const clearBoardButton = $("clearBoardButton");
const settingsButton = $("settingsButton");
var defaultColors = ["#FF0000","#00FF00","#0000FF"] // gets replaced by settings anyways
var colors = [];
var colorsString = [];
var mode = cursorButton;
var colorAdd = "new"
var dragMode = false;

/*
annotationActions = [openclose,updateStatus,save,load,maximizeToolbox,minimizeToolbox,updatePenSize,
  newColor,updateColors,undoPath,redoPath,clearBoard]
*/

// CSS styles return rgba(r,g,b) format by default but this program uses hex to store colors
function RGBAToHexA(rgba, forceRemoveAlpha = false) {
  return "#" + rgba.replace(/^rgba?\(|\s+|\)$/g, '') // Get's rgba / rgb string values
    .split(',') // splits them at ","
    .filter((string, index) => !forceRemoveAlpha || index !== 3)
    .map(string => parseFloat(string)) // Converts them to numbers
    .map((number, index) => index === 3 ? Math.round(number * 255) : number) // Converts alpha to 255 number
    .map(number => number.toString(16)) // Converts numbers to hex
    .map(string => string.length === 1 ? "0" + string : string) // Adds 0 when length of one number is 1
    .join("") // Puts the array to togehter to a string
}

// Color Selection
colorSelector.addEventListener("change", () => {
    if (colorAdd == "new") {
        addNewColor(colorSelector.value);
    } else {
        colors.forEach((b) => {
            if (b.classList.contains("selected")) {
                const oldColor = RGBAToHexA(b.style.backgroundColor).toUpperCase();
                const i = colorsString.indexOf(oldColor);
                b.style.backgroundColor = colorSelector.value;
                colorsString[i] = b.style.backgroundColor;
                updateStatus("newColor", [b.style.backgroundColor]); 
                updateStatus("colorUpdate",[colorsString]);
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
    updateStatus("colorUpdate",[colorsString]);
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
        updateStatus("colorUpdate",[colorsString]);
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
    updateStatus("newColor",[b.style.backgroundColor]);
}

menu.addEventListener("mousedown", (e) => {
    const nodrag = Array.from(document.getElementsByClassName("nodrag"));
    var draggable = true;
    for (const i in nodrag) {
        if (nodrag[i].matches(":hover")) {
            draggable = false;
            break;
        }
    }
    if (draggable) {
        dragMode = true;
        menu.style.cursor = "grabbing";
        menu.setPointerCapture(e.pointerId);
    }
})

menu.addEventListener("mousemove", (e) => {
    if (dragMode) {
        updateStatus("dragToolbox", args=[e.movementX,e.movementY]);
    }
})

menu.addEventListener("mouseup", (e) => {
    if (dragMode) {
        dragMode = false;
        menu.style.cursor = "default";
        menu.releasePointerCapture(e.pointerId);
    }
})

// Mode Switching

sizeSlider.addEventListener("change", () => {
    updateStatus("updatePenSize", [sizeSlider.value]);
})

/*menu.addEventListener("onmouseenter", () => {
    updateStatus("changeMenu","in");
})

menu.addEventListener("onmouseleave", () => {
    updateStatus("changeMenu", "out");
})*/

cursorButton.addEventListener("click", () => {
    updateStatus("updateStatus",args=["cursor"],reason="updateStatus",cursorButton)
})

drawButton.addEventListener("click", () => {
    updateStatus("updateStatus",args=["draw"],reason="updateStatus",drawButton)
})

eraseButton.addEventListener("click", () => {
    updateStatus("updateStatus",args=["erase"],reason="updateStatus",eraseButton)
})

// Action Buttons

saveButton.addEventListener("click", () => {
    updateStatus("save");
})

loadButton.addEventListener("click", () => {
    updateStatus("load");
})

undoButton.addEventListener("click", () => {
    updateStatus("undoPath");
})

redoButton.addEventListener("click", () => {
    updateStatus("redoPath");
})

clearBoardButton.addEventListener("click", () => {
    if (window.confirm("Clear board?")) {
        updateStatus("clearBoard")
    }
})

settingsButton.addEventListener("click", () => {
    updateStatus("settings");
})

// Script Communication and Toolbox startup functions

document.addEventListener('keydown', keyPressHandler);
function keyPressHandler(e) {
      if (e.ctrlKey && e.shiftKey && e.keyCode == 90) {
        updateStatus("redoPath");
      }
      else if (e.ctrlKey && e.keyCode == 90) {
        updateStatus("undoPath");
      }
}

function updateStatus(command, args=null, reason=null, button=null) {
    if (reason == "updateStatus") {
        mode.classList.remove("selected");
        button.classList.add("selected");
        mode = button;
    }
    browser.runtime.sendMessage({command:command,status:args})
}

document.addEventListener("DOMContentLoaded", () => {
    const getSettings = browser.storage.local.get("settings");
    getSettings.then((data) => {
        defaultColors = data["settings"][0]["colors"];
        defaultColors.forEach((c) => {
            addNewColor(c);
        })
    })
    
})

window.addEventListener("message", (e) => {
    e.data.forEach((c) => {
        if (!colorsString.includes(c)) {
            addNewColor(c);
        }
    });
})

