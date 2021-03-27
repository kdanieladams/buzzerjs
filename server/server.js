// NodeModule imports
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

// App Imports
const {
    eventAdvancePrompt,
    eventAdvanceSession,
    eventAdvanceUser,
    eventDisconnect,
    eventReorderUsers,
    eventStartSession,
    eventVerify,
    eventStartTimer
} = require('./utils/sockets');

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
        eventVerify(io, socket, { username, session_id, is_host });
    });
    
    socket.on('reorderUsers', (new_user_id_order) => {
        eventReorderUsers(io, socket, new_user_id_order);
    });
    
    socket.on('startSession', ({ prompts, options }) => {
        eventStartSession(io, socket, { prompts, options });
    });

    socket.on('startTimer', () => {
        eventStartTimer(io, socket);
    });

    socket.on('advanceUser', () => {
        eventAdvanceUser(io, socket);
    });

    socket.on('advancePrompt', () => {
        eventAdvancePrompt(io, socket);
    });

    socket.on('advanceSession', () => {
        eventAdvanceSession(io, socket);
    });

    socket.on('disconnect', () => {
        eventDisconnect(io, socket);
    });
});

// Init Server
if(process.env.NODE_ENV == 'production')
    app.use(express.static(path.join(__dirname, 'www')));

server.listen(PORT, "127.0.0.1", () => console.log(`Server running on port ${PORT}`));
