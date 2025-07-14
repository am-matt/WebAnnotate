const webPath = window.location.href.split('?')[0];

// canvas handling
var toolbox;
var canvas;
var ctx;
var cursor;
var mode = "cursor";
var prevX, prevY
var undoRedoCap = 10;
var penWidth = 5;
var opened = false;
var undoredoAction = false;
var saveStack = [];
var currentPoints = [];
var color = "rgba(255,0,0,1)";
var colors = [];
var autosave = false;
var changes = false;
var cursorType = "circle";

var saveStates = [];
var redoStates = [];

function openclose() {
    if (opened) {
        opened = false;
        hideToolBox();
        
    } else {
        opened = true;
        loadToolbox();
    }
}

function hideToolBox() {
  if (toolbox) {
    toolbox.style.visibility = "hidden";
    canvas.style.visibility = "hidden";
  }
}

function loadToolbox() {
  if (!toolbox) {
    console.log("loading toolbox....")
    const iframe = document.createElement("iframe");
    iframe.id = 'ext-toolbox';
    iframe.src = browser.extension.getURL("ui/toolbox.html");
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
    document.body.append(canvas);
    canvas.style.all = "initial";
    canvas.id = "webannotate-canvas";
    canvas.width = document.body.scrollWidth;
    canvas.height = document.body.scrollHeight;
    canvas.style.userSelect = "none"
    canvas.style.zIndex = 999999999;
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.position = "absolute";
    canvas.style.cursor = "none";
    canvas.inert = true;
    document.body.append(iframe);

    cursor = document.createElement("div");
    cursor.style.all = "initial";
    cursor.id = "webannotate-cursor";
    cursor.style.position = "fixed";
    cursor.style.transform = "translate(-50%,-50%)";
    cursor.style.transformOrigin = "top left";
    cursor.style.height = "32px";
    cursor.style.width = "32px";
    cursor.style.borderRadius = "32px";
    cursor.style.border = "solid black 2px";
    cursor.style.filter = "invert(1)";
    cursor.style.mixBlendMode = "difference";
    cursor.inert = true;
    cursor.style.zIndex = canvas.style.zIndex + 1;
    document.body.append(cursor);
    
    const stylesheet = document.createElement("style");
    stylesheet.textContent = `
        #ext-toolbox {
          all: initial;
          position: fixed;
          top: 15px;
          left: 15px;
          height: 260px;
          width: 200px;
          z-index: 999999999999;
        }
    `;
    document.head.appendChild(stylesheet);
    iframe.style.visibility = "visible";
    toolbox = iframe;

    // Load settings
    const getSettings = browser.storage.local.get("settings");
    getSettings.then((data) => {
        const autoSaveSetting = data["settings"][0]["autoSave"];
        const maxUndoSetting = data["settings"][0]["maxUndo"];
        const cursorTypeSetting = data["settings"][0]["cursor"];
        autosave = autoSaveSetting;
        undoRedoCap = maxUndoSetting;
        cursorType = cursorTypeSetting;
        if (cursorType == "crosshair" || cursorType == "both") {
          console.log("settin ccanvas cursor");
          canvas.style.cursor = "crosshair";
        }
        if (cursorType == "crosshair") {
          cursor.style.visibility = "hidden";
        }
    });

    //document.addEventListener("click", handleClickEvent);
    document.addEventListener("contextmenu", noContext);
    document.addEventListener("mousemove", handleMouseMoveEvent);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener('keydown', keyPressHandler);

    addEventListener("beforeunload", (e) => {
      if (autosave) {
        save();
      } else if (changes) {
        e.preventDefault();
      }
    })

    toolbox.addEventListener("mouseout", () => {
      if (cursorType != "crosshair") {
        cursor.style.visibility = "visible";
      }
      
    })
    toolbox.addEventListener("mouseover", () => {
      cursor.style.visibility = "hidden";
    })

    load();
    updateUndoStack();
  } else {
    toolbox.style.visibility = "visible";
    canvas.style.visibility = "visible";
  }
}

function noContext(e) {
  if (canvas.matches(':hover')) {
    e.preventDefault();
    return false;
  }
}

function removePathFromStack(stack) {
  return new Promise(function (resolve, reject) {
    let toRemove = stack.pop();
    resolve(toRemove);
  })
}

function undoPath() {
  if (!undoredoAction && saveStates.length > 1) {
    console.log("undoing");
    undoredoAction = true;
    redoStates.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    removePathFromStack(saveStates).then(() => {
      ctx.clearRect(0,0,canvas.width,canvas.height); 
      if (saveStates.length > 0) {
        ctx.putImageData(saveStates[saveStates.length-1],0,0);
      }
      undoredoAction = false;
    })
    changes = true;
  }
}

