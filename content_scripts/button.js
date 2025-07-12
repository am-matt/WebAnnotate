function onError(error) {
    console.error(`Error: ${error}`);
  }

function openclose(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {command: "openclose"});
}

browser.tabs.onUpdated.addListener(function(tabId, changeInfo) {
    if (changeInfo.status == "complete") {
        browser.tabs.executeScript(tabId, {file: "content_scripts/annotate.js"})
    }
})

browser.browserAction.onClicked.addListener(() => {
    browser.tabs
    .query({
      currentWindow: true,
      active: true,
    })
    .then(openclose)
    .catch(onError);
});

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
        }
        browser.storage.local.set({settings:[default_settings]});
    }
})