$ = (e) => {return document.getElementById(e);}
const menu = $("menu");
const drawButton = $("draw-button");
const cursorButton = $("cursor-button");
const saveButton = $("save-button")
const loadButton = $("load-button")
const eraseButton = $("erase-button")
const sizeSlider = $("sizeSlider");
const outerSlider = $("sliderOutside");
const colorDiv = $("colors");
const colorButton = $("addNewColorButton");
const colorSelector = $("colorSelector");
const colorOptions = $("colorButtons");
const undoButton = $("undoButton");
const redoButton = $("redoButton");
const clearBoardButton = $("clearBoardButton");
const settingsButton = $("settingsButton");
const collapsed = $("collapsed");
const innerMenu = $("innerMenu");

const popup = $("popup");
const innerPopup = $("innerPopup")
const popupHeader = $("popupMessageHeader");
const popupMessage = $("popupMessage");
const popupButtons = $("popupOptions");
var activePopup = false;

var defaultColors = ["#FF0000","#00FF00","#0000FF"] // gets replaced by settings anyways
var colors = [];
var colorsString = [];
var mode = cursorButton;
var colorAdd = "new"
var dragMode = false;
var currentPage = 1;
var totalPages = 1;

const prevColorPage = $("prevColorPage");
const nextColorPage = $("nextColorPage");
const pageIndicators = $("pageNum");

function switchPage(num) {
    colors.forEach((button) => {
        if (button.getAttribute("page") == num) {
            button.style.visibility = "visible";
        } else {
            button.style.visibility = "collapse";
        }
    });
    if (colorButton.getAttribute("page") == num) {
        colorButton.style.visibility = "visible";
    } else {
        colorButton.style.visibility = "collapse";
    }
    currentPage = num;

    if (num == 1) {
        prevColorPage.classList.remove("selectable");
        Array.from(prevColorPage.children)[0].classList.remove("selectable");
    } else {
        prevColorPage.classList.add("selectable");
        Array.from(prevColorPage.children)[0].classList.add("selectable");
    }

    if (num <= colors.length/8) {
        nextColorPage.classList.add("selectable");
        Array.from(nextColorPage.children)[0].classList.add("selectable");
    } else {
        nextColorPage.classList.remove("selectable");
        Array.from(nextColorPage.children)[0].classList.remove("selectable");
    }

    Array.from(pageIndicators.children).forEach((indicator)=>{
        if (parseInt(indicator.getAttribute("data-page")) == num) {
            indicator.classList.add("current");
        } else {
            indicator.classList.remove("current");
        }
    })
}

sliderOutside.addEventListener("wheel", (e)=>  {
    e.preventDefault();
    var change;
    if (e.deltaY > 0) {
        change = 1;
    } else {
        change = -1;
    }
    sizeSlider.value = parseInt(sizeSlider.value) + parseInt(change*10);
    updateStatus("updatePenSize", [sizeSlider.value]);
});

colorDiv.addEventListener("wheel", (e)=> {
    e.preventDefault();
    if (e.deltaY < 0) {
        if (currentPage > 1) {
            switchPage(currentPage-1);
        }
    } else if (e.deltaY > 0) {
        if (currentPage <= colors.length/8) {
            switchPage(currentPage+1);
        }
    }
})

pageIndicators.addEventListener("click", (e)=> {
    if (e.target.classList.contains("page")) {
        switchPage(parseInt(e.target.getAttribute("data-page")));
    }
})

nextColorPage.addEventListener("click", () => {
    if (currentPage <= colors.length/8) {
        switchPage(currentPage+1);
    }
})

prevColorPage.addEventListener("click", () => {
    if (currentPage > 1) {
        switchPage(currentPage-1);
    }
})

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

colorButton.addEventListener("click",()=>{
    colorAdd="new";
    colorSelector.click();
});

function arc(v) {
    for (var i = 0; i < v; i++) {
        try {
            addNewColor(`#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`);
        } catch(e) {
            
        }
        
    }
}

function addNewColor(color) {
    const newButton = document.createElement("button");
    newButton.className = "colorButton";
    newButton.style.backgroundColor = color;
    newButton.title = `Color ${color}\nLeft-Click to Select\nRight-Click to Remove`;
    newButton.classList.add("nodrag");

    newButton.onclick = onColorButtonPress;
    newButton.oncontextmenu = removeColor;
    
    const currPage = parseInt(colorButton.getAttribute("page"));
    newButton.setAttribute("page",currPage);

    colors.push(newButton);
    colorsString.push(color);
    colorOptions.insertBefore(newButton,colorButton);

    const glow = document.createElement("div");
    glow.className = "shadow";
    glow.inert = true;
    newButton.appendChild(glow);

    if (colors.length >= currPage*8) {
        const newPageIndicator = document.createElement("div");
        newPageIndicator.className = "page";
        newPageIndicator.classList.add("nodrag");
        newPageIndicator.setAttribute("data-page",currPage+1);
        pageIndicators.appendChild(newPageIndicator);
        colorButton.setAttribute("page",currPage+1);
        colorButton.style.visibility = "collapse";
        nextColorPage.classList.add("selectable");
        Array.from(nextColorPage.children)[0].classList.add("selectable");
        totalPages++;
    }
    if (currentPage != currPage) { newButton.style.visibility = "collapse"; }

    colorPressed(newButton);
    updateStatus("colorUpdate",[colorsString]);
}

