
var farmData = {}
var fakeData = {}

var display = "farm"
Chart.defaults.font.family = "Comic Sans MS"

const UMIDADE_MINIMA = 20
const UMIDADE_MAXIMA = 30
const TEMPERATURA_MINIMA = 13
const TEMPERATURA_MAXIMA = 26

// coisa de data padrão inutil uhul
const UPDATE_SEGUNDOS = 2.5
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

function stepRandomNumber(current, min, max, step) {
    let change = (Math.random() * 2 - 1) * step;

    if ((current + change) < min || ((current + change) > max))
        change *= -1;

    current += change;
    // console.log(currentNumber);
    current = Math.max(min, Math.min(max, current));

    // console.log(currentNumber);
    return current;
}

var currentUmidade = randomRange(UMIDADE_MINIMA, UMIDADE_MAXIMA);
var currentTemperatura = randomRange(TEMPERATURA_MINIMA, TEMPERATURA_MAXIMA);
function createNewFakeData() {
    const keys = Object.keys(fakeData);
    const sequencia_atual = keys.length;

    const extraUmidade = 10;
    currentUmidade = stepRandomNumber(currentUmidade, UMIDADE_MINIMA - extraUmidade, UMIDADE_MAXIMA + extraUmidade, extraUmidade)

    const extraTemperatura = 2;
    currentTemperatura = stepRandomNumber(currentTemperatura, TEMPERATURA_MINIMA - extraTemperatura, TEMPERATURA_MAXIMA + extraTemperatura, extraTemperatura)

    const umidade = parseFloat( currentUmidade.toFixed(1) );
    const temperatura = parseFloat( currentTemperatura.toFixed(1) );
    fakeData[Str_Random(10)] = {
        sequencia: sequencia_atual,
        umidade: umidade,
        temperatura: temperatura,
        bomba_acionada: (umidade <= UMIDADE_MINIMA),
        motivo: "dados_falsos"
    };
}

var firstIndex = null;
var graph = null;
const API_LINK = "https://smart-farm-d6948-default-rtdb.firebaseio.com/leituras.json"
// const API_LINK = "https://pudim.com.br"

document.addEventListener("DOMContentLoaded", () => {
    const dadosFalsosBox = document.getElementById("fakeDataBox");
    dadosFalsosBox.checked = false;
    dadosFalsosBox.addEventListener("change", () => {
        changeTipo(dadosFalsosBox.checked);
    });

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
        dadosFalsosBox.checked = true;
        console.warn("Utilizando dados aleatórios.");
        online = false;
    })

    for (let i = 0; i < 50; i++) {
        createNewFakeData();
    }
    changeTipo(dadosFalsosBox.checked);
    setInterval(() => {
        createNewFakeData();
        if (display == "fake") {
            updateEverything();
        }
    }, UPDATE_SEGUNDOS * 1000);
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

function getProperData() {
    if (display == "farm") {
        return farmData
    }
    else {
        return fakeData
    }
}

function updateHeader() {
    const values = Object.values(getProperData());
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

    const temperaturaTexto = document.getElementById("temperaturaTexto");
    temperaturaTexto.innerText = data?.["temperatura"] || "--";

    const umidadeTexto = document.getElementById("umidadeTexto");
    umidadeTexto.innerText = data?.["umidade"] || "--";

    const bombaTexto = document.getElementById("estadoBomba");
    bombaTexto.innerText = (data?.["bomba_acionada"] ? "Ligada" : "Desligada");
    bombaTexto.classList.remove("offlineText"); bombaTexto.classList.remove("onlineText");
    bombaTexto.classList.add(data?.["bomba_acionada"] ? "onlineText" : "offlineText");

    const statusTexto = document.getElementById("statusConexao");
    const statusImage = document.getElementById("conexaoImg");
    statusTexto.innerText = (online ? "Você está online!" : "Você está offline.");
    statusImage.src = (online ? "assets/img/wifi.png" : "assets/img/no-wifi.png");
    statusImage.alt = (online ? "Ícone online" : "Ícone offline");
    if (online) {
        statusTexto.classList.remove("offlineText");
        statusTexto.classList.add("onlineText");
    }
}

/**
 * Updates the logs with all of the data stored in the `farmData` Object.
 */
function updateLogs() {
    const values = Object.values(getProperData());
    const logElement = document.getElementById("logs");

    const computedStyle = getComputedStyle(logElement)
    const emHeight = parseFloat(computedStyle.height) / parseFloat(computedStyle.fontSize)

    logElement.innerText = "";
    const loopEnd = (values.length - 1)
    for (let i = (loopEnd - emHeight); i <= loopEnd; i++) {
        const element = document.createElement("li");
        const data = values[i];

        if (data == undefined) break;

        const umidadeString = `Umidade: ${data?.["umidade"] || "--"}%`
        const temperaturaString = `Temperatura: ${data?.["temperatura"] || "--"}°C`
        const bombaString = `Bomba: ${data?.["bomba_acionada"] ? "Ligada" : "Desligada"}`

        element.innerText = `${data?.["sequencia"] || "?"} - ${umidadeString}; ${temperaturaString}; ${bombaString}`
        logElement.appendChild(element);
    }

    logElement.scrollTop = logElement.scrollHeight;
    console.log("updated logs!")
}

