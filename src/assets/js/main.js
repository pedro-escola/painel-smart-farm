
var farmData = {}
var firstIndex = null;
var graph = null;
const API_LINK = "https://smart-farm-d6948-default-rtdb.firebaseio.com/leituras.json"

document.addEventListener("DOMContentLoaded", () => {

    const eventSource = new EventSource(API_LINK);

    eventSource.addEventListener("put", (event) => {
        const json = JSON.parse(event.data);

        onNewData(json);
    })

    eventSource.addEventListener("patch", (event) => {
        const json = JSON.parse(event.data);
        const path = json["path"].substring(1)

        let tempData;
        if (!path) {
            tempData = {...farmData, ...json["data"]};
        } else {
            tempData = structuredClone(farmData);
            tempData[path] = {...farmData[path], ...json["data"]};
        }

        farmData = validateData(tempData);

        updateEverything();
    })
})

function validateData(data) {
    return Object.fromEntries(
        Object.entries(data).filter(([key, value]) => {
            return value?.["sequencia"] != undefined
        })
    )
}

/**
 * Triggered when a new "put" event is received, signifying we have new data to receive
 * @param {Object} json
 */
function onNewData(json) {
    if (!json) { return }
    
    const /** @type {String} */ path = json["path"];
    const /** @type {Object} */ jsonData = json["data"];

    let tempData;
    if (path === "/") {
        tempData = jsonData;
    } else {
        tempData = structuredClone(farmData);
        tempData[path.substring(1)] = jsonData;
    }

    farmData = validateData(tempData);

    updateEverything();
}

function updateHeader() {
    const values = Object.values(farmData);
    const data = values[values.length - 1];

    if (firstIndex == null) {
        firstIndex = values.length - 1
        let firstValue = data;

        for (let i = (firstIndex - 1); i >= 0; i--) {
            const compareValue = values[i];

            if (compareValue["sequencia"] < firstValue["sequencia"]) {
                firstValue = compareValue;
                firstIndex = i;
            } else {
                break
            }
        }
    }

    const umidadeTexto = document.getElementById("umidadeTexto");
    umidadeTexto.innerText = data["umidade"] + "%";

    const bombaTexto = document.getElementById("estadoBomba");
    bombaTexto.innerText = (data["estado_bomba"] ? "Ligada" : "Desligada")
}

/**
 * Updates the logs with all of the data stored in the `farmData` Object.
 */
function updateLogs() {
    const values = Object.values(farmData);
    const logElement = document.getElementById("logs");

    const computedStyle = getComputedStyle(logElement)
    const emHeight = parseFloat(computedStyle.height) / parseFloat(computedStyle.fontSize)

    logElement.innerText = "";
    const loopEnd = (values.length - 1)
    for (let i = (loopEnd - emHeight); i <= loopEnd; i++) {
        const element = document.createElement("li");
        const data = values[i];

        const umidadeString = `umidade: ${data["umidade"]}%`

        element.innerText = `${data["sequencia"]} - ${umidadeString};`
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
                backgroundColor: 'rgba(33, 22, 249, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                yAxisID: "umidY"
            }, {
                label: 'Umidade Mínima',
                data: [],
                borderColor: 'blue',
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                yAxisID: "umidY"
            }]
        },
        options: {
            scales: {
                x: { grid: { display: false } },
                umidY: {
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: "Umidade (%)"
                    },
                    position: "left",
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
    for (let i = 0; i < (data.length - 1); i++) {
        graph.data.datasets[i].data = data[i+1];
    }
    graph.update("none");
}

function updateAlerta() {
    const alerta = document.getElementById("alertaAtual")
    const values = Object.values(farmData)
    const value = values[values.length - 1]

    alerta.innerText = `${value["sequencia"]} - ${parseMotivo(value["motivo"])}`
}

function updateEverything() {
    updateHeader();
    updateLogs();
    updateGraph();
    updateAlerta();
}

function parseMotivo(motivo) {
    switch (motivo) {
        case "umidade_adequada":
            return "Umidade Adequada"
            break;
        default:
            return motivo;
            break;
    }
}