var activeTabs = [];

function onError(error) {
    console.error(`Error: ${error}`);
}

// Annotation Script Adding

function openclose(tabs) {
    if (!getTab(tabs[0].id)) {
        activeTabs.push([tabs[0].id,tabs[0].width]);
    }
    browser.tabs.sendMessage(tabs[0].id, {command: "openclose"});
}

function getTab(id) {
    for (let i = 0; i < activeTabs.length; i++) {
        if (activeTabs[i][0] == id) {
            return i;
        }
    }
    return null;
}

browser.tabs.onUpdated.addListener(function(tabId, changeInfo) {
    if (changeInfo.status == "complete") {
        browser.tabs.executeScript(tabId, {file: "content_scripts/annotate.js"})
    }
})

browser.tabs.onRemoved.addListener((id)=>{
    if (getTab(id) != null) {
        activeTabs.splice(getTab(id),1);
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
        const getActualWindow = browser.windows.get(window.id,getInfo={populate:true});
        getActualWindow.then((actualWindow)=>{
            if (actualWindow.width != window.width) {
                // check tabs of importance
                actualWindow.tabs.forEach((tab)=>{
                    if (getTab(tab.id) != null) {
                        browser.tabs.setZoom(tab.id,actualWindow.width/activeTabs[getTab(tab.id)][1]);
                    }
                })
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