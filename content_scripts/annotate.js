const webPath = window.location.href.split('?')[0];

// canvas handling
var toolbox;
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
var toolboxAnchor = [];
var saveStates = [];
var redoStates = [];

var undoRedoCapBroken = false;

var maxCanvasHeight;
var canvas = [];
var canvasWithChanges = [];
var currCanvas;
var currCtx;
var ctx;

var canvasDiv;

var toolboxHeight = 311;
var toolboxWidth = 215;

function isElementInViewport(el) {
    var rect = el.getBoundingClientRect();
    // DOMRect { x: 8, y: 8, width: 100, height: 100, top: 8, right: 108, bottom: 108, left: 8 }
    var windowHeight = (window.innerHeight || document.documentElement.clientHeight);
    var windowWidth = (window.innerWidth || document.documentElement.clientWidth);

    // http://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap
    var vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
    var horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);

    return (vertInView && horInView);
}

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
    canvasDiv.style.display = "none";
    cursor.style.visibility = "hidden";
  }
}

function getCtx(c) {
  return c.getContext("2d");
}

function setCurrentCanvas(e) {
  currCanvas = e.target;
  currCtx = e.target.getContext("2d");
  /*if (e.buttons == 1) {
    ctx.strokeStyle = color;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = penWidth;
    ctx.beginPath();
    ctx.moveTo(e.pageX, getCorrectY(e.pageY));
  }*/
}

function makeCanvas(width, height, div, id) {
  var newCanvas = document.createElement("canvas");
  div.append(newCanvas);
  newCanvas.style.all = "initial";
  newCanvas.className = "webannotate-canvas";
  newCanvas.width = width;
  newCanvas.height = height;
  newCanvas.style.userSelect = "none";
  newCanvas.style.zIndex = 999999999;
  newCanvas.style.cursor = "inherit";
  newCanvas.style.margin = 0;
  newCanvas.style.lineHeight = "0px";
  newCanvas.setAttribute("order",id);
  newCanvas.verticalAlign = "top";
  newCanvas.onmouseover = setCurrentCanvas;
  canvas.push(newCanvas);
}

function createCanvases() {
    canvas = [];
    var webWidth = document.body.scrollWidth;
    var webHeight = document.body.scrollHeight;
    var maxHeight = pixelLimit/webWidth;
    maxCanvasHeight = maxHeight;
    var canvasToMake = Math.ceil(webHeight/maxHeight);

    if (canvasDiv) {
      const c = Array.from(canvasDiv.children);
      c.forEach((ele) => {
        ele.remove();
      })
    } else {
      canvasDiv = document.createElement("div");
      canvasDiv.id = "webannotate-canvasdiv";
      canvasDiv.style.position = "absolute";
      canvasDiv.style.display = "block";
      canvasDiv.style.verticalAlign = "top";
      canvasDiv.style.cursor = "none";
      canvasDiv.style.zIndex = 999999999;
      canvasDiv.style.top = 0;
      canvasDiv.style.left = 0;
      canvasDiv.style.lineHeight = "0px";
      canvasDiv.inert = true;
      document.body.append(canvasDiv);
    }
    var remainingHeight = webHeight;
    for (var ct = 0; ct < canvasToMake; ct++) {
      if (ct == canvasToMake-1) {
        makeCanvas(webWidth,remainingHeight,canvasDiv, ct);
      } else {
        makeCanvas(webWidth,maxHeight,canvasDiv, ct);
        remainingHeight = remainingHeight - maxHeight;
      }
    }
}