function redoPath() {
  if (!undoredoAction && redoStates.length > 0) {
    console.log("redoing it");
    undoredoAction = true;
    saveStates.push(redoStates[redoStates.length-1]);
    removePathFromStack(redoStates).then((p) => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.putImageData(p,0,0);
      undoredoAction = false;
    })
    changes = true;
  } else {
    console.log("not redoing it :(");
  }
}

function onMouseDown(e) {
  if (mode == "draw" || mode == "erase") {
    ctx.strokeStyle = color;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = penWidth;
    ctx.beginPath();
    ctx.moveTo(e.pageX, e.pageY);
  }
}

function onMouseUp(e) {
  if ((mode == "draw" || mode == "erase") && e.button == 0 && canvas.matches(":hover")) {
    if (mode == "draw") {
      draw(e.pageX,e.pageY);
    } else if (mode == "erase") {
      erase(e.pageX,e.pageY);
    }
    changes = true;
    updateUndoStack();
  }
}

function updateUndoStack() {
  saveStates.push(ctx.getImageData(0,0,canvas.width,canvas.height));
  console.log(saveStates);
  if (redoStates.length > 0) {
    redoStates = [];
  }
  if (saveStates.length > undoRedoCap+1) {
    saveStates.shift();
  }
}

/*function handleClickEvent(e) {
  if (mode == "draw") {
    draw(e.pageX,e.pageY);
  } else if (mode == "erase") {
    erase(e.pageX,e.pageY);
  }
}*/

function handleMouseMoveEvent(e) {
  updateCursor(e);
  if (mode == "draw" && e.buttons == 1) {
    draw(e.pageX,e.pageY);
  } else if (mode == "erase" && e.buttons == 1) {
    erase(e.pageX,e.pageY);
  }
}

function updateCursor(e) {
  cursor.style.height = penWidth + "px";
  cursor.style.width = penWidth + "px";
  cursor.style.borderRadius = penWidth + "px";
  cursor.style.left = e.clientX + "px";
  cursor.style.top = e.clientY + "px";

  if (mode == "cursor") {
    cursor.style.opacity = 0;
  } else {
    cursor.style.opacity = 1;
  }
}

function updateStatus(status) {
  mode = status;
  if (status == "cursor") {
    canvas.inert = true;
  } else {
    canvas.inert = false;
  }
}

function draw(x,y) {
  if (canvas && toolbox.style.visibility != "hidden") {
    ctx.lineTo(x,y);
    ctx.stroke(); 
  }
}

function erase(x,y) {
  if (canvas && toolbox.style.visibility != "hidden") {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineTo(x,y);
    ctx.stroke();
    ctx.restore()
  }
}

function updatePenSize(penSize) {
  penWidth = penSize;
}

function clearBoard() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  updateUndoStack();
  canvas.focus();
}

async function save() {
  console.log("TRYING TO SAVE");
  const canvasData = canvas.toDataURL();
  const save = browser.storage.local.set({[webPath]:[[canvasData,colors]]});
  save.then(() => {
    console.log("SAVED");
    changes = false;
  }, onError)
}

function load() {
  console.log("LOADING");
  const canvasData = browser.storage.local.get(webPath);
  canvasData.then((result) => {
    toolbox.contentWindow.postMessage(data=result[webPath][0][1],targetOrigin=toolbox.src);
    const imageData = result[webPath][0][0];
    const image = new Image();
    image.onload = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(image,0,0)
      updateUndoStack();
      console.log("LOADED");
    }
    image.src = imageData;
  }, onError);
}

function minimizeToolbox() {
  toolbox.style.opacity = 0.5;
}

function maximizeToolbox() {
  toolbox.style.opacity = 0;
}

function onError(e) {
  console.log(e);
}

/*window.onresize = () => {
  canvas.width = document.body.scrollWidth;
  canvas.height = document.body.scrollHeight;


  // canvas clearing
  /*canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}*/

function keyPressHandler(e) {
      if (e.ctrlKey && e.shiftKey && e.keyCode == 90) {
        redoPath();
      }
      else if (e.ctrlKey && e.keyCode == 90) {
        undoPath();
      }
}

function newColor(updated) {
  color = updated;
}

function updateColors(newColors) {
  colors = newColors;
}

function dragToolbox(x,y) {
  toolbox.style.left = parseInt(getComputedStyle(toolbox).left.replace('px','')) + x + 'px';
  toolbox.style.top = parseInt(getComputedStyle(toolbox).top.replace('px','')) + y + 'px';
}

annotationActions = {
  "openclose":openclose,
  "updateStatus":updateStatus,
  "save": save,
  "load": load,
  "maximizeToolbox": maximizeToolbox,
  "minimizeToolbox": minimizeToolbox,
  "updatePenSize": updatePenSize,
  "newColor": newColor,
  "colorUpdate": updateColors,
  "undoPath": undoPath,
  "redoPath": redoPath, 
  "clearBoard": clearBoard,
  "dragToolbox": dragToolbox
}

browser.runtime.onMessage.addListener((message) => {
  annotationActions[message.command].apply(null,message.status);
})