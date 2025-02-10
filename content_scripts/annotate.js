(() => {
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
            alert("no longer opened");
        } else {
            opened = true;
            alert("opened");
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