function toggleAnnotationLabel(chart, event, annotationName) {
    const label = chart?.options?.plugins?.annotation?.annotations?.[annotationName]?.label

    if (label === undefined) return;

    label.display = !label.display;
    chart.update();
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
                borderColor: 'rgb(0, 191, 255)',
                backgroundColor: 'rgba(0, 191, 255, 0.1)',
                tension: 0.4,
                // fill: true,
                borderWidth: 3,
                yAxisID: "umidY",
            }, {
                label: "Temperatura",
                data: [],
                borderColor : "rgb(255, 160, 122)",
                backgroundColor: "rgba(255, 160, 122, 0.1)",
                tension: 0.4,
                // fill: true,
                borderWidth: 3,
                yAxisID: "tempY"
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
                },
                tempY: {
                    min: 10,
                    max: 30,
                    title: {
                        display: true,
                        text: "Temperatura (°C)"
                    },
                    position: "right",
                    ticks: { callback: function(value) { return value + "°C" } }
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
                            borderColor: "rgba(0, 191, 255, 0.4)",
                            borderDash: [10, 5],
                            borderWidth: 4,
                            pointRadius: 0,
                            fill: false,
                            scaleID: "umidY",
                            value: UMIDADE_MINIMA,

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
                            borderColor: "rgba(0, 191, 255, 0.4)",
                            borderDash: [10, 5],
                            borderWidth: 4,
                            pointRadius: 0,
                            fill: false,
                            scaleID: "umidY",
                            value: UMIDADE_MAXIMA,

                            enter({chart}, event) {
                                toggleAnnotationLabel(chart, event, "umidadeMax")
                                return true;
                            },
                            leave({chart}, event) {
                                toggleAnnotationLabel(chart, event, "umidadeMax")
                                return true;
                            }
                        },

                        temperaturaMin: {
                            type: "line",
                            label: {
                                content: "Temperatura Mínima",
                                display: false
                            },
                            borderColor: "rgba(255, 160, 122, 0.4)",
                            borderDash: [10, 5],
                            borderWidth: 4,
                            pointRadius: 0,
                            fill: false,
                            scaleID: "tempY",
                            value: TEMPERATURA_MINIMA,

                            enter({chart}, event) {
                                toggleAnnotationLabel(chart, event, "temperaturaMin")
                                return true;
                            },
                            leave({chart}, event) {
                                toggleAnnotationLabel(chart, event, "temperaturaMin")
                                return true;
                            }
                        },
                        temperaturaMax: {
                            type: "line",
                            label: {
                                content: "Temperatura Máxima",
                                display: false
                            },
                            borderColor: "rgba(255, 160, 122, 0.4)",
                            borderDash: [10, 5],
                            borderWidth: 4,
                            pointRadius: 0,
                            fill: false,
                            scaleID: "tempY",
                            value: TEMPERATURA_MAXIMA,

                            enter({chart}, event) {
                                toggleAnnotationLabel(chart, event, "temperaturaMax")
                                return true;
                            },
                            leave({chart}, event) {
                                toggleAnnotationLabel(chart, event, "temperaturaMax")
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

    const values = Object.values(getProperData());
    const farmEnd = values.length - 1;

    const data = [
        [], [], []
    ]
    for (let i = (farmEnd - 10); i <= farmEnd; i++) {
        const value = values[i];

        data[0].push(value?.["sequencia"]);
        data[1].push(value?.["umidade"]);
        data[2].push(value?.["temperatura"]);
    }

    graph.data.labels = data[0];
    for (let i = 0; i < (data.length - 1); i++) {
        data[i+1].filter((value) => {
            return value !== undefined
        })

        graph.data.datasets[i].data = data[i+1];
    }

    graph.update("none");
}

function updateAlerta() {
    const alerta = document.getElementById("alertaAtual")
    const values = Object.values(getProperData())
    const value = values[values.length - 1]

    alerta.innerText = `${value?.["sequencia"] || "?"} - ${parseMotivo(value?.["motivo"])}`
}

function updateEverything() {
    updateHeader();
    updateLogs();
    updateGraph();
    updateAlerta();
}

/**
 * coco
 * @param {String} motivo
 * @returns {String}
 */
function parseMotivo(motivo) {
    switch (motivo) {
        case undefined:
            return "Indefinido"
            break;
        default:
            const stringArray = motivo.split("_")
            let finalMotivo = ""
            for (let i = 0; i < stringArray.length; i++) {
                const string = stringArray[i];

                finalMotivo += string.charAt(0).toUpperCase() + string.slice(1) + " "
            }

            return finalMotivo;
            break;
    }
}

function changeTipo(value) {
    let oldDisplay = display;

    if (value)
        display = "fake";
    else
        display = "farm";
    
    if (oldDisplay != display)
        updateEverything();
}