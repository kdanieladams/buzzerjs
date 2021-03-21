// NodeModule imports
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

// App Imports
const {
    getSessionUsers,
    getUserById,
    getUserBySocket,
    userJoin,
    userLeave,
    validateUser,
} = require('./utils/users');
const {
    createSession,
    destroySession,
    getSession,
    setUserOrder,
    validateSession
} = require('./utils/sessions');

// Config
dotenv.config();
const PORT = process.env.PORT || 3000;
const DEV_CLIENT_ADDR = process.env.DEV_CLIENT_ADDR || 'localhost:8080'

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

// Websocket utilities
function sortUsers(session_id) {
    let users = getSessionUsers(session_id),
        session = getSession(session_id);

    if(session.user_id_order.length > 0) {
        let ordered_user_ids = session.user_id_order.filter(usr_id => {
            return !!(users.find(user => user.id == usr_id));
        });
        
        users = ordered_user_ids.map((user_id) => {
            return users.find(user => user.id == user_id);
        });
    }

    return users;
}
function updateUserList(io, session_id) {
    let users = sortUsers(session_id);

    // console.log('updateUserList...', users, session.user_id_order);
    io.to(session_id).emit('userList', {
        session_id: session_id,
        users: users
    });
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

        // Get session info
        let session = getSession(user.session_id);

        session.user_id_order.push(user.id);

        // Confirm success
        socket.emit('verification', {
            value: true,
            msg: 'Successfully connected!',
            started: (session.state != ''),
            session: session
        });

        // Join the appropriate socket.io room
        socket.join(user.session_id);

        // Emit updated user list
        updateUserList(io, user.session_id);
    });
    
    socket.on('startSession', ({ prompts, options }) => {
        let user = getUserBySocket(socket.id),
            session = getSession(user.session_id);

        // Translate session props
        session.state = 'opening';
        session.prompts = prompts.map((prompt, index) => {
            return { 
                text: prompt, 
                users_spoken: [],
                state: '' // '', 'active', 'finished'
            };
        });
        session.host_participate = options.host_participate;
        session.participant_seconds = (parseInt(options.participant_minutes) * 60) 
            + parseInt(options.participant_seconds);
        session.roundtable_minutes = parseInt(options.roundtable_minutes);

        if(!session.host_participate) {
            let hostIndex = session.user_id_order
                .findIndex(user_id => user_id == session.host_id);

            session.user_id_order.splice(hostIndex, 1);
            updateUserList(io, session.id);
        }

        io.to(session.id).emit('sessionStarted', session);
        // console.log(`session ${session.id} started...`, session, options);
    });

    socket.on('advanceSession', () => {
        let user = getUserBySocket(socket.id),
            session = getSession(user.session_id),
            users = sortUsers(session.id);
        
        // Advance session state
        session.state = session.state == 'opening' ? 'started' : 'closing';

        if(session.state == 'started') {
            // Activate first prompt and user
            users[0].state = 'active';
            session.prompts[0].state = 'active';
            io.to(session.id).emit('advanceTimer', session.participant_seconds);
        }
        else if(session.state == 'closing') {
            // Advance all prompts, clear active user
            users.forEach(user => user.state = '');
            session.prompts.forEach(prompt => prompt.state = 'finished');
            // Reset the timer
            clearInterval(session.timer);
            io.to(session.id).emit('advanceTimer', 0);
        }

        // console.log('advanceSession...', getSessionUsers(session.id));

        // Emit updated info
        updateUserList(io, session.id);
        io.to(session.id).emit('updateSession', session);
    });

    socket.on('startTimer', () => {
        let user = getUserBySocket(socket.id),
            session = user ? getSession(user.session_id) : false;
    
        if(session && !session.timer) {
            let currSeconds = session.participant_seconds;

            // console.log('emit advanceTimer...', currSeconds);
            io.to(session.id).emit('advanceTimer', currSeconds);
            
            session.timer = setInterval(() => {
                currSeconds--;
                io.to(session.id).emit('advanceTimer', currSeconds);

                if(currSeconds == 0) {
                    let users = sortUsers(session.id),
                        userIdIndex = users.findIndex(usr => usr.id == user.id),
                        nextUser = users[userIdIndex + 1];

                    // Reset the timer
                    clearInterval(session.timer);
                    session.timer = null;

                    // console.log('nextUser...', nextUser.username, 
                    //     userIdIndex, userIds);

                    // Activate the next user
                    user.state = 'spoken';
                    if(nextUser)
                        nextUser.state = 'active';
                    
                    // Reset the visual timer
                    setTimeout(() => {
                        updateUserList(io, session.id);
                        if(nextUser)
                            io.to(session.id).emit('advanceTimer', session.participant_seconds);
                    }, 2500);
                }
            }, 1000);
        }
    });

    socket.on('reorderUsers', (new_user_id_order) => {
        let user = getUserBySocket(socket.id),
            session = getSession(user.session_id);

        if(new_user_id_order.length > 0 && session) {
            let invalidUserDetected = false;

            for(i = 0; i < new_user_id_order.length; i++) {
                let user_id = new_user_id_order[i];

                if(!getUserById(user_id)) {
                    invalidUserDetected = true;
                    break;
                }
            }

            if(invalidUserDetected)
                return;

            // console.log('reorderUsers...', session, new_user_id_order);
            setUserOrder(session.id, new_user_id_order);
            updateUserList(io, session.id);
        }
    });

    socket.on('advancePrompt', () => {
        let user = getUserBySocket(socket.id),
            session = getSession(user.session_id),
            users = sortUsers(session.id),
            activePromptIndex = session.prompts.findIndex(prompt => prompt.state == 'active'),
            activePrompt = session.prompts[activePromptIndex],
            nextPrompt = session.prompts[activePromptIndex + 1];

        if(activePrompt) {
            activePrompt.state = 'finished';
        
            if(nextPrompt) {
                nextPrompt.state = 'active';
                users.forEach(user => user.state = '');
                
                clearInterval(session.timer);
                session.timer = null;

                updateUserList(io, session.id);

                setTimeout(() => {
                    users[0].state = 'active';
                    updateUserList(io, session.id);
                    io.to(session.id).emit('advanceTimer', session.participant_seconds);
                }, 2500);
            }

            io.to(session.id).emit('updateSession', session);
        }
    });

    socket.on('disconnect', () => {
        let user = getUserBySocket(socket.id);

        if(user) {
            let session = getSession(user.session_id);
            
            // Destroy the user
            user = userLeave(user.id);
            console.log(`${user.username} disconnected...`); 
            
            // Emit updated user list
            if(session){
                let userIdIndex = session.user_id_order
                    .findIndex(user_id => user_id == user.id);

                session.user_id_order.splice(userIdIndex, 1);
                updateUserList(io, session.id);
            }

            // Destroy the session
            if(session && session.host_id == user.id) {
                destroySession(session.id);
                console.log(`session ${session.id} destroyed...`);

                io.to(session.id).emit('sessionEnd', 'The host has closed the session.');
            }
        }
    });
});

// Init Server
if(process.env.NODE_ENV == 'production')
    app.use(express.static(path.join(__dirname, 'www')));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
