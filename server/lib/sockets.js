// Node Module Imports
const dotenv = require('dotenv');

// App Imports
const Sessions = require('./models/sessions');
const Users = require('./models/users');
const Utils = require('./utils');

// Config
dotenv.config();
const UI_TIMEOUT = process.env.UI_TIMEOUT || 1500;

/**
 * Websocket Event Handlers
 */
function eventAdvancePrompt(io, socket) {
    let user = Users.getUserBySocket(socket.id),
        session = Sessions.getSession(user.session_id);
    
    Utils.advancePrompt(session);
    Utils.updateUi(io, session);
}

function eventAdvanceSession(io, socket) {
    let user = Users.getUserBySocket(socket.id),
        session = Sessions.getSession(user.session_id);
    
    Utils.advanceSession(session);
    Utils.updateUi(io, session);
}

function eventAdvanceUser(io, socket) {
    let user = Users.getUserBySocket(socket.id),
        session = Sessions.getSession(user.session_id);

    Utils.advanceUser(session);
    setTimeout(() => Utils.updateUi(io, session), UI_TIMEOUT);
}

function eventDisconnect(io, socket) {
    let user = Users.getUserBySocket(socket.id);

    if(user) {
        let session = Sessions.getSession(user.session_id);
        
        if(session){
            let userIdIndex = session.user_id_order
                .findIndex(user_id => user_id == user.id);
            let { currUser } = Utils.getSessionState(session);

            // If user is activeUser, trigger advanceUser()
            if(currUser && currUser.id == user.id) {
                Utils.advanceUser(session);
            }

            // Remove the user from the user-order list
            if(userIdIndex > -1) {
                session.user_id_order.splice(userIdIndex, 1);
            }

            Utils.updateUi(io, session);
        }

        // Destroy the user
        user = Users.userLeave(user.id);
        console.log(`${user.username} disconnected...`); 

        // If user is host, destroy the session
        if(session && session.host_id == user.id) {
            Sessions.destroySession(session.id);
            console.log(`session ${session.id} destroyed...`);

            io.to(session.id).emit('sessionEnd', 'The host has closed the session.');
        }
    }
}

function eventResetUser(io, socket, user_id) {
    let user = Users.getUserById(user_id),
        session = Sessions.getSession(user.session_id),
        { currSeconds, maxSeconds } = Utils.getSessionState(session);

    Utils.resetTimer(session);
    io.to(session.id).emit('advanceTimer', { currSeconds, maxSeconds });
}

function eventRemoveUser(io, socket, user_id) {
    let user = Users.getUserById(user_id);
    
    console.log(`eventRemoveUser: host removed ${user.username} from ${user.session_id}`);
    io.to(user.session_id).emit('removedUser', user);
}

function eventReorderUsers(io, socket, new_user_id_order) {
    let user = Users.getUserBySocket(socket.id),
        session = Sessions.getSession(user.session_id);

    if(new_user_id_order.length > 0 && session) {
        let invalidUserDetected = false;

        for(i = 0; i < new_user_id_order.length; i++) {
            let user_id = new_user_id_order[i];

            if(!Users.getUserById(user_id)) {
                invalidUserDetected = true;
                break;
            }
        }

        if(invalidUserDetected)
            return;

        Sessions.setUserOrder(session.id, new_user_id_order);
        Utils.updateUserList(io, session.id);
    }
}

function eventStartSession(io, socket, params) {
    let { prompts, options } = params,
        user = Users.getUserBySocket(socket.id),
        session = Sessions.getSession(user.session_id);

    // Translate session props
    session.state = Sessions.sessionPhase[0];
    session.prompts = prompts.map(prompt => {
        return { 
            text: prompt,
            state: Sessions.promptPhase[0]
        };
    });

    session.prompts[0].state = Sessions.promptPhase[1];
    session.host_participate = options.host_participate;
    session.roundtable_minutes = parseInt(options.roundtable_minutes);
    session.participant_seconds = parseInt(options.participant_seconds);

    if(options.password_protected)
        session.password = options.password;

    if(!session.host_participate) {
        let hostIndex = session.user_id_order
            .findIndex(user_id => user_id == session.host_id);

        session.user_id_order.splice(hostIndex, 1);
        Utils.updateUserList(io, session.id);
    }

    io.to(session.id).emit('sessionStarted', session);
}

