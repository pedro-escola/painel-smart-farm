/* JAVASCRIPT - A Lógica do Sistema */
        
// Simulação do nosso objeto do Banco de Dados
const sistema = {
    id_sensor: 1,
    valor: 0,
    bombaAtiva: false
};

function simularLeitura() {
    // 1. Simula a leitura do sensor (0 a 50 graus)
    sistema.valor = (Math.random() * 50).toFixed(1);
    
    // 2. Atualiza a tela (DOM)
    document.getElementById('display-valor').innerText = sistema.valor + "°C";
    
    // 3. Lógica de Automação (Igual ao Trigger do MySQL!)
    const logElemento = document.getElementById('log');
    const led = document.getElementById('led-bomba');
    const textoBomba = document.getElementById('texto-bomba');

    if (sistema.valor > 35.0) {
        sistema.bombaAtiva = true;
        led.classList.add('bomba-on');
        textoBomba.innerText = "LIGADA";
        textoBomba.style.color = "#3b82f6";
        logElemento.innerHTML = "<span style='color: #ef4444;'>⚠️ Alerta: Valor Crítico! Bomba ligada.</span>";
    } else {
        sistema.bombaAtiva = false;
        led.classList.remove('bomba-on');
        textoBomba.innerText = "OFF";
        textoBomba.style.color = "#94a3b8";
        logElemento.innerText = "✅ Temperatura estável.";
    }
}