function removeColor(e) {
    e.preventDefault();
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
        
        if (currentPage != totalPages) {
            for (var page = currentPage; page < totalPages; page++) {
                const idx = (8*page)-1;
                if (idx > colors.length-1) {
                    colorButton.setAttribute("page",page);
                    totalPages--;
                    Array.from(pageIndicators.children).forEach((indi)=>{
                        if (parseInt(indi.getAttribute("data-page"))==page+1) {
                            indi.remove();
                        }
                    })
                } else {
                    const colorToSwap = colors[(8*page)-1];
                    colorToSwap.setAttribute("page",page);
                }
            }
            switchPage(currentPage);
        }
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

menu.addEventListener("pointerdown", (e) => {
    if (e.button != 0) { return; }
    const nodrag = Array.from(document.getElementsByClassName("nodrag"));
    var draggable = true;
    if (innerMenu.classList.contains("hidden")) { draggable = false; }
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

menu.addEventListener("pointermove", (e) => {
    if (dragMode) {
        updateStatus("dragToolbox", args=[e.movementX,e.movementY]);
    }
})

menu.addEventListener("pointerup", (e) => {
    if (dragMode) {
        dragMode = false;
        menu.style.cursor = "default";
        menu.releasePointerCapture(e.pointerId);
        updateStatus("setToolboxPos");
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
    newPopup(
        "Clear board?",
        "This action will erase everything!",
        [
            ["Yes", ()=>{
                updateStatus("clearBoard"); 
            }],
            ["No"]
        ]
    );
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
        if (collapsed.children[0]) { collapsed.children[0].remove(); }
        const newPrev = document.createElement("i");
        collapsed.appendChild(newPrev);
        const iconClass = Array.from(button.children[0].classList)
        for (var i = 0; i < iconClass.length-1; i++) {
            newPrev.classList.add(iconClass[i]);
        }
        mode = button;
    }
    browser.runtime.sendMessage({command:command,status:args})
}

function newPopup(header,message,options=[]) {
    activePopup = true;
    popupHeader.innerText = header;
    popupMessage.innerText = message;
    popup.style.visibility = "visible";
    options.forEach((option)=> {
        const button = document.createElement("button");
        button.className = "popupChoice";
        button.innerText = option[0];
        button.onclick = () => {
            if (option[1]) {
                option[1]();
            }
            popup.style.visibility = "collapse";
            while (popupButtons.lastElementChild) {
                popupButtons.removeChild(popupButtons.lastElementChild);
            }
            activePopup = false;
        }
        popupButtons.append(button);
    })
}

document.addEventListener("DOMContentLoaded", () => {
    colorButton.setAttribute("page",1);
    const getSettings = browser.storage.local.get("settings");
    getSettings.then((data) => {
        defaultColors = data["settings"][0]["colors"];
        defaultColors.forEach((c) => {
            if (!colorsString.includes(c)) {
                addNewColor(c);
            }
        })
    })
    updateStatus("toolboxDOMLoaded");
})

document.addEventListener("visibilitychange", () => {
    updateStatus("save",args=[true]);
})

function addLoadedColors(loadedColors) {
    loadedColors.forEach((c) => {
        if (!colorsString.includes(c)) {
            addNewColor(c);
        }
    });
}

function collapseToolbox() {
    innerMenu.classList.add("hidden");
    menu.classList.add("collapsed");
    collapsed.style.visibility = "visible";
    if (activePopup) {
        popup.style.visibility = "collapse";
    }
}

function expandToolbox() {
    innerMenu.classList.remove("hidden");
    menu.classList.remove("collapsed");
    collapsed.style.visibility = "hidden";
    if (activePopup) {
        popup.style.visibility = "visible";
    }
}

const toolboxActions = {
    "addLoadedColors": addLoadedColors,
    "collapseToolbox": collapseToolbox,
    "expandToolbox": expandToolbox
}

window.addEventListener("message", (e) => {
    toolboxActions[e.data.command].apply(null,e.data.status);
})