function eventStartTimer(io, socket, prevCurrSeconds = 0) {
    let user = Users.getUserBySocket(socket.id),
        session = Sessions.getSession(user.session_id),
        timer = null;

    if(session && !session.timer) { 
        let {
            activePrompt,
            maxSeconds,
            currSeconds
        } = Utils.getSessionState(session);

        if(!!prevCurrSeconds) currSeconds = prevCurrSeconds;

        io.to(session.id).emit('advanceTimer', { currSeconds, maxSeconds });

        timer = setInterval(() => {
            // Cycle timer
            if(currSeconds > 0) currSeconds--;
            io.to(session.id).emit('advanceTimer', { currSeconds, maxSeconds });

            // Finish timer
            if(currSeconds == 0) {
                Utils.resetTimer(session);
                
                if(activePrompt.state == Sessions.promptPhase[2]) {
                    Utils.advancePrompt(session);
                } else {
                    Utils.advanceUser(session);
                }
                
                Utils.updateUi(io, session);
            }
        }, 1000);

        // Store the interval ID to be cleared later
        session.timer = parseInt(timer);
    }
}

function eventPlayPauseTimer(io, socket, params) {
    let { session_id, curr_seconds } = params,
        session = Sessions.getSession(session_id);

    if(!!session.timer) {
        // Pause
        Utils.resetTimer(session);
    } else {
        // Play
        eventStartTimer(io, socket, curr_seconds);
    }
}

function eventPasswordProtectSession(io, socket, params) {
    let { session_id, password } = params;
    let session = Sessions.getSession(session_id);

    session.password = password;
    return;
}

function eventVerify(io, socket, params) {
    let { username, session_id, is_host } = params;

    // Validate user
    if(!Users.validateUser(username, session_id)) {
        socket.emit('verification', {
            value: false,
            msg: 'Invalid Username (may already exist in session).'
        });
        socket.disconnect();
        return;
    }

    // Add user
    let user = Users.userJoin(username,
        socket.handshake.address, 
        session_id,
        socket.id);

    // Create session if it doesn't exist
    if(is_host){
        Sessions.createSession(session_id, user.id);
    }

    // Validate session id
    if(!Sessions.validateSession(session_id)) {
        socket.emit('verification', {
            value: false,
            msg: 'Session ID not found.'
        });
        socket.disconnect();
        return;
    }

    // Get session info
    let session = Sessions.getSession(user.session_id);

    // Check for password, redirect logic to password verification
    if(!is_host && session.password) {
        socket.emit('verification', {
            value: false,
            msg: 'Password required.',
            user_id: user.id
        });

        return;
    }

    session.user_id_order.push(user.id);

    // Confirm success
    socket.emit('verification', {
        value: true,
        msg: 'Successfully connected!',
        started: (session.state != Sessions.sessionPhase[0]),
        session: session
    });

    // Join the appropriate socket.io room
    socket.join(user.session_id);

    // Emit updated user list
    Utils.updateUserList(io, user.session_id);
}

function eventVerifyPassword(io, socket, params) {
    let { session_id, password, user_id } = params;
    let session = Sessions.getSession(session_id);
    let user = Users.getUserById(user_id);

    if(Sessions.validatePassword(password, session_id)) {
        // Confirm success
        socket.emit('verification', {
            value: true,
            msg: 'Successfully connected!',
            started: (session.state != Sessions.sessionPhase[0]),
            session: session
        });

        // Join the session
        session.user_id_order.push(user.id);
        socket.join(user.session_id);
        Utils.updateUserList(io, user.session_id);
    } else {
        socket.emit('verification', {
            value: false,
            msg: 'Incorrect password.'
        });
        
        console.log(`failed password attempt on session: ${session.id} by user: ${user.username}`);
        return;
    }

    return;
}

module.exports = {
    eventAdvancePrompt,
    eventAdvanceSession,
    eventAdvanceUser,
    eventDisconnect,
    eventPasswordProtectSession,
    eventResetUser,
    eventRemoveUser,
    eventReorderUsers,
    eventStartSession,
    eventStartTimer,
    eventPlayPauseTimer,
    eventVerify,
    eventVerifyPassword
};
