// NodeModule imports
// const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

// App Imports
const {
    getSessionUsers,
    userJoin,
    userLeave,
    validateUser
} = require('./utils/users');
const {
    createSession,
    destroySession,
    validateSession
} = require('./utils/sessions');

// Config
// dotenv.config();
const PORT = process.env.PORT || 3000;

// Bootstrapping
const app = express();
const server = http.createServer(app);
let io = null;

if(process.env.NODE_ENV == 'development') {
    console.log('NODE_ENV = development');
    io = socketio(server, {
        cors: {
            origin: "http://localhost:8080",
            methods: ["GET", "POST"]
        }
    });
}
else {
    console.log('NODE_ENV = production');
    io = socketio(server);
}

// Websocket Setup
io.on('connection', socket => {
    // Validate user and session id
    socket.on('verify', ({ username, session_id }) => {
        if(!validateUser(username, session_id)) {
            socket.emit('verification', {
                value: false,
                msg: 'User already exists!'
            });
            socket.disconnect();
            return;
        }

        if(!validateSession(session_id)) {
            socket.emit('verification', {
                value: false,
                msg: 'Session ID not found!'
            });
            socket.disconnect();
            return;
        }

        // Add user
        userJoin(username, '127.0.0.1', session_id);

        // Confirm success
        socket.emit('verification', {
            value: true,
            msg: 'Successfully connected!'
        });
    });
});

// Init Server
app.use(express.static(path.join(__dirname, 'www')));
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
