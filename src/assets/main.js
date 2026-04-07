let running = false;
let loop = null;
const maxDataPoints = 15;

// Elementos da Interface
const btn = document.getElementById('btnToggle');
const displayTemp = document.getElementById('txtTemp');
const displayHum = document.getElementById('txtHum');
const statusBomba = document.getElementById('statusBomba');
const logs = document.getElementById('logs');
const logs_scroller = document.getElementById("logs_scroller");
const lastUpdate = document.getElementById('lastUpdate');

// Configuração do Gráfico
const ctx = document.getElementById('farmChart').getContext('2d');
const farmChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperatura (°C)',
            data: [],
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3
        }, {
            label: 'Limite Alerta (35°C)',
            data: [],
            borderColor: '#ef4444',
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { min: 10, max: 50, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
        },
        plugins: { legend: { position: 'bottom' } }
    }
});

function simulateESP32() {
    // Lógica de Geração de Dados (Igual a um sensor real com variação)
    const tempBase = parseFloat(displayTemp.innerText) || 24.0;
    const novaTemp = (tempBase + (Math.random() * 2 - 1)).toFixed(1);
    const novaHum = Math.floor(Math.random() * (75 - 20) + 20);
    const agora = new Date().toLocaleTimeString('pt-BR');

    // Atualiza Interface
    displayTemp.innerText = novaTemp;
    displayHum.innerText = novaHum;
    lastUpdate.innerText = `Última leitura: ${agora}`;

    // Lógica de Automação (Se/Então)
    if (novaTemp > 35) {
        statusBomba.innerText = "LIGADA (Resfriando)";
        statusBomba.className = "text-2xl font-bold text-blue-600 animate-pulse";
    } else if (novaHum < 30) {
        statusBomba.innerText = "LIGADA (Irrigando)";
        statusBomba.className = "text-2xl font-bold text-green-600 animate-pulse";
    } else {
        statusBomba.innerText = "DESLIGADA";
        statusBomba.className = "text-2xl font-bold text-gray-400";
    }

    // Atualiza Gráfico
    if (farmChart.data.labels.length >= maxDataPoints) {
        farmChart.data.labels.shift();
        farmChart.data.datasets[0].data.shift();
        farmChart.data.datasets[1].data.shift();
    }
    farmChart.data.labels.push(agora);
    farmChart.data.datasets[0].data.push(novaTemp);
    farmChart.data.datasets[1].data.push(35);
    farmChart.update('none');

    // Adiciona Log
    const logEntry = document.createElement('div');
    const alertClass = novaTemp > 35 ? 'text-red-400' : 'text-green-400';
    logEntry.innerHTML = `<span class="text-gray-500">[${agora}]</span> <span class="${alertClass}">Temp: ${novaTemp}°C | Hum: ${novaHum}%</span>`;
    logs.append(logEntry);

    logs_scroller.scrollTop = logs_scroller.scrollHeight;
}

btn.addEventListener('click', () => {
    running = !running;
    if (running) {
        btn.innerText = "PARAR MONITORAMENTO";
        btn.className = "w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95";
        loop = setInterval(simulateESP32, 2000);
    } else {
        btn.innerText = "INICIAR SENSORES";
        btn.className = "w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95";
        clearInterval(loop);
    }
});