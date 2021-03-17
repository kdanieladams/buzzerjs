// NodeModule imports
// const path = require('path');
// const dotenv = require('dotenv');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');

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
const io = socketio(server);

app.use(cors({ origin: 'http://localhost:8080' }))
    .use(express.json());

// Websocket Setup
// io.on('connection', socket => {

// });

// Validate Connection Params
app.post('/api/join', (req, res) => {
    // console.log('post request received...', validateUser(req.body.username, req.body.session_id));
    // res.status(401).send('request received...');

    if(!validateUser(req.body.username, req.body.session_id)) {
        console.log('invalid user...');
        res.status(401).send('User already exists!');
    }

    if(!validateSession(req.body.session_id)) {
        console.log('invalid session...');
        res.status(404).send('Session not found!');
    }

    res.status(200).send();
});

// Init Server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
