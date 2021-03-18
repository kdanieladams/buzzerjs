// NodeModule imports
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

// App Imports
const {
    getSessionUsers,
    getUserBySocket,
    userJoin,
    userLeave,
    validateUser,
} = require('./utils/users');
const {
    createSession,
    destroySession,
    getSession,
    validateSession
} = require('./utils/sessions');

// Config
const PORT = process.env.PORT || 3000;

// Bootstrapping
const app = express();
const server = http.createServer(app);
let io = null;

// Allow CORS in Dev Mode
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
    socket.on('verify', ({ username, session_id, is_host }) => {
        // Validate user
        if(!validateUser(username, session_id)) {
            socket.emit('verification', {
                value: false,
                msg: 'Invalid Username (may already exist in session).'
            });
            socket.disconnect();
            return;
        }

        // Add user
        let user = userJoin(username,  
            socket.handshake.address, 
            session_id,
            socket.id);

        // Create session if it doesn't exist
        if(is_host) createSession(session_id, user.id);

        // Validate session id
        if(!validateSession(session_id)) {
            socket.emit('verification', {
                value: false,
                msg: 'Session ID not found.'
            });
            socket.disconnect();
            return;
        }

        // Confirm success
        socket.emit('verification', {
            value: true,
            msg: 'Successfully connected!'
        });

        // Emit updated user list
        io.emit('userList', {
            session: user.session_id,
            users: getSessionUsers(user.session_id)
        });
    });
    
    socket.on('disconnect', () => {
        let user = getUserBySocket(socket.id);

        if(user) {
            let session = getSession(user.session_id);
            
            user = userLeave(user.id);
            console.log(`${user.username} disconnected...`);     

            // Emit updated user list
            io.emit('userList', {
                session: user.session_id,
                users: getSessionUsers(user.session_id)
            });

            // Destroy the session
            if(session && session.host_id == user.id) {
                destroySession(session.id);
                console.log(`session ${session.id} destroyed...`);

                io.emit('hostLeft', 'Sorry, the host has closed the session.');
            }
        }
    });
});

// Init Server
app.use(express.static(path.join(__dirname, 'www')));
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
