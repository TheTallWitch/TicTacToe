const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const players = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('createRoom', () => {
        const token = generateToken(4);
        socket.join(token);
        socket.emit('roomCreated', token);
        players.push({
            id: socket.id,
            room: token,
            character: 'X'
        });
    });

    socket.on('joinRoom', (token) => {
        if (io.sockets.adapter.rooms.get(token) && io.sockets.adapter.rooms.get(token).size < 2) {
            socket.join(token);
            players.push({
                id: socket.id,
                room: token,
                character: 'O'
            });
            socket.to(token).emit('startGame', { room: token, player: 'X', turn: true });
            socket.emit('startGame', { room: token, player: 'O', turn: false });
        }
        else {
            socket.emit('roomError', 'Room is not accessible');
        }
    });

    socket.on('move', (info) => {
        const index = players.map(function(p) { return p.id; }).indexOf(socket.id);
        if (index > -1) {
            const currentPlayer = players[index];
            const newTurn = (currentPlayer.character == 'X' ? 'O' : 'X');
            io.to(info.room).emit('move', {
                character: currentPlayer.character,
                place: info.place,
                turn: newTurn
            });
        }
    });

    socket.on('disconnect', () => {
        const index = players.map(function(p) { return p.id; }).indexOf(socket.id);
        if (index > -1) {
            socket.leave(players[index].room);
            players.splice(index, 1);
        }
    });
});

const hostname = '127.0.0.1';
const port = 3000;

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

function generateToken(length) {
    var result = '';
    var characters = '0123456789';
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}