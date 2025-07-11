$ = (e) => {return document.getElementById(e);}
const dataTable = $("dataTable");
const totalUsageText = $("totalStorage");

function round(num,place) {
    return +num.toFixed(place);
}

function updateStorage() {
    const storage = browser.storage.local.get(null);
    storage.then((data) => {
        const totalStorageUsage = JSON.stringify(data).length;
        if (totalStorageUsage < 1000) {
            totalUsageText.innerText = round(totalStorageUsage,2) + "B";
        } else if (totalStorageUsage < 1000000) {
            totalUsageText.innerText = round((totalStorageUsage/1000),2) + "KB";
        } else if (totalStorageUsage < 1000000000) {
            totalUsageText.innerText = round((totalStorageUsage/1000000),2) + "MB";
        } else {
            totalUsageText.innerText = round((totalStorageUsage/1000000000),2) + "GB";
        }
    })

}

const getStorage = browser.storage.local.get(null);
getStorage.then((data) => {
    updateStorage();

    const domains = Object.entries(data);
    domains.forEach((ref) => {
        const row = document.createElement("tr");
        row.className = "dataEntry";

        const linkCell = document.createElement("td");
        linkCell.innerText = ref[0];
        row.appendChild(linkCell);

        const usage = JSON.stringify(ref[1][0]).length;
        const usageCell = document.createElement("td");
        if (usage < 1000) {
            usageCell.innerText = round(usage,2) + "B";
        } else if (usage < 1000000) {
            usageCell.innerText = round((usage/1000),2) + "KB";
        } else {
            usageCell.innerText = round((usage/1000000),2) + "MB";
        }
        row.appendChild(usageCell);

        const downloadCell = document.createElement("td");
        const downloadButton = document.createElement("button");
        downloadButton.innerText = "Download";
        downloadCell.appendChild(downloadButton);
        row.appendChild(downloadCell);

        downloadButton.addEventListener("click", (e) => {
            const a = document.createElement('a');
            a.href = ref[1][0][0];
            a.download = ref[1][0][0];
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        })

        const deleteCell = document.createElement("td");
        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete";
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        deleteButton.addEventListener("click", (e) => {
            row.remove();
            browser.storage.local.remove(ref[0]);
            updateStorage();
        })

        dataTable.appendChild(row);
    })
})