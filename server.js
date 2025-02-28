const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

let waitingUser = null;

io.on('connection', (socket) => {
    socket.on('set name', () => {
        if (waitingUser) {
            pairUsers(waitingUser, socket);
            waitingUser = null;
        } else {
            waitingUser = socket;
        }
    });

    socket.on('chat message', (data) => io.to(data.to).emit('chat message', data));

    ['video-offer', 'video-answer', 'ice-candidate'].forEach(event => {
        socket.on(event, (data) => io.to(data.to).emit(event, data));
    });

    socket.on('skip', () => pairUsers(waitingUser, socket));

    socket.on('disconnect', () => { if (waitingUser === socket) waitingUser = null; });
});

function pairUsers(user1, user2) {
    user1.emit('paired', user2.id);
    user2.emit('paired', user1.id);
}

server.listen(3000, () => console.log('Running on http://localhost:3000'));
