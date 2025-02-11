(() => {
    var toolbox;
    var opened = false;
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */
    if (window.hasRun) {
      return;
    }
    window.hasRun = true;

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
              z-index: 99999;
            }
        `;
        document.head.appendChild(stylesheet);
        toolbox = iframe;
      } else {
        toolbox.style.visibility = "visible"
      }
      
    }
  
    /**
     * Listen for messages from the background script.
     * Call "insertBeast()" or "removeExistingBeasts()".
     */
    browser.runtime.onMessage.addListener((message) => {
      if (message.command === "openclose") {
        openclose();
      }
    });
  })();