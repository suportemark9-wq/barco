const socket = io(); // Conecta ao servidor Socket.IO

const inputStep = document.getElementById('input-step');
const burnedBoatStep = document.getElementById('burned-boat-step');
const chosenStep = document.getElementById('chosen-step');
const revealStep = document.getElementById('reveal-step');

const medosInput = document.getElementById('medos');
const habitosInput = document.getElementById('habitos');
const atrapalhaInput = document.getElementById('atrapalha');
const burnButton = document.getElementById('burn-button');

const errorOverlay = document.getElementById('error-overlay');
const continueButton1 = document.getElementById('continue-button-1');
const exitButton1 = document.getElementById('exit-button-1');

const errorOverlay2 = document.getElementById('error-overlay-2');
const continueButton2 = document.getElementById('continue-button-2');
const exitButton2 = document.getElementById('exit-button-2');

const revealImage = document.getElementById('reveal-image');
const revealText = document.getElementById('reveal-text');
const acceptTeamButton = document.getElementById('accept-team-button');
// Removido: const revealVideo = document.getElementById('reveal-video'); // Este vídeo foi movido para o dashboard

let continueClicks = 0; // Contador de cliques no "Continuar" para este index

// Função para resetar o index
function resetIndex() {
    continueClicks = 0;
    medosInput.value = '';
    habitosInput.value = '';
    atrapalhaInput.value = '';
    errorOverlay.style.display = 'none';
    errorOverlay2.style.display = 'none';
    burnedBoatStep.classList.remove('active');
    chosenStep.classList.remove('active');
    revealStep.classList.remove('active');
    inputStep.classList.add('active');
    // Reinicia o botão de aceitar equipe
    acceptTeamButton.disabled = false;
    acceptTeamButton.textContent = 'ACEITAR EQUIPE';
}

// Configurações específicas para cada index são passadas via script no HTML
document.addEventListener('DOMContentLoaded', () => {
    revealImage.src = REVEAL_ASSETS.image;
    revealText.textContent = REVEAL_ASSETS.text;
    // Removido: revealVideo.src = REVEAL_ASSETS.video;
});


// Evento: Botão "Queimar o barco"
burnButton.addEventListener('click', () => {
    if (atrapalhaInput.value.trim() === '') {
        alert('Por favor, preencha o que atrapalha seu fechamento.');
        return;
    }
    errorOverlay.style.display = 'flex';
});

// Evento: Primeiro "Continuar"
continueButton1.addEventListener('click', () => {
    errorOverlay.style.display = 'none';
    errorOverlay2.style.display = 'flex';
});

// Evento: Primeiro "Sair"
exitButton1.addEventListener('click', () => {
    resetIndex();
});

// Evento: Segundo "Continuar"
continueButton2.addEventListener('click', () => {
    continueClicks++;
    if (continueClicks === 1) { // Primeira vez que clica no segundo "Continuar"
        errorOverlay2.style.display = 'none';
        inputStep.classList.remove('active');
        burnedBoatStep.classList.add('active');
        // Mensagem "barco queimado" aparece por 12 segundos
        setTimeout(() => {
            burnedBoatStep.classList.remove('active');
            chosenStep.classList.add('active');
        }, 12000);

        // Envia para o servidor que este usuário completou uma etapa
        socket.emit('user_completed_double_continue', {
            userId: USER_ID,
            message: atrapalhaInput.value // Apenas a mensagem da terceira aba
        });
    }
});

// Evento: Segundo "Sair"
exitButton2.addEventListener('click', () => {
    resetIndex();
});

// Lógica de Socket.IO para os Index Pages
socket.on('all_boats_burned', (allMessages) => {
    console.log(`Index ${USER_ID}: Todos os barcos foram queimados!`);
    chosenStep.classList.remove('active');
    revealStep.classList.add('active'); // Revela a identidade e o botão "Aceitar Equipe"
});

// Evento: Botão "ACEITAR EQUIPE"
acceptTeamButton.addEventListener('click', () => {
    socket.emit('user_accepted_team', USER_ID);
    acceptTeamButton.disabled = true;
    acceptTeamButton.textContent = 'Equipe Aceita!';
});


socket.on('all_team_accepted', () => {
    console.log(`Index ${USER_ID}: Todos aceitaram a equipe!`);
    // Este evento agora é acionado pelo servidor após o último vídeo de revelação no dashboard
    // Reinicia o index
    setTimeout(() => {
        resetIndex(); // Volta para o início
    }, 5000); // Dar um tempo para a ação no dashboard terminar
});

socket.on('dashboard_initiated_discover', () => {
    console.log(`Index ${USER_ID}: O dashboard iniciou a descoberta.`);
    // Se o dashboard iniciou a descoberta, o 'revealStep' deve estar ativo
    chosenStep.classList.remove('active');
    revealStep.classList.add('active');
});

// Listener para resetar o index caso o servidor avise
socket.on('game_state_reset', () => {
    console.log(`Index ${USER_ID}: Recebido comando para resetar o estado do jogo.`);
    resetIndex(); // Volta para o início
});