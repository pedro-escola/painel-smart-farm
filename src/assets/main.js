// Função para LIGAR a bomba
function ligarBomba() {
    // 1. Aviso em Pop-up na tela
    // alert("Atenção: Enviando comando para a bomba d'água...");

    // 2. JS procura no HTML o elemento com o ID 'status-bomba'
    let textoStatus = document.getElementById("status-bomba");

    // 3. Muda o texto e a cor para Azul
    textoStatus.innerText = "LIGADA (Irrigando...)";
    textoStatus.style.color = "#3b82f6"; // Azul

    // 4. Aviso escondido no console para os desenvolvedores
    console.log("Comando ON: A bomba de água foi ativada.");
}

// Função para DESLIGAR a bomba (O Desafio dos alunos)
function desligarBomba() {
    // 1. Procura o mesmo elemento HTML
    let textoStatus = document.getElementById("status-bomba");

    // 2. Devolve o texto e a cor original (Vermelho)
    textoStatus.innerText = "DESLIGADA";
    textoStatus.style.color = "#ef4444"; // Vermelho

    // 3. Aviso no console
    console.log("Comando OFF: A bomba de água foi desligada.");
}

function atualizaSensores() {
    let umidadeLida = Math.floor(Math.random() * 70) + 10;

    document.getElementById("valor-umidade").innerText = umidadeLida + "%";

    if (umidadeLida < 30) {
        ligarBomba();
    } else {
        desligarBomba();
    }
}
