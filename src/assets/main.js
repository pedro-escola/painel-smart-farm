
let farmData = {}
const API_LINK = "https://smart-farm-d6948-default-rtdb.firebaseio.com/leituras.json"

/** @type {HTMLElement} */
let umidadeTexto;

document.addEventListener("DOMContentLoaded", () => {
    umidadeTexto = document.getElementById("umidadeTexto");

    const eventSource = new EventSource(API_LINK);

    eventSource.addEventListener("put", (event) => {
        const json = JSON.parse(event.data);

        onNewData(json);
    })

    eventSource.addEventListener("patch", (event) => {
        const json = JSON.parse(event.data);
        const path = json["path"].substring(1)

        if (!path) {
            farmData = {...farmData, ...json["data"]}
        } else {
            farmData[path] = {...farmData[path], ...json["data"]}
        }

        updateLogs();
    })
})

/**
 * Triggered when a new "put" event is received, signifying we have new data to receive
 * @param {Object} json
 */
function onNewData(json) {
    if (!json) { return }
    
    const /** @type {String} */ path = json["path"];
    const /** @type {Object} */ jsonData = json["data"];
    let data;

    if (path === "/") {
        const keys = Object.keys(jsonData);
        const lastKey = keys[keys.length - 1];

        data = jsonData[lastKey];
        farmData = jsonData;
    } else {
        data = jsonData;
        farmData[path.substring(1)] = jsonData
    }

    umidadeTexto.innerText = `umidade: ${data["umidade"]}%`;
    console.log(data);

    updateLogs();
}

function updateLogs() {
    /*const keys = Object.keys(farmData);
    const logElement = document.getElementById("logs");

    logElement.innerText = "";
    for (let key of keys) {
        const element = document.createElement("li")

        element.innerText = `umidade: ${farmData[key]["umidade"]}%`
        logElement.appendChild(element);
    }*/
    console.log("updated logs!")
}