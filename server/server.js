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
const {
    sortUsers,
    updateUserList,
    evtVerify
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
        evtVerify(io, socket, { username, session_id, is_host });
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

    socket.on('startTimer', () => {
        let user = getUserBySocket(socket.id),
            session = user ? getSession(user.session_id) : false;
    
        if(session && !session.timer) {
            let promptIndex = session.prompts
                    .findIndex(prompt => prompt.state == 'active' || prompt.state == 'roundtable'),
                prompt = session.prompts[promptIndex],
                nextPrompt = session.prompts[promptIndex + 1];
            let maxSeconds = prompt.state == 'active' ? session.participant_seconds 
                    : (session.roundtable_minutes * 60),
                currSeconds = maxSeconds,
                timer = null;

            // console.log('emit advanceTimer...', currSeconds, maxSeconds);
            io.to(session.id).emit('advanceTimer', { currSeconds, maxSeconds });
            
            timer = setInterval(() => {
                // Cycle timer
                if(currSeconds > 0) currSeconds--;
                // console.log('cycle timer...', currSeconds, maxSeconds);
                io.to(session.id).emit('advanceTimer', { currSeconds, maxSeconds });

                // Finish timer
                if(currSeconds == 0) {
                    let users       = sortUsers(session.id),
                        userIdIndex = users.findIndex(usr => usr.id == user.id),
                        nextUser    = users[userIdIndex + 1];

                    // Reset the timer
                    clearInterval(session.timer);
                    session.timer = null;

                    // Update current user
                    user.state = 'spoken';

                    // Activate the next user
                    if(nextUser) {
                        nextUser.state = 'active';
                    }

                    // Update prompt state
                    if(prompt.state == 'roundtable') {
                        prompt.state = 'finished';
                        maxSeconds = 0;

                        // Update nextPrompt
                        if(nextPrompt) {    
                            nextPrompt.state = 'active';
                            users.forEach(user => user.state = '');
                            users[0].state = 'active';
                            maxSeconds = session.participant_seconds;
                        } else {
                            // Advance the session to 'closing'
                            session.state = 'closing';
                            users.forEach(user => user.state = 'spoken');
                        }
                    } else if(prompt.state == 'active' && !nextUser) {
                        prompt.state = 'roundtable';
                        users.forEach(user => user.state = '');
                        maxSeconds = (session.roundtable_minutes * 60);

                        // Advance to next prompt if no roundtable time
                        if(maxSeconds == 0) {
                            prompt.state = 'finished';
                            if(nextPrompt) nextPrompt.state = 'active';
                            users[0].state = 'active';
                            maxSeconds = session.participant_seconds;
                            // currSeconds = maxSeconds;
                        }
                    } else if(!prompt) {
                        // ...
                    } 
                    
                    // Update the UI
                    setTimeout(() => {
                        updateUserList(io, session.id);
                        io.to(session.id).emit('advanceTimer', { currSeconds: maxSeconds, maxSeconds });
                        io.to(session.id).emit('updateSession', session);
                    }, UI_TIMEOUT);
                }
            }, 1000);
            session.timer = parseInt(timer);
        }
    });

    socket.on('advanceUser', () => {
        let user            = getUserBySocket(socket.id),
            session         = getSession(user.session_id),
            users           = sortUsers(session.id),
            currUserIndex   = users.findIndex(usr => usr.state == 'active'),
            currUser        = users[currUserIndex],
            nextUser        = users[currUserIndex + 1],
            maxSeconds      = session.participant_seconds,
            currSeconds     = maxSeconds,
            activePromptIndex = session.prompts.findIndex(prompt => prompt.state == 'active'),
            activePrompt    = session.prompts[activePromptIndex];
            
        // Reset the timer
        clearInterval(session.timer);
        session.timer = null;

        if(activePrompt && currUser) {
            // Update current user
            currUser.state = 'spoken';

            // Activate the next user
            if(nextUser) {
                nextUser.state = 'active';
            }

            // console.log('advanceUser...', prompt, user.id, nextUser, users);

            if(!nextUser) {
                // Advance to roundtable if at end of user list
                activePrompt.state = 'roundtable';
                users.forEach(user => user.state = '');
                maxSeconds = (session.roundtable_minutes * 60);
                currSeconds = maxSeconds;

                // Advance to next prompt if no roundtable time
                if(maxSeconds == 0) {
                    let nextPrompt = session.prompts[activePromptIndex + 1];

                    activePrompt.state = 'finished';
                    nextPrompt.state = 'active';
                    users[0].state = 'active';
                    maxSeconds = session.participant_seconds;
                    currSeconds = maxSeconds;
                }
            }

            // Update the UI
            setTimeout(() => {
                updateUserList(io, session.id);
                io.to(session.id).emit('advanceTimer', { currSeconds: currSeconds, maxSeconds });
                io.to(session.id).emit('updateSession', session);
            }, UI_TIMEOUT);
        }
    });

    socket.on('advancePrompt', () => {
        let user                = getUserBySocket(socket.id),
            session             = getSession(user.session_id),
            users               = sortUsers(session.id),
            maxSeconds          = session.roundtable_minutes * 60,
            currSeconds         = 0,
            activePromptIndex   = session.prompts
                                    .findIndex(prompt => prompt.state == 'active' || prompt.state == 'roundtable'),
            activePrompt        = session.prompts[activePromptIndex],
            nextPrompt          = session.prompts[activePromptIndex + 1];

        if(activePrompt) {
            activePrompt.state = (activePrompt.state == 'active' && maxSeconds != 0) ? 'roundtable' : 'finished';
        
            clearInterval(session.timer);
            session.timer = null;
            users.forEach(user => user.state = '');
            updateUserList(io, session.id);

            if(nextPrompt && (activePrompt.state == 'finished' || maxSeconds == 0)) {
                // Activate nextPrompt
                nextPrompt.state = 'active';
                users[0].state = 'active';
                maxSeconds = session.participant_seconds;
                currSeconds = maxSeconds;
            } else if(activePrompt.state == 'finished'){
                // Close the session
                session.state = 'closing';
                users.forEach(user => user.state = 'spoken');
                session.prompts.forEach(prompt => prompt.state = 'finished');
            } else {
                // Advance prompt to roundtable
                currSeconds = maxSeconds;
            }

            setTimeout(() => {
                updateUserList(io, session.id);
                io.to(session.id).emit('advanceTimer', { currSeconds, maxSeconds });
                io.to(session.id).emit('updateSession', session);    
            }, UI_TIMEOUT);
        }
    });

    socket.on('advanceSession', () => {
        let user        = getUserBySocket(socket.id),
            session     = getSession(user.session_id),
            users       = sortUsers(session.id),
            currSeconds = 0;
        
        // Advance session state
        session.state = session.state == 'opening' ? 'started' : 'closing';

        if(session.state == 'started') {
            // Activate first prompt and user
            users[0].state = 'active';
            session.prompts[0].state = 'active';
            currSeconds = session.participant_seconds;
        }
        else if(session.state == 'closing') {
            // Advance all prompts, clear active user
            users.forEach(user => user.state = 'spoken');
            session.prompts.forEach(prompt => prompt.state = 'finished');
            
            // Reset the timer
            clearInterval(session.timer);
        }

        // console.log('advanceSession...', getSessionUsers(session.id));

        // Emit updated info
        io.to(session.id).emit('advanceTimer', { 
            currSeconds: currSeconds, 
            maxSeconds: session.participant_seconds 
        });
        updateUserList(io, session.id);
        io.to(session.id).emit('updateSession', session);
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
