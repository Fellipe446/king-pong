const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuração do Socket.io com CORS liberado para testes locais e produção
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir os arquivos estáticos (index.html) da pasta raiz
app.use(express.static(__dirname));

// Banco de dados em memória para rastrear jogadores e salas
const games = new Map();

io.on('connection', (socket) => {
    console.log(`[CONEXÃO] Novo usuário: ${socket.id}`);

    // 1. Enviar o ID gerado imediatamente para o cliente
    socket.emit('myID', socket.id);

    // 2. Lógica de Convite (Player A convida Player B)
    socket.on('invitePlayer', (targetID) => {
        console.log(`[INVITE] ${socket.id} convidou ${targetID}`);
        // Verifica se o alvo existe e está online
        if (io.sockets.sockets.has(targetID)) {
            io.to(targetID).emit('receiveInvite', socket.id);
        } else {
            socket.emit('errorMsg', 'Jogador não encontrado ou offline.');
        }
    });

    // 3. Aceitar Convite e Criar Sala
    socket.on('acceptInvite', (hostID) => {
        const roomName = `room_${hostID}_${socket.id}`;
        
        // Ambos entram na sala privada
        socket.join(roomName);
        const hostSocket = io.sockets.sockets.get(hostID);
        
        if (hostSocket) {
            hostSocket.join(roomName);
            
            console.log(`[GAME_START] Sala criada: ${roomName}`);
            
            // Avisa ambos que o jogo começou e define quem é o Host (quem calcula a bola)
            io.to(roomName).emit('gameStart', { 
                room: roomName, 
                host: hostID 
            });
        }
    });

    // 4. Sincronização de Movimento das Raquetes
    socket.on('updatePos', (data) => {
        // Envia a posição para o outro jogador da mesma sala
        socket.to(data.room).emit('opponentPos', {
            y: data.y,
            player: socket.id
        });
    });

    // 5. Sincronização Crítica da Bola (Enviada pelo Host)
    socket.on('ballSync', (data) => {
        // Broadcast para a sala (o oponente recebe os dados da bola e placar)
        socket.to(data.room).emit('ballData', {
            x: data.x,
            y: data.y,
            p1Score: data.p1Score,
            p2Score: data.p2Score
        });
    });

    // 6. Gerenciamento de Desconexão
    socket.on('disconnect', () => {
        console.log(`[SAIU] Usuário desconectado: ${socket.id}`);
        // Opcional: Avisar o oponente que a partida caiu
        io.emit('playerLeft', socket.id);
    });
});

// Iniciar servidor na porta definida pelo Render ou 3000 localmente
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
    =========================================
    KING DEV ACADEMY - PONG SERVER RUNNING
    Porta: ${PORT}
    =========================================
    `);
});
