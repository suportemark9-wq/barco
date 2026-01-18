const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Estado global do jogo
let completedUsersCount = 0;
let userMessages = {}; // { userId: "mensagem da terceira aba" }
let acceptedTeamCount = 0;
const TOTAL_USERS = 5; // Total de index participantes
let acceptedUserIds = []; // Para rastrear quais users aceitaram

io.on('connection', (socket) => {
    console.log(`Novo usuário conectado: ${socket.id}`);

    // Envia o estado atual para o novo usuário (opcional, para re-sincronizar se necessário)
    socket.emit('current_game_state', {
        completedUsersCount,
        allBoatsBurned: completedUsersCount === TOTAL_USERS,
        allTeamAccepted: acceptedTeamCount === TOTAL_USERS
    });

    socket.on('user_completed_double_continue', (data) => {
        // data esperada: { userId: 'index1', message: 'Meu medo é...' }
        // Garante que só conta uma vez por usuário para evitar contagens duplicadas se o usuário recarregar
        if (!userMessages[data.userId]) {
            completedUsersCount++;
            userMessages[data.userId] = data.message;
            console.log(`Usuário ${data.userId} completou. Total: ${completedUsersCount}`);

            // Avisa o dashboard para tocar Barco1.mp4 (se a lógica for essa)
            // IMPORTANTE: Isso vai disparar o video para CADA usuário que terminar.
            // Se você quer que toque SÓ UMA VEZ no primeiro a terminar, ou DEPOIS que todos terminarem,
            // essa lógica precisa ser ajustada. No momento, toca um por um.
            io.emit('dashboard_trigger_barco1_animation');

            if (completedUsersCount === TOTAL_USERS) {
                io.emit('all_boats_burned', Object.values(userMessages)); // Envia todas as mensagens coletadas
                console.log('TODOS OS BARCOS QUEIMADOS!');
            }
        }
    });

    socket.on('user_accepted_team', (userId) => {
        // Verifica se o usuário já aceitou para não contar duas vezes
        if (userId && !acceptedUserIds.includes(userId)) {
            acceptedUserIds.push(userId);
            acceptedTeamCount++;
            console.log(`Usuário ${userId} aceitou a equipe. Total: ${acceptedTeamCount}`);

            // Emite para o dashboard tocar o vídeo correspondente ao usuário que acabou de aceitar
            io.emit('dashboard_play_user_reveal_video', { userId: userId, currentAcceptedCount: acceptedTeamCount });

            if (acceptedTeamCount === TOTAL_USERS) {
                io.emit('all_team_accepted');
                console.log('TODOS ACEITARAM A EQUIPE!');
            }
        }
    });

    // Evento para resetar o jogo
    socket.on('reset_game_state', () => {
        completedUsersCount = 0;
        userMessages = {};
        acceptedTeamCount = 0;
        acceptedUserIds = [];
        console.log('Estado do jogo resetado!');
        io.emit('game_state_reset'); // Opcional: Avisar todos os clientes que o jogo foi resetado
    });

    socket.on('disconnect', () => {
        console.log(`Usuário desconectado: ${socket.id}`);
        // Lógica para resetar estado ou lidar com desconexões (complexo para este escopo)
        // Para este projeto, vamos assumir que os usuários não desconectam no meio.
    });
});

// Serve arquivos estáticos da pasta raiz do projeto
app.use(express.static(path.join(__dirname, '..'))); // Aponta para a pasta pai do `server`

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});