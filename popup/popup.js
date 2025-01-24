const opencloser = document.getElementById("openclose");

opencloser.onclick = (e) => {
    browser.runtime.sendMessage("openclose");
}   