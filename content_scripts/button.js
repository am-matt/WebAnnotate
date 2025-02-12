function onError(error) {
    console.error(`Error: ${error}`);
  }

function openclose(tabs) {
    browser.tabs.sendMessage(tabs[0].id, "ext-openclose");
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