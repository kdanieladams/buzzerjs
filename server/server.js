// NodeModule imports
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

// App Imports
const socketEvents = require('./utils/sockets');

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
        socketEvents.eventVerify(io, socket, { username, session_id, is_host });
    });

    socket.on('verifyPassword', ({ session_id, password, user_id }) => {
        socketEvents.eventVerifyPassword(io, socket, { session_id, password, user_id });
    });

    socket.on('reorderUsers', (new_user_id_order) => {
        socketEvents.eventReorderUsers(io, socket, new_user_id_order);
    });
    
    socket.on('passwordProtectSession', ({ session_id, password }) => {
        socketEvents.eventPasswordProtectSession(io, socket, { session_id, password });
    });

    socket.on('startSession', ({ prompts, options }) => {
        socketEvents.eventStartSession(io, socket, { prompts, options });
    });

    socket.on('startTimer', () => {
        socketEvents.eventStartTimer(io, socket);
    });

    socket.on('advanceUser', () => {
        socketEvents.eventAdvanceUser(io, socket);
    });

    socket.on('advancePrompt', () => {
        socketEvents.eventAdvancePrompt(io, socket);
    });

    socket.on('advanceSession', () => {
        socketEvents.eventAdvanceSession(io, socket);
    });

    socket.on('disconnect', () => {
        socketEvents.eventDisconnect(io, socket);
    });
});

// Init Server
if(process.env.NODE_ENV == 'production')
    app.use(express.static(path.join(__dirname, 'www')));

server.listen(PORT, "127.0.0.1", () => console.log(new Date() + `: Server running on port ${PORT}`));
