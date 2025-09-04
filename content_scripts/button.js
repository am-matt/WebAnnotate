function onError(error) {
    console.error(`Error: ${error}`);
}

// Annotation Script Adding

function openclose(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {command: "openclose"});
}

browser.tabs.onUpdated.addListener(function(tabId, changeInfo) {
    if (changeInfo.status == "complete") {
        browser.tabs.executeScript(tabId, {file: "content_scripts/annotate.js"})
    }
})

// Window Resize Detection
var windowData = [];
function searchForWindowById(id) {
    windowData.forEach((window)=>{
        if (window.id == id) {
            return windowData.indexOf(window);
        }
    })
    return null;
}
function checkForWindowResize() {
    windowData.forEach((window)=> {
        const getActualWindow = browser.windows.get(window.id);
        getActualWindow.then((actualWindow)=>{
            if (actualWindow.width != window.width) {
                console.log("Old Width: " + window.width + " New Width: " + actualWindow.width);
                windowData[windowData.indexOf(window)] = actualWindow;
            }
        });
    });
}
function getAllCurrentWindows() {
    const getWindows = browser.windows.getAll();
    getWindows.then((windows)=>{
        windows.forEach((window)=>{
            windowData.push(window);
        })
    })
}
browser.windows.onCreated.addListener((window)=> {
    windowData.push(window);
});
browser.windows.onRemoved.addListener((window)=>{
    const windowIndex = searchForWindowById(window.id);
    if (windowIndex) {
        windowData.splice(windowIndex,1);
    }
})
getAllCurrentWindows();
setInterval(checkForWindowResize, 100);

// Button Click
browser.browserAction.onClicked.addListener(() => {
    browser.tabs
    .query({
      currentWindow: true,
      active: true,
    })
    .then(openclose)
    .catch(onError);
});

// Script Communication
browser.runtime.onMessage.addListener((message,sender) => {
    if (message.command == "settings") {
        var createData = {
          url: "settings/settings.html",
        };
        var creating = browser.tabs.create(createData);
    } else {
        browser.tabs.sendMessage(sender.tab.id, {command: message.command, status: message.status});
    }
})

// Settings Button
browser.contextMenus.create(
    {
        id: "open-ext-settings",
        title: "WebAnnotate Settings",
        contexts: ["browser_action"],
        onclick: () => {
            var createData = {
                url: "settings/settings.html",
            };
            var creating = browser.tabs.create(createData);
        }
    }
)

// Data Stuff
const getSettings = browser.storage.local.get("settings");
getSettings.then((data) => {
    console.log(data);
    if (Object.keys(data) == 0) {
        // create new settings data
        console.log("CREATING NEW SETTINGS DATA (with default settings)");
        const default_settings = {
            colors: ["#FF0000","#00FF00","#0000FF"],
            autoSave: true,
            maxUndo: 50,
            cursor: "circle"
        }
        browser.storage.local.set({settings:[default_settings]});
    }
})