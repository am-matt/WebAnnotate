$ = (e) => {return document.getElementById(e);}
const autoSaveCheck = $("autoSaveCheck");
const maxUndo = $("maxUndoNum");
const dataTable = $("dataTable");
const totalUsageText = $("totalStorage");
const maxUndoWarningLabel = $("memoryWarning")
const cursorType = $("cursorType")

// Data Storage Manager //

function round(num,place) {
    return +num.toFixed(place);
}

function updateStorage() {
    const storage = browser.storage.local.get(null);
    storage.then((data) => {
        const totalStorageUsage = JSON.stringify(data).length;
        if (totalStorageUsage < 1000) {
            totalUsageText.innerText = round(totalStorageUsage,2) + " B";
        } else if (totalStorageUsage < 1000000) {
            totalUsageText.innerText = round((totalStorageUsage/1000),2) + " KB";
        } else if (totalStorageUsage < 1000000000) {
            totalUsageText.innerText = round((totalStorageUsage/1000000),2) + " MB";
        } else {
            totalUsageText.innerText = round((totalStorageUsage/1000000000),2) + " GB";
        }
    })

}

const getStorage = browser.storage.local.get(null);
getStorage.then((data) => {
    updateStorage();

    const domains = Object.entries(data);
    domains.forEach((ref) => {
        if (ref[0] == "settings") { return; }
        const row = document.createElement("tr");
        row.className = "dataEntry";

        const linkCell = document.createElement("td");
        linkCell.innerText = ref[0];
        linkCell.className = "linkCell";
        row.appendChild(linkCell);

        const usage = JSON.stringify(ref[1][0]).length;
        const usageCell = document.createElement("td");
        usageCell.className = "usageCell";
        if (usage < 1000) {
            usageCell.innerText = round(usage,2) + " B";
        } else if (usage < 1000000) {
            usageCell.innerText = round((usage/1000),2) + " KB";
        } else {
            usageCell.innerText = round((usage/1000000),2) + " MB";
        }
        row.appendChild(usageCell);

        /*const downloadCell = document.createElement("td");
        const downloadButton = document.createElement("button");
        downloadButton.innerText = "Download";
        downloadCell.appendChild(downloadButton);
        row.appendChild(downloadCell);

        downloadButton.addEventListener("click", (e) => {
            const a = document.createElement('a');
            a.href = ref[1][0][0];
            a.download = ref[1][0][0];
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        })*/

        const deleteCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete";
        deleteCell.className = "delCell";
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        deleteButton.addEventListener("click", (e) => {
            row.remove();
            browser.storage.local.remove(ref[0]);
            updateStorage();
        })

        dataTable.appendChild(row);
    })
})



// Color Preset Setting //

var defaultColors = ["#FF0000","#00FF00","#0000FF"] // gets replaced by settings anyways
const colorOptions = $("colorButtons");
const colorSelector = $("colorSelector");
var colors = [];
var colorsString = [];
var colorAdd = "new";


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

colorSelector.addEventListener("change", () => {
    if (colorAdd == "new") {
        addNewColor(colorSelector.value);
    } else {
        colors.forEach((b) => {
            if (b.classList.contains("selected")) {
                console.log("FOUND SELECTED");
                const oldColor = RGBAToHexA(b.style.backgroundColor).toUpperCase();
                const i = colorsString.indexOf(oldColor);
                b.style.backgroundColor = colorSelector.value;
                colorsString[i] = RGBAToHexA(b.style.backgroundColor).toUpperCase();
                colorAdd = "new";
                b.classList.remove("selected");
                updateColorsSetting();
                updateStorage();
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
    updateColorsSetting();
    updateStorage();
}

function removeColor(e) {
    if (colors.length > 1) {
        b = e.target;
        const y = colorsString.indexOf(RGBAToHexA(b.style.backgroundColor).toUpperCase());
        colorsString.splice(y,1);
        const i = colors.indexOf(b);
        colors.splice(i,1);
        b.remove();
        updateColorsSetting();
        updateStorage();
    }
    return false;
}

function onColorButtonPress(e) {
    colors.forEach((b)=> {
        if (b.classList.contains("selected")) {
            b.classList.remove("selected");
        }
    })
    colorAdd = "update";
    e.target.classList.add("selected");
    colorSelector.click();
}

function colorPressed(b) {
    colors.forEach((c) => { c.classList.remove("selected"); })
    b.classList.add("selected");
}

function updateColorsSetting() {
    const getSettings = browser.storage.local.get("settings");
    getSettings.then((data) => {
        data["settings"][0]["colors"] = colorsString;
        const update = browser.storage.local.set({settings:data["settings"]});
        update.then(() => { console.log("update complete "); })
    })
}

// General Settings Management //
function autoSaveChanged(e) {
    const getSettings = browser.storage.local.get("settings");
    getSettings.then((data) => {
        data["settings"][0]["autoSave"] = e.target.matches(":checked");
        const update = browser.storage.local.set({settings:data["settings"]});
        update.then(() => { console.log("updated autosave"); })
    })
}

function maxUndoChanged(e) {
    const getSettings = browser.storage.local.get("settings");
    getSettings.then((data) => {
        data["settings"][0]["maxUndo"] = e.target.value;
        const update = browser.storage.local.set({settings:data["settings"]});
        update.then(() => { console.log("updated max undo"); })
        if (e.target.value > 100) {
            maxUndoWarningLabel.hidden = false;
        } else {
            maxUndoWarningLabel.hidden = true;
        }
    })
}

function cursorChanged(e) {
    const getSettings = browser.storage.local.get("settings");
    getSettings.then((data) => {
        console.log(e.target.value);
        data["settings"][0]["cursor"] = e.target.value;
        const update = browser.storage.local.set({settings:data["settings"]});
        update.then(() => { console.log("updated cursor settings"); })
    })
}

document.addEventListener("DOMContentLoaded", () => {
    const getSettings = browser.storage.local.get("settings");
    getSettings.then((data) => {
        const autoSaveSetting = data["settings"][0]["autoSave"];
        const maxUndoSetting = data["settings"][0]["maxUndo"];
        const cursorSetting = data["settings"][0]["cursor"];

        autoSaveCheck.checked = autoSaveSetting;
        maxUndo.value = maxUndoSetting;
        cursorType.value = cursorSetting;

        if (maxUndo.value > 100) {
            maxUndoWarningLabel.hidden = false;
        } else {
            maxUndoWarningLabel.hidden = true;
        }

        autoSaveCheck.addEventListener("input", autoSaveChanged);
        maxUndo.addEventListener("input", maxUndoChanged);
        cursorType.addEventListener("input", cursorChanged);

        defaultColors = data["settings"][0]["colors"];
        defaultColors.forEach((c) => {
            addNewColor(c);
        })
    })
})