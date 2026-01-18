const socket = io('https://barco-app.onrender.com/'); // Conecta ao servidor Socket.IO

const initialScreen = document.getElementById('initial-screen');
const boatScreen = document.getElementById('boat-screen');
const mainImage = document.getElementById('main-image');
const musicPlayer = document.getElementById('music-player'); // Música aleatória da tela inicial
const boatVideo = document.getElementById('boat-video'); // Vídeo barco.mp4
const boatMusic = document.getElementById('boat-music'); // Música barco.mp3
const barco1Overlay = document.getElementById('barco1-overlay');
const barco1Video = document.getElementById('barco1-video');
const finalMessagesOverlay = document.getElementById('final-messages-overlay');
const messageList = document.getElementById('message-list');

// NOVO: Elemento para a tela "Próxima equipe"
const nextTeamOverlay = document.getElementById('next-team-overlay');

const userRevealOverlay = document.getElementById('user-reveal-overlay');
const userRevealVideo = document.getElementById('user-reveal-video');

const USER_VIDEO_MAP = {
    'index1': 'assets/lion.mp4',
    'index2': 'assets/wolf.mp4',
    'index3': 'assets/eagle.mp4',
    'index4': 'assets/shark.mp4',
    'index5': 'assets/ce.mp4'
};
let currentAcceptedUsers = 0; // Para rastrear quantos aceitaram no lado do dashboard

let currentMusicIndex = 0;
let isFullScreen = false;
let initialMusicStarted = false; // Flag para garantir que a música inicial só seja iniciada uma vez

// Função para tocar a próxima música aleatória
function playNextRandomMusic() {
    if (ASSET_PATHS.randomMusics.length === 0) return;

    musicPlayer.src = ASSET_PATHS.randomMusics[currentMusicIndex];
    musicPlayer.load(); // Recarrega o áudio
    musicPlayer.play()
        .then(() => console.log(`Tocando: ${musicPlayer.src}`))
        .catch(error => {
            console.warn("Erro ao tocar música automaticamente. Necessita interação do usuário:", error);
        });

    currentMusicIndex = (currentMusicIndex + 1) % ASSET_PATHS.randomMusics.length;
}

// Event listener para quando a música terminar, tocar a próxima
musicPlayer.addEventListener('ended', playNextRandomMusic);

