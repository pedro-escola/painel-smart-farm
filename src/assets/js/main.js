
var farmData = {}
var firstIndex = null;
var graph = null;
const API_LINK = "https://smart-farm-d6948-default-rtdb.firebaseio.com/leituras.json"

/** @type {HTMLElement} */
var umidadeTexto;

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
        updateGraph();
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
        const values = Object.values(jsonData);

        data = values[values.length - 1];
        farmData = jsonData;
    } else {
        data = jsonData;
        farmData[path.substring(1)] = jsonData
    }

    const values = Object.values(farmData);

    if (firstIndex == null) {
        firstIndex = values.length - 1
        let firstValue = data;
        for (let i = (firstIndex - 1); i > 0; i--) {
            const compareValue = values[i];

            if (compareValue["sequencia"] < firstValue["sequencia"]) {
                firstValue = compareValue;
                firstIndex = i;
            } else {
                break
            }
        }
    }

    umidadeTexto.innerText = `umidade: ${data["umidade"]}%`;
    console.log(data);

    updateLogs();
    updateGraph();
}

/**
 * Updates the logs with all of the data stored in the `farmData` Object.
 */
function updateLogs() {
    const values = Object.values(farmData);
    const logElement = document.getElementById("logs");

    logElement.innerText = "";
    for (let i = firstIndex; i < (values.length - 1); i++) {
        const element = document.createElement("li");
        const value = values[i];

        element.innerText = `umidade ${value["sequencia"]}: ${value["umidade"]}%`
        logElement.appendChild(element);
    }

    logElement.scrollTop = logElement.scrollHeight;
    console.log("updated logs!")
}

function createGraph() {
    if (graph !== null) return;

    const ctx = document.getElementById("graficoCanvas");

    graph = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [0, 50, 70, 30],
            datasets: [{
                label: 'Umidade',
                data: [],
                borderColor: 'blue',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3
            }, {
                label: 'Mínimo Umidade (20%)',
                data: [],
                borderColor: '#ef4444',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            scales: {
                x: { grid: { display: false } },
                y: {
                    min: 0,
                    max: 100,
                    ticks: { callback: function(value) { return value + "%" } }
                }
            },
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function updateGraph() {
    if (graph === null) createGraph();

    const values = Object.values(farmData);
    const farmEnd = values.length - 1;

    const data = [
        [], [], []
    ]
    for (let i = (farmEnd - 10); i < farmEnd; i++) {
        const value = values[i];

        data[0].push(value["sequencia"]);
        data[1].push(value["umidade"]);
        data[2].push(20);
    }

    graph.data.labels = data[0];
    for (let i = 0; i < 2; i++) {
        graph.data.datasets[i].data = data[i+1];
    }
    graph.update("none");
}

function parseMotivo(motivo) {
}
