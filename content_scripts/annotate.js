var opened = false;

function openclose() {
    if (opened) {
        opened = false;
        console.log("no longer opened");
    } else {
        opened = true;
        console.log("opened");
    }
}

browser.runtime.onMessage.addListener((message) => {
    if (message == "openclose") {
        openclose();
    }
});

console.log("started running");