// Eventos de teclado
document.addEventListener('keydown', (event) => {
    // Se estiver na tela inicial e a música não tiver começado, inicie-a com qualquer tecla.
    if (initialScreen.classList.contains('active') && !initialMusicStarted) {
        playNextRandomMusic();
        musicPlayer.volume = 0.5; // Ajuste de volume
        boatMusic.volume = 0.5; // Ajuste de volume
        initialMusicStarted = true; // Marca que a música inicial começou
    }

    // Tecla 'E' para fullscreen
    if (event.key === 'E' || event.key === 'e') {
        if (!isFullScreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Erro ao tentar ativar o modo tela cheia: ${err.message}`);
            });
            isFullScreen = true;
        } else {
            document.exitFullscreen();
            isFullScreen = false;
        }
    }
    // Tecla 'I' para próxima etapa (ir para a tela do barco)
    else if (event.key === 'I' || event.key === 'i') {
        if (initialScreen.classList.contains('active')) {
            initialScreen.classList.remove('active');
            boatScreen.classList.add('active');
            musicPlayer.pause(); // Pausa a música aleatória
            
            // Garante que o barco.mp4 e barco.mp3 comecem se ainda não estiverem rodando
            boatVideo.style.display = 'block'; // Garante que o vídeo do barco esteja visível inicialmente
            boatVideo.play();
            boatMusic.play();
        }
    }
});

// Lógica de Socket.IO para o Dashboard
socket.on('dashboard_trigger_barco1_animation', () => {
    console.log('Recebido: dashboard_trigger_barco1_animation');
    barco1Overlay.classList.add('active'); // Usa classList.add('active') em vez de style.display = 'flex'
    boatVideo.pause(); // Pausa o vídeo principal do barco
    // boatMusic continua tocando

    barco1Video.muted = false; // Ativa o som do barco1.mp4
    barco1Video.volume = 0.7; // Ajusta o volume do barco1.mp4 (0.0 a 1.0)
    barco1Video.play();

    barco1Video.onended = () => {
        barco1Overlay.classList.remove('active'); // Usa classList.remove('active')
        boatVideo.play(); // Volta a tocar o vídeo principal do barco
        // boatMusic já está tocando, não precisa play novamente
    };
});

socket.on('all_boats_burned', (messages) => {
    console.log('Todos os barcos foram queimados! Mensagens:', messages);
    boatVideo.pause();
    boatMusic.pause(); // Pausa a música do barco para as mensagens finais
    
    // Oculta o vídeo do barco e a tela "Próxima equipe" antes de mostrar as mensagens
    boatVideo.style.display = 'none';
    nextTeamOverlay.classList.remove('active');

    finalMessagesOverlay.classList.add('active'); // Mostra o overlay das mensagens
    messageList.innerHTML = ''; // Limpa a lista antes de adicionar as novas mensagens
    messages.forEach(msg => {
        const li = document.createElement('li');
        li.textContent = msg;
        messageList.appendChild(li);
    });

    // Envia o comando para os index para que possam 'aceitar equipe'
    socket.emit('dashboard_initiated_discover');
});

// Lógica para tocar o vídeo de revelação do usuário no Dashboard
socket.on('dashboard_play_user_reveal_video', (data) => {
    const { userId, currentAcceptedCount } = data;
    currentAcceptedUsers = currentAcceptedCount;
    console.log(`Recebido: dashboard_play_user_reveal_video para ${userId}. Aceitos até agora: ${currentAcceptedUsers}`);

    // Esconde as mensagens assim que o PRIMEIRO 'aceitar equipe' acontece
    if (finalMessagesOverlay.classList.contains('active')) {
        finalMessagesOverlay.classList.remove('active');
    }

    // PAUSA E ESCONDE O VÍDEO PRINCIPAL DO BARCO, PAUSA SUA MÚSICA
    boatVideo.pause();
    boatVideo.style.display = 'none'; // Oculta o vídeo do barco.mp4
    boatMusic.pause(); // Pausa a música barco.mp3

    // Exibe a tela "Próxima equipe" ANTES de reproduzir o vídeo da equipe
    nextTeamOverlay.classList.add('active'); // Mostra a tela azul escura

    const videoPath = USER_VIDEO_MAP[userId];
    if (videoPath) {
        userRevealVideo.src = videoPath;
        userRevealVideo.load(); // Força o carregamento do novo vídeo
        userRevealVideo.muted = false; // Garante que o vídeo tenha som
        userRevealVideo.volume = 0.7; // Ajuste de volume
        
        // Esconde a tela "Próxima equipe" e mostra o overlay do vídeo da equipe
        nextTeamOverlay.classList.remove('active'); // Oculta a tela azul escura
        userRevealOverlay.classList.add('active'); // Mostra o overlay do vídeo da equipe

        userRevealVideo.play()
            .then(() => {
                console.log(`Vídeo de revelação para ${userId} reproduzindo.`);
            })
            .catch(error => {
                console.error(`Erro ao reproduzir vídeo de revelação para ${userId}:`, error);
                // Fallback: se o vídeo não tocar, esconde o overlay e tenta retomar o barco
                userRevealOverlay.classList.remove('active');
                // Se der erro, voltamos para a tela "Próxima equipe"
                nextTeamOverlay.classList.add('active'); 
            });

        userRevealVideo.onended = () => {
            console.log(`Vídeo de revelação para ${userId} terminou.`);
            userRevealOverlay.classList.remove('active'); // Esconde o overlay do vídeo da equipe

            // Se todos já aceitaram e este foi o último vídeo, volta para a tela inicial
            if (currentAcceptedUsers === TOTAL_USERS_EXPECTED) {
                console.log('Último vídeo de revelação terminou, voltando à tela inicial.');
                
                // Garante que a tela "Próxima equipe" esteja oculta
                nextTeamOverlay.classList.remove('active');
                // Restaura a visibilidade e playback do vídeo do barco e sua música
                boatVideo.style.display = 'block'; // Mostra o vídeo do barco
                boatVideo.play();
                boatMusic.play();

                boatMusic.pause(); // Pausa a música do barco antes de ir para a tela inicial
                boatScreen.classList.remove('active');
                initialScreen.classList.add('active');
                playNextRandomMusic(); // Reinicia as músicas aleatórias
                currentAcceptedUsers = 0; // Reset da contagem para uma possível nova rodada
                initialMusicStarted = false; // Reset da flag de música inicial para próxima interação
                socket.emit('reset_game_state'); // Avisa o servidor para resetar o estado
            } else {
                // Se nem todos aceitaram, exibe a tela "Próxima equipe"
                nextTeamOverlay.classList.add('active'); // Mostra a tela azul escura
                // boatVideo e boatMusic permanecem pausados/ocultos.
            }
        };
    }
});


socket.on('all_team_accepted', () => {
    console.log('Todos aceitaram a equipe! O último vídeo de revelação está sendo exibido ou aguardando para ser exibido.');
});

// Listener para resetar o dashboard caso o servidor avise
socket.on('game_state_reset', () => {
    console.log('Dashboard: Recebido comando para resetar o estado do jogo.');
    
    // Garante que todos os overlays estejam ocultos
    finalMessagesOverlay.classList.remove('active');
    barco1Overlay.classList.remove('active');
    nextTeamOverlay.classList.remove('active');
    userRevealOverlay.classList.remove('active');

    // Restaura o estado do vídeo do barco e sua música
    boatVideo.style.display = 'block'; // Mostra o vídeo do barco
    boatVideo.pause(); // Garante que esteja pausado ao voltar para a tela inicial
    boatMusic.pause();

    boatScreen.classList.remove('active');
    initialScreen.classList.add('active');
    playNextRandomMusic();
    currentAcceptedUsers = 0;
    initialMusicStarted = false;
});

// Configuração inicial para o main.js - ESTE BLOCO DEVE VIR ANTES DE 'js/main.js'
const ASSET_PATHS = {
    mainImage: 'assets/image.png',
    randomMusics: ['assets/aleatorio1.mp3', 'assets/aleatorio2.mp3', 'assets/aleatorio3.mp3'],
    boatVideo: 'assets/barco.mp4',
    boatMusic: 'assets/barco.mp3',
    barco1Video: 'assets/barco1.mp4', // <--- ALTERADO AQUI para minúsculas
};
const TOTAL_USERS_EXPECTED = 5; // Adicionado: Para usar no reset/contagem