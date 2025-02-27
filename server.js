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
    console.log('User connected:', socket.id);

    socket.on('set name', (name) => {
        socket.username = name;
        if (waitingUser) {
            socket.partner = waitingUser;
            waitingUser.partner = socket;

            socket.emit('paired');
            waitingUser.emit('paired');

            waitingUser = null;
        } else {
            waitingUser = socket;
        }
    });

    socket.on('chat message', (msg) => {
        if (socket.partner) {
            socket.partner.emit('chat message', msg);
        }
    });

    socket.on('disconnect', () => {
        if (socket.partner) {
            socket.partner.emit('partner left');
            socket.partner.partner = null;
        } else if (waitingUser === socket) {
            waitingUser = null;
        }
        console.log('User disconnected:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
