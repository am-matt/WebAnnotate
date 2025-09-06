var activeTabs = []; // [[tabId, mainWidth, defaultZoomLevel, toolboxOpened]]

function onError(error) {
    console.error(`Error: ${error}`);
}

// Annotation Script Adding

function openclose(tabs) {
    const tab = getTab(tabs[0].id);
    if (tab == null) {
        const getZoom = browser.tabs.getZoom(tabs[0].id);
        getZoom.then((level)=>{
            console.log(level);
            activeTabs.push([tabs[0].id,tabs[0].width,level,true]);
        });
    } else {
        activeTabs[tab][3] = !activeTabs[tab][3];
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
                    const currTab = getTab(tab.id);
                    if (currTab != null && activeTabs[currTab][3]) {
                        activeTabs[getTab(tab.id)][2] = actualWindow.width/activeTabs[getTab(tab.id)][1];
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

browser.tabs.onZoomChange.addListener((e)=>{
    const currTab = getTab(e.tabId);
    if (currTab != null 
        && e.newZoomFactor != activeTabs[currTab][2] 
        && e.oldZoomFactor == activeTabs[currTab][2]
        && activeTabs[currTab][3]) {
        if (e.newZoomFactor > e.oldZoomFactor) {
            console.log("zooming in");
            browser.tabs.sendMessage(e.tabId, {command:"zoom",status:["in"]})
        } else {
            console.log("zooming out");
            browser.tabs.sendMessage(e.tabId, {command:"zoom",status:["out"]});
        }
        browser.tabs.setZoom(e.tabId,activeTabs[currTab][2]);
    }
});

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