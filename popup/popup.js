/**
* Listen for clicks on the buttons, and send the appropriate message to
* the content script in the page.
*/
function listenForClicks() {
    document.addEventListener("click", (e) => {
        function openclose(tabs) {
            browser.tabs.sendMessage(tabs[0].id, {
                command: "openclose"
            });
        }

        /**
        * Just log the error to the console.
        */
        function reportError(error) {
            console.error(`Error: ${error}`);
        }

        /**
        * Get the active tab,
        * then call "beastify()" or "reset()" as appropriate.
        */
        if (e.target.tagName !== "BUTTON" || !e.target.closest("#popup-content")) {
            // Ignore when click is not on a button within <div id="popup-content">.
            return;
        }
        if (e.target.id === "openclose") {
            browser.tabs
            .query({ active: true, currentWindow: true })
            .then(openclose)
            .catch(reportError);
        }
    });
}
    
/**
* There was an error executing the script.
* Display the popup's error message, and hide the normal UI.
*/
function reportExecuteScriptError(error) {
    console.error(`Failed to execute script: ${error.message}`);
}

/**
* When the popup loads, inject a content script into the active tab,
* and add a click handler.
* If we couldn't inject the script, handle the error.
*/
browser.tabs.executeScript({ file: "/content_scripts/annotate.js" })
.then(listenForClicks)
.catch(reportExecuteScriptError);
