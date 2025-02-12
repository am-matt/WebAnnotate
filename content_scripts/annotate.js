var toolbox;
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
    
    const stylesheet = document.createElement("style");
    stylesheet.textContent = `
        .ext-toolbox {
          all: initial;
          position: fixed;
          top: 0;
          left: 0;
          height: 290px;
          width: 515px;
          z-index: 99999;
        }
    `;
    document.head.appendChild(stylesheet);
    iframe.style.visibility = "visible";
    toolbox = iframe;
  } else {
    toolbox.style.visibility = "visible";
  }
}


browser.runtime.onMessage.addListener((message) => {
  if (message == "ext-openclose") {
    openclose();
    return true;
  }
})