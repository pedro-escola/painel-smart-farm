
var farmData = {}

// coisa de data padrão inutil uhul
const UTILIZAR_DADOS_FALLBACK = true
const UMIDADE_MINIMA = 20
const UPDATE_SEGUNDOS = 1
var online = true

function Str_Random(length) { // obrigad https://www.geeksforgeeks.org/javascript/generate-random-characters-numbers-in-javascript/
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    
    // Loop to generate characters for the specified length
    for (let i = 0; i < length; i++) {
        const randomInd = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomInd);
    }
    return result;
}

function randomRange(min, max) {
    let random = Math.random();

    return min + random * (max - min);
}

var currentNumber = randomRange(10, 80);
function stepRandomNumber(min, max, step) {
    let change = (Math.random() * 2 - 1) * step;

    if ((currentNumber + change) < min || ((currentNumber + change) > max))
        change *= -1;

    currentNumber += change;
    // console.log(currentNumber);
    currentNumber = Math.max(min, Math.min(max, currentNumber));

    // console.log(currentNumber);
    return currentNumber;
}

function createNewFakeData() {
    const keys = Object.keys(farmData);
    const sequencia_atual = keys.length;

    const umidade = parseFloat( stepRandomNumber(10, 30, 10).toFixed(1) );
    farmData[Str_Random(10)] = {
        sequencia: sequencia_atual,
        umidade: umidade,
        bomba_acionada: (umidade <= UMIDADE_MINIMA)
    };
}

var firstIndex = null;
var graph = null;
//const API_LINK = "https://smart-farm-d6948-default-rtdb.firebaseio.com/leituras.json"
const API_LINK = "https://pudim.com.br"

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

    eventSource.addEventListener("error", (error) => {
        if (!UTILIZAR_DADOS_FALLBACK) {
            console.error(error);
            return;
        }

        console.warn("Utilizando dados aleatórios.");
        online = false;
        for (let i = 0; i < 50; i++) {
            createNewFakeData();
        }
        updateEverything();

        setInterval(() => {
            createNewFakeData()
            updateEverything();
        }, UPDATE_SEGUNDOS * 1000);
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
    umidadeTexto.innerText = data["umidade"];

    const bombaTexto = document.getElementById("estadoBomba");
    bombaTexto.innerText = (data["bomba_acionada"] ? "Ligada" : "Desligada");

    const statusTexto = document.getElementById("statusConexao");
    const statusImage = document.getElementById("conexaoImg");
    statusTexto.innerText = (online ? "Você está online!" : "Você está offline.");
    statusImage.src = (online ? "assets/img/wifi.png" : "assets/img/no-wifi.png");
    statusImage.alt = (online ? "Ícone online" : "Ícone offline");
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

        if (data == undefined) break;

        const umidadeString = `Umidade: ${data["umidade"]}%`
        const bombaString = `Bomba: ${data["bomba_acionada"] ? "Ligada" : "Desligada"}`

        element.innerText = `${data["sequencia"]} - ${umidadeString}; ${bombaString}`
        logElement.appendChild(element);
    }

    logElement.scrollTop = logElement.scrollHeight;
    console.log("updated logs!")
}

function toggleAnnotationLabel(chart, event, annotationName) {
    const label = chart?.options?.plugins?.annotation?.annotations?.[annotationName]?.label

    if (label === undefined) return;

    label.display = !label.display;
    chart.update("none");
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
                borderColor: 'rgb(100, 149, 237)',
                backgroundColor: 'rgba(33, 22, 249, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
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
            plugins: {
                legend: { position: 'bottom' },
                annotation: {
                    annotations: {
                        umidadeMin: {
                            type: "line",
                            label: {
                                content: "Umidade Mínima",
                                display: false
                            },
                            borderColor: "rgba(100, 149, 237, 0.5)",
                            borderDash: [10, 5],
                            borderWidth: 4,
                            pointRadius: 0,
                            fill: false,
                            scaleID: "umidY",
                            value: 20,

                            enter({chart}, event) {
                                toggleAnnotationLabel(chart, event, "umidadeMin")
                                return true;
                            },
                            leave({chart}, event) {
                                toggleAnnotationLabel(chart, event, "umidadeMin")
                                return true;
                            }
                        },
                        umidadeMax: {
                            type: "line",
                            label: {
                                content: "Umidade Máxima",
                                display: false
                            },
                            borderColor: "rgba(100, 149, 237, 0.5)",
                            borderDash: [10, 5],
                            borderWidth: 4,
                            pointRadius: 0,
                            fill: false,
                            scaleID: "umidY",
                            value: 30,

                            enter({chart}, event) {
                                toggleAnnotationLabel(chart, event, "umidadeMax")
                                return true;
                            },
                            leave({chart}, event) {
                                toggleAnnotationLabel(chart, event, "umidadeMax")
                                return true;
                            }
                        }
                    }
                }
            }
        }
    });
}

function updateGraph() {
    if (graph === null) createGraph();

    const values = Object.values(farmData);
    const farmEnd = values.length - 1;

    const data = [
        [], []
    ]
    for (let i = (farmEnd - 10); i <= farmEnd; i++) {
        const value = values[i];

        data[0].push(value["sequencia"]);
        data[1].push(value["umidade"]);
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
        case undefined:
            return "Indefinido"
            break;
        default:
            return `Desconhecido - ${motivo}`;
            break;
    }
}
