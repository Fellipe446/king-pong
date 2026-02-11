const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);
    
    // Envia o ID para o próprio usuário
    socket.emit('myID', socket.id);

    // Gerencia o convite
    socket.on('invitePlayer', (targetID) => {
        io.to(targetID).emit('receiveInvite', socket.id);
    });

    // Quando o convidado aceita, cria uma sala
    socket.on('acceptInvite', (hostID) => {
        const roomName = `room-${hostID}`;
        socket.join(roomName);
        const hostSocket = io.sockets.sockets.get(hostID);
        if(hostSocket) {
            hostSocket.join(roomName);
            io.to(roomName).emit('gameStart', { room: roomName, host: hostID });
        }
    });

    // Sincronização de posição das raquetes
    socket.on('updatePos', (data) => {
        socket.to(data.room).emit('opponentPos', { y: data.y, player: data.player });
    });

    // Sincronização da bola (apenas o Host calcula para evitar lag)
    socket.on('ballSync', (data) => {
        socket.to(data.room).emit('ballData', data);
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor King Dev Academy na porta ${PORT}`));
