
const API_LINK = "https://smart-farm-d6948-default-rtdb.firebaseio.com/leituras.json"
let umidadeTexto = document.getElementById("umidadeTexto");

document.addEventListener("DOMContentLoaded", () => {
    umidadeTexto = document.getElementById("umidadeTexto");

    const eventSource = new EventSource(API_LINK);

    eventSource.addEventListener("put", (event) => {
        const json = JSON.parse(event.data);

        onNewData(json);
    })

    /*
    eventSource.addEventListener("patch", (event) => {
        const json = JSON.parse(event.data);
        const path = json["path"].substring(1)

        if (!path) {
            farmData = {...farmData, ...json["data"]}
        } else {
            farmData[path] = {...farmData[path], ...json["data"]}
        }
    })
    */
})

/**
 * Triggered when a new "put" event is received, signifying we have new data to receive
 * @param {Object} json
 */
function onNewData(json) {
    if (!json) { return }
    
    const path = json["path"];
    const jsonData = json["data"]
    let data;

    if ((!path) || (path === "/")) {
        let keys = Object.keys(jsonData);
        let lastKey = keys[keys.length - 1];

        data = jsonData[lastKey];
    } else {
        data = jsonData;
    }

    umidadeTexto.innerText = `umidade: ${data["umidade"]}%`
}