const webPath = window.location.href.split('?')[0];

// canvas handling
var toolbox;
var canvas;
var ctx;
var mode = "cursor";
var prevX, prevY
var undoRedoCap = 10; // TEMPORARY, REPLACE WHEN SETTINGS IS IMPLEMENTED
var penWidth = 10; // TEMPORARY, REPLACE WHEN TOOLBOX IS FULLY IMPLEMENTED
var opened = false;
var undoredoAction = false;
var saveStack = [];
var currentPoints = [];
var color = "rgba(255,0,0,1)";
var colors = [];

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
    const div = document.createElement("div");
    div.className = 'ext-toolbox';
    const iframe = document.createElement("iframe");
    iframe.className = 'ext-toolbox';
    iframe.src = browser.extension.getURL("ui/toolbox.html");
    div.appendChild(iframe);
    document.body.append(div);
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
    canvas.style.cursor = "crosshair";
    canvas.inert = true;
    
    const stylesheet = document.createElement("style");
    stylesheet.textContent = `
        .ext-toolbox {
          all: initial;
          position: fixed;
          top: 15px;
          left: 15px;
          height: 250px;
          width: 200px;
          z-index: 999999999999;
        }
    `;
    document.head.appendChild(stylesheet);
    iframe.style.visibility = "visible";
    toolbox = iframe;

    //document.addEventListener("click", handleClickEvent);
    document.addEventListener("mousemove", handleMouseMoveEvent);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener('keydown', keyPressHandler);
  } else {
    toolbox.style.visibility = "visible";
    canvas.style.visibility = "visible";
  }
}

function removePathFromStack(stack) {
  return new Promise(function (resolve, reject) {
    let toRemove = stack.pop();
    resolve(toRemove);
  })
}

function undoPath() {
  if (!undoredoAction && saveStates.length != 0) {
    undoredoAction = true;
    redoStates.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    removePathFromStack(saveStates).then(() => {
      ctx.clearRect(0,0,canvas.width,canvas.height); 
      if (saveStates.length > 0) {
        ctx.putImageData(saveStates[saveStates.length-1],0,0);
      }
      undoredoAction = false;
    })
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
  if (mode == "draw" || mode == "erase") {
    if (mode == "draw") {
      draw(e.pageX,e.pageY);
    } else {
      erase(e.pageX,e.pageY);
    }
    saveStates.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    console.log(saveStates);
    if (redoStates.length > 0) {
      redoStates = [];
    }
    if (saveStates.length > undoRedoCap) {
      saveStates.shift();
    }
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
  if (mode == "draw" && e.buttons == 1) {
    draw(e.pageX,e.pageY);
  } else if (mode == "erase" && e.buttons == 1) {
    erase(e.pageX,e.pageY);
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

async function save() {
  console.log("TRYING TO SAVE");
  const canvasData = canvas.toDataURL();
  const save = browser.storage.local.set({[webPath]:[[canvasData,colors]]});
  save.then(() => {
    console.log("SAVED");
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

browser.runtime.onMessage.addListener((message) => {
  if (message == "ext-openclose") {
    openclose();
  } else if (message.command == "updateStatus") {
    updateStatus(message.status)
  } else if (message.command == "saveLoad") {
    if (message.status == "save") {
      save();
    } else {
      load();
    }
  } else if (message.command == "changeMenu") {
    if (message.status == "in") {
      maximizeToolbox();
    } else {
      minimizeToolbox();
    }
  } else if (message.command == "resize") {
    updatePenSize(message.status);
  } else if (message.command == "newColor") {
    color = message.status;
  } else if (message.command == "colorUpdate") {
    colors = message.status;
  } else if (message.command == "undoRedo") {
    if (message.status == "undo") {
      undoPath();
    } else {
      redoPath();
    }
  }
  return true;
})