const pixelLimit = 5000000;
function loadToolbox() {
  if (!toolbox) {
    const mainFrame = document.createElement("iframe");
    const txt = document.documentElement.outerHTML;
    mainFrame.srcdoc = txt;
    mainFrame.style.width = document.body.clientWidth + "px";
    mainFrame.style.height = document.body.clientHeight + "px";
    document.body.innerHTML = "";
    document.body.appendChild(mainFrame);

    document.body.style.overflow = "hidden"

    console.log("loading toolbox....")
    const iframe = document.createElement("iframe");
    iframe.id = 'ext-toolbox';
    iframe.allowTransparency = true;
    iframe.onload = load;
    iframe.src = browser.extension.getURL("ui/toolbox.html");
    document.body.append(iframe);

    createCanvases();

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
    cursor.style.zIndex = canvasDiv.style.zIndex + 1;
    document.body.append(cursor);

    /* 215px x 311px */
    const stylesheet = document.createElement("style");
    stylesheet.textContent = `
        #ext-toolbox {
          all: initial;
          color-scheme: dark;
          position: fixed;
          top: 15px;
          left: 15px;
          height: ${toolboxHeight}px;
          width: ${toolboxWidth}px;
          z-index: 999999999999;
          transition: height 0.1s ease-out, width 0.1s ease-out;
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
        undoRedoCap = parseInt(maxUndoSetting);
        cursorType = cursorTypeSetting;
        if (cursorType == "crosshair" || cursorType == "both") {
          canvasDiv.style.cursor = "crosshair";
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
      collapseToolbox();
    })
    toolbox.addEventListener("mouseover", () => {
      cursor.style.visibility = "hidden";
      expandToolbox();
    })
  } else {
    toolbox.style.visibility = "visible";
    canvasDiv.style.display = "block";
    if (cursorType != "crosshair") {
      cursor.style.visibility = "visible";
    }
  }

  
  

  /*// Wrap everything in new DIV (im sure everything will go very well)
  const siteDiv = document.createElement("div");
  document.body.style = "width: 1504px; min-width: 1504px; margin: auto 0;";
  siteDiv.id = "webannotate-sitediv";
  ;[ ...document.body.childNodes ].forEach(child => siteDiv.appendChild(child));
  document.body.appendChild(siteDiv);*/

  // check every rule and find the media queries
  /*[...document.styleSheets].forEach((stylesheet) => {
    const rules = stylesheet.cssRules;
    for (let i = 0; i < rules.length; i++) {
      if (rules[i].media) {
        const mediaQueryList = window.matchMedia(rules[i].conditionText);
        if (!mediaQueryList.matches) {
          console.log(rules[i]);
          stylesheet.deleteRule(i);
        }
      }
    }
  })*/
}

function collapseToolbox() {
  toolbox.contentWindow.postMessage(data={command:"collapseToolbox"},targetOrigin=toolbox.src);
  toolbox.style.height = "60px";
  toolbox.style.width = "60px";
  // right, bottom, xcenter, ycenter
  fixToolboxPos("collapse");
}

function expandToolbox() {
  toolbox.contentWindow.postMessage(data={command:"expandToolbox"},targetOrigin=toolbox.src);
  toolbox.style.height = `${toolboxHeight}px`;
  toolbox.style.width = `${toolboxWidth}px`;
  fixToolboxPos("expand");
}

//Original: 260x200 
function fixToolboxPos(type) {
  var multiplier = 1;
  if (type == "expand") { multiplier = -1; }
  if (toolboxAnchor.includes("right")) {
    toolbox.style.left = noPx(toolbox.style.left) + (((toolboxWidth)-60-15)*multiplier) + "px";
  }
  if (toolboxAnchor.includes("bottom")) {
    toolbox.style.top = noPx(toolbox.style.top) + (((toolboxHeight)-60-15)*multiplier) + "px";
  }
  if (toolboxAnchor.includes("xcenter")) {
    toolbox.style.left = noPx(toolbox.style.left) + (((toolboxWidth/2)-60) * multiplier) + "px";
  }
  if (toolboxAnchor.includes("ycenter")) {
    toolbox.style.top = noPx(toolbox.style.top) + (((toolboxHeight/2)-60) * multiplier) + "px";
  }
}

function noContext(e) {
  if (canvasDiv.matches(':hover')) {
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

function updateUndoStack() {
  var state = [];
  canvasWithChanges.forEach((c) => {
    state.push({data:c.getContext("2d").getImageData(0,0,c.width,c.height),order:c.getAttribute("order")});
  });
  saveStates.push(state);
  if (redoStates.length > 0) {
    redoStates = [];
  }
  if (saveStates.length > parseInt(undoRedoCap+1)) {
    console.log("shifting...");
    undoRedoCapBroken = true;
    saveStates.shift();
  }
}

function undoPath() {
  if (!undoredoAction && saveStates.length > 1) {
    undoredoAction = true;
    redoStates.push(saveStates[saveStates.length-1]);
    var toUpdate = [];
    saveStates[saveStates.length-1].forEach((state) => { toUpdate.push(state.order); })
    removePathFromStack(saveStates).then(() => {
      if (saveStates.length > 0) {
        toUpdate.forEach((order) => {
          var updated = false;
          can:
          for (var i = saveStates.length-1; i > -1; i--) {
            for(var j = 0; j < saveStates[i].length; j++)  {
              var state = saveStates[i][j];
              if (state.order == order) {
                canvas[state.order].getContext("2d").clearRect(0,0,canvas[state.order].width,canvas[state.order].height);
                canvas[state.order].getContext("2d").putImageData(state.data,0,0);
                updated = true
                break can;
              }
            }
          }
          if (!updated) { 
            if (!undoRedoCapBroken) {
              canvas[order].getContext("2d").clearRect(0,0,canvas[order].width,canvas[order].height);
            }
          }
        });
      }
      undoredoAction = false;
    })
    changes = true;
  }
}

function redoPath() {
  if (!undoredoAction && redoStates.length > 0) {
    undoredoAction = true;
    saveStates.push(redoStates[redoStates.length-1]);
    removePathFromStack(redoStates).then((p) => {
      p.forEach((state) => {
        var ctx = canvas[state.order].getContext("2d");
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.putImageData(state.data,0,0);
      })
      undoredoAction = false;
    })
    changes = true;
  }
}

function isHovering(element1, element2) {
  const rect1 = element1.getBoundingClientRect();
  const rect2 = element2.getBoundingClientRect();

  return (
    rect1.top < rect2.bottom &&
    rect1.bottom > rect2.top &&
    rect1.left < rect2.right &&
    rect1.right > rect2.left
  );
}

function onMouseDown(e) {
  if (mode == "draw" || mode == "erase") {
    canvasDiv.setPointerCapture(e.pointerId);
    canvasWithChanges = [];
    canvas.forEach((c) => {
      if (isHovering(c,cursor) && !canvasWithChanges.includes(c)) {
        canvasWithChanges.push(c); 
      }
      var ctx = c.getContext("2d");
      ctx.strokeStyle = color;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = penWidth;
      ctx.beginPath();
      ctx.moveTo(e.pageX, getCorrectY(e.pageY,c.getAttribute("order")));
    })
  }
}

function onMouseUp(e) {
  if ((mode == "draw" || mode == "erase") && e.button == 0) {
    canvasDiv.releasePointerCapture(e.pointerId);
    if (mode == "draw") {
      draw(e.pageX,e.pageY);
    } else if (mode == "erase") {
      erase(e.pageX,e.pageY);
    }
    changes = true;
    updateUndoStack();
  }
}

function getCorrectY(pageY,currOrder) {
  //const currOrder = canvas.getAttribute("order");
  const y = pageY - (maxCanvasHeight*currOrder);
  return y;
}

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
    canvasDiv.inert = true;
  } else {
    canvasDiv.inert = false;
  }
}

function draw(x,y) {
  if (canvasDiv && toolbox.style.visibility != "hidden") {
    canvas.forEach((c) => {
      if (isElementInViewport(c)) {
        if (isHovering(c,cursor) && !canvasWithChanges.includes(c)) {
          canvasWithChanges.push(c); 
        }
        var ctx = c.getContext("2d");
        ctx.lineTo(x,getCorrectY(y,c.getAttribute("order")));
        ctx.stroke(); 
      }
    })
  }
}

function erase(x,y) {
  if (canvasDiv && toolbox.style.visibility != "hidden") {
    canvas.forEach((c) => {
      if (isElementInViewport(c)) {
        if (isHovering(c,cursor) && !canvasWithChanges.includes(c)) {
          canvasWithChanges.push(c); 
        }
        var ctx = c.getContext("2d");
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineTo(x,getCorrectY(y,c.getAttribute("order")));
        ctx.stroke();
        ctx.restore()
      }
    })
  }
}

function updatePenSize(penSize) {
  penWidth = penSize;
}

function clearBoard() {
  canvas.forEach((c) => {
    var ctx = c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);
    canvasWithChanges.push(c);
  });
  updateUndoStack();
  canvasDiv.focus();
}

async function save(autosaveRequired=false) {
  if (!autosaveRequired || (autosaveRequired && autosave)) {
    console.log("TRYING TO SAVE");
    const canvasData = [];
    canvas.forEach((c)=> {
      canvasData.push(c.toDataURL());
    })
    const save = browser.storage.local.set({[webPath]:[[canvasData,colors]]});
    save.then(() => {
      console.log("SAVED");
      changes = false;
    }, onError)
  }

}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  })
}

function loadAllImages(srcArr) {
  const promises = srcArr.map(loadImage);
  return Promise.all(promises);
}

function load() {
  console.log("LOADING");
  const canvasData = browser.storage.local.get(webPath);
  canvasData.then((result) => {
    if (!result[webPath]) {
      console.log("No save data found");
      return;
    }
    toolbox.contentWindow.postMessage(data={command:"addLoadedColors",status:[result[webPath][0][1]]},targetOrigin=toolbox.src);
    const imageData = result[webPath][0][0];
    var images = [];
    for (var i = 0; i < canvas.length; i++) {
      images[i] = imageData[i];
    }
    loadAllImages(images).then((imgs) => {
      for (var i = 0; i < canvas.length; i++) {
        const c = canvas[i];
        const ctx = c.getContext("2d");
        const image = imgs[i];
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(image,0,0);
      }
      console.log("LOADED");
      canvas.forEach((c)=>{canvasWithChanges.push(c);})
      updateUndoStack();
    });
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
  toolbox.style.transition = "none";
  toolbox.style.left = parseInt(getComputedStyle(toolbox).left.replace('px','')) + x + 'px';
  toolbox.style.top = parseInt(getComputedStyle(toolbox).top.replace('px','')) + y + 'px';
}

function getDistance(x1,y1,x2,y2) {
  return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
}

function noPx(css) {
  return parseInt(css.replace('px',''));
}

function setToolboxPos() {
  toolboxAnchor = [];
  var margin = 15;
  var newX;
  var newY;
  var menuWidth = toolbox.clientWidth;
  var menuHeight = toolbox.clientHeight;
  var currentX = parseInt(getComputedStyle(toolbox).left.replace('px','')) + (menuWidth/2);
  var currentY = parseInt(getComputedStyle(toolbox).top.replace('px','')) + (menuHeight/2);
  var viewportWidth = window.innerWidth;
  var viewportHeight = window.innerHeight;
  var centerX = viewportWidth / 2;
  var centerY = viewportHeight / 2;
  var xFromCenter = Math.abs(centerX - currentX);
  var yFromCenter = Math.abs(centerY - currentY);

  var xToWall = xFromCenter/viewportWidth;
  var yToWall = yFromCenter/viewportHeight;
  var cornerPercent = xToWall+yToWall;

  if (cornerPercent > 0.6) {
    var topLeft = getDistance(currentX,currentY,0,0);
    var topRight = getDistance(currentX,currentY,viewportWidth-menuWidth,0);
    var bottomLeft = getDistance(currentX,currentY,0,viewportHeight-menuHeight);
    var bottomRight = getDistance(currentX,currentY,viewportWidth-menuWidth,viewportHeight-menuHeight);
    var closestCorner = Math.min(topLeft,topRight,bottomLeft,bottomRight);
    // not the cleanest implementation..
    if (closestCorner == topLeft) {
      newX = margin + "px";
      newY = margin + "px";
    } else if (closestCorner == topRight) {
      newX = (viewportWidth - margin - menuWidth) + "px";
      newY = margin + "px";
      toolboxAnchor.push("right");
    } else if (closestCorner == bottomLeft) {
      newX = margin + "px";
      newY = (viewportHeight - margin - menuHeight) + "px";
      toolboxAnchor.push("bottom");
    } else {
      newX = (viewportWidth - margin - menuWidth) + "px";
      newY = (viewportHeight - margin - menuHeight) + "px";
      toolboxAnchor.push("right","bottom");
    }
  } else {
    //determine whether to stick to x or y plane
    if (xToWall > yToWall) {
      toolboxAnchor.push("ycenter");
      if (currentX < (0.5)*viewportWidth) {
        newX = margin + "px";
      } else {
        newX = (viewportWidth - margin - menuWidth) + "px";
        toolboxAnchor.push("right");
      }
    } else {
      toolboxAnchor.push("xcenter");
      if (currentY < (0.5)*viewportHeight) {
        newY = margin + "px";
      } else {
        newY = (viewportHeight - margin - menuHeight) + "px";
        toolboxAnchor.push("bottom");
      }
    }
  }

  toolbox.style.transition = "all 0.2s ease-out";
  toolbox.style.left = newX;
  toolbox.style.top = newY;
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
  "dragToolbox": dragToolbox,
  "setToolboxPos": setToolboxPos,
  "toolboxDOMLoaded": collapseToolbox
}

browser.runtime.onMessage.addListener((message) => {
  annotationActions[message.command].apply(null,message.status);
})