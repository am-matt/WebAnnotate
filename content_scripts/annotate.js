var toolbox;
var canvas;
var ctx;
var mode = "cursor";
var prevX, prevY
var opened = false;

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
  }
}

function loadToolbox() {
  if (!toolbox) {
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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.zIndex = 9999;
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.position = "fixed";
    
    const stylesheet = document.createElement("style");
    stylesheet.textContent = `
        .ext-toolbox {
          all: initial;
          position: fixed;
          top: 0;
          left: 0;
          height: 100px;
          width: 100px;
          z-index: 99999;
        }
    `;
    document.head.appendChild(stylesheet);
    iframe.style.visibility = "visible";
    toolbox = iframe;

    document.addEventListener("click", handleClickEvent);
    document.addEventListener("mousemove", handleMouseMoveEvent);
    document.addEventListener("mousedown", onMouseDown);
  } else {
    toolbox.style.visibility = "visible";
  }
}

function onMouseDown(e) {
  if (mode == "draw") {
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
  }
}

function handleClickEvent(e) {
  if (mode == "draw") {
    draw(e.clientX,e.clientY);
  }
}

function handleMouseMoveEvent(e) {
  if (mode == "draw" && e.buttons == 1) {
    draw(e.clientX,e.clientY);
  }
}

function updateStatus(status) {
  mode = status;
}

function draw(x,y) {
  if (canvas) {
    ctx.strokeStyle = "red";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 10;
    ctx.lineTo(x,y);
    ctx.stroke(); 
  }
}

window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

browser.runtime.onMessage.addListener((message) => {
  if (message == "ext-openclose") {
    openclose();
  } else if (message.command == "updateStatus") {
    updateStatus(message.status)
  }
  return true;
})