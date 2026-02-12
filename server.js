/**
 * KING DEV ACADEMY - MULTIPLAYER PONG ENGINE
 * Server Side - Node.js + Socket.io
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware e Estáticos
app.use(express.static(__dirname));

// Gerenciamento de Estado do Servidor
let nextPlayerId = 100; // Começa em 100 para parecer mais profissional
const connectedClients = new Map(); // Mapeia ID Curto -> Socket ID
const activeRooms = new Set();

console.log("[SERVER] Inicializando sistema King Dev Academy...");

io.on('connection', (socket) => {
    // Atribuição de ID Sequencial Simples
    const displayId = nextPlayerId++.toString();
    connectedClients.set(displayId, socket.id);
    
    console.log(`[CONEXÃO] Cliente conectado: ${socket.id} (ID: ${displayId})`);

    // Envio imediato do ID para o cliente
    socket.emit('myID', displayId);

    /**
     * LÓGICA DE MULTIPLAYER (SALA PRIVADA)
     */
    socket.on('invitePlayer', (targetId) => {
        console.log(`[INVITE] ${displayId} convidando ${targetId}`);
        const targetSocketId = connectedClients.get(targetId.toString());

        if (targetSocketId && io.sockets.sockets.has(targetSocketId)) {
            io.to(targetSocketId).emit('receiveInvite', {
                from: displayId,
                socket: socket.id
            });
        } else {
            socket.emit('errorMsg', 'Jogador não encontrado ou offline.');
        }
    });

    socket.on('acceptInvite', (hostDisplayId) => {
        const hostSocketId = connectedClients.get(hostDisplayId);
        
        if (hostSocketId && io.sockets.sockets.has(hostSocketId)) {
            const roomName = `room_${hostDisplayId}_${displayId}`;
            
            // Entrar na sala
            socket.join(roomName);
            const hostSocket = io.sockets.sockets.get(hostSocketId);
            hostSocket.join(roomName);
            
            activeRooms.add(roomName);
            console.log(`[SALA] Criada: ${roomName}`);

            // Iniciar o jogo para ambos
            io.to(roomName).emit('gameStart', {
                room: roomName,
                hostSocketId: hostSocketId,
                opponentDisplayId: displayId,
                hostDisplayId: hostDisplayId
            });
        }
    });

    /**
     * SINCRONIZAÇÃO EM TEMPO REAL
     */
    socket.on('updatePos', (data) => {
        // Envia para o outro jogador na sala
        socket.to(data.room).emit('opponentPos', {
            y: data.y,
            vY: data.vY // Enviamos a velocidade para interpolação suave
        });
    });

    socket.on('ballSync', (data) => {
        // Apenas o Host envia a posição da bola para garantir autoridade
        socket.to(data.room).emit('ballData', {
            x: data.x,
            y: data.y,
            p1Score: data.p1Score,
            p2Score: data.p2Score,
            speed: data.speed
        });
    });

    socket.on('requestParticle', (data) => {
        // Sincroniza efeitos visuais (partículas) entre jogadores
        socket.to(data.room).emit('spawnParticles', data);
    });

    /**
     * DESCONEXÃO
     */
    socket.on('disconnect', () => {
        console.log(`[SAIR] Cliente desconectado: ${displayId}`);
        connectedClients.delete(displayId);
        
        // Limpeza de salas (Opcional: implementar aviso de "oponente saiu")
        for (const room of socket.rooms) {
            if (room.startsWith('room_')) {
                socket.to(room).emit('opponentDisconnected');
                activeRooms.delete(room);
            }
        }
    });
});

// Tratamento de Erros do Servidor
server.on('error', (err) => {
    console.error('[ERRO SERVIDOR]', err);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
    --------------------------------------------------
    KING DEV ACADEMY - ENGINE ONLINE
    Link Local: http://localhost:${PORT}
    Status: Pronto para conexões multiplayer.
    --------------------------------------------------
    `);
});

// Mantém o servidor acordado no Render (Self-Ping opcional)
setInterval(() => {
    // Lógica interna para manter processos ativos se necessário
}, 1000 * 60 * 10);
