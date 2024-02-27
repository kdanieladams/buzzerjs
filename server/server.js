// NodeModule imports
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

// App Imports
const SocketEvents = require('./lib/sockets');

// Config
dotenv.config();
const PORT              = process.env.PORT || 3000;
const DEV_CLIENT_ADDR   = process.env.DEV_CLIENT_ADDR || 'localhost:8080';
const UI_TIMEOUT        = process.env.UI_TIMEOUT || 1500;

// Bootstrapping
const app = express();
const server = http.createServer(app);
let io = null;

// Allow CORS in Dev Mode
if(process.env.NODE_ENV == 'development') {
    console.log('CORS Header: ' + DEV_CLIENT_ADDR);
    io = socketio(server, {
        cors: {
            origin: `http://${DEV_CLIENT_ADDR}`,
            methods: ["GET", "POST"]
        }
    });
}
else {
    io = socketio(server);
}

// Websocket Setup
io.on('connection', socket => {
    socket.on('verify', ({ username, session_id, is_host }) => {
        SocketEvents.eventVerify(io, socket, { username, session_id, is_host });
    });

    socket.on('verifyPassword', ({ session_id, password, user_id }) => {
        SocketEvents.eventVerifyPassword(io, socket, { session_id, password, user_id });
    });

    socket.on('resetUser', (user_id) => {
        SocketEvents.eventResetUser(io, socket, user_id);
    });

    socket.on('removeUser', (user_id) => {
        SocketEvents.eventRemoveUser(io, socket, user_id);
    });

    socket.on('reorderUsers', (new_user_id_order) => {
        SocketEvents.eventReorderUsers(io, socket, new_user_id_order);
    });
    
    socket.on('passwordProtectSession', ({ session_id, password }) => {
        SocketEvents.eventPasswordProtectSession(io, socket, { session_id, password });
    });

    socket.on('startSession', ({ prompts, options }) => {
        SocketEvents.eventStartSession(io, socket, { prompts, options });
    });

    socket.on('startTimer', () => {
        SocketEvents.eventStartTimer(io, socket);
    });

    socket.on('playPauseTimer', ({ session_id, curr_seconds }) => {
        SocketEvents.eventPlayPauseTimer(io, socket, { session_id, curr_seconds });
    });

    socket.on('advanceUser', () => {
        SocketEvents.eventAdvanceUser(io, socket);
    });

    socket.on('advancePrompt', () => {
        SocketEvents.eventAdvancePrompt(io, socket);
    });

    socket.on('advanceSession', () => {
        SocketEvents.eventAdvanceSession(io, socket);
    });

    socket.on('disconnect', () => {
        SocketEvents.eventDisconnect(io, socket);
    });
});

// Init Server
if(process.env.NODE_ENV == 'production')
    app.use(express.static(path.join(__dirname, 'www')));

server.listen(PORT, "127.0.0.1", () => console.log(`Server running on port ${PORT}`));
