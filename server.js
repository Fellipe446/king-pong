const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

// Contador que começa em 0
let nextPlayerId = 0;
// Mapa para vincular o ID numérico ao Socket ID real
const idMap = new Map();

io.on('connection', (socket) => {
    const displayId = nextPlayerId++;
    idMap.set(displayId.toString(), socket.id);
    
    console.log(`[CONEXÃO] Usuário ${displayId} conectado.`);

    // Envia o ID simples (0, 1, 2...) para o jogador
    socket.emit('myID', displayId.toString());

    // Convite usando o ID simples
    socket.on('invitePlayer', (targetDisplayId) => {
        const targetSocketId = idMap.get(targetDisplayId.trim());
        
        if (targetSocketId && io.sockets.sockets.has(targetSocketId)) {
            io.to(targetSocketId).emit('receiveInvite', displayId.toString());
        } else {
            socket.emit('errorMsg', 'ID não encontrado!');
        }
    });

    socket.on('acceptInvite', (hostDisplayId) => {
        const hostSocketId = idMap.get(hostDisplayId);
        if (hostSocketId) {
            const roomName = `room_${hostDisplayId}_${displayId}`;
            socket.join(roomName);
            io.sockets.sockets.get(hostSocketId).join(roomName);
            
            io.to(roomName).emit('gameStart', { 
                room: roomName, 
                host: hostSocketId // O Host original baseado no socket real
            });
        }
    });

    // Sincronização básica
    socket.on('updatePos', (data) => socket.to(data.room).emit('opponentPos', data));
    socket.on('ballSync', (data) => socket.to(data.room).emit('ballData', data));

    socket.on('disconnect', () => {
        idMap.delete(displayId.toString());
        console.log(`[SAIU] Usuário ${displayId} desconectado.`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
