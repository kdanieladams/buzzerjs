/**
 * NodeModule imports
 */
const dotenv = require('dotenv');

/**
 * App Imports
 */
const {
    getSessionUsers,
    getUserById,
    getUserBySocket,
    userJoin,
    userLeave,
    validateUser,
} = require('./users');
const {
    createSession,
    destroySession,
    getSession,
    setUserOrder,
    validateSession
} = require('./sessions');

/**
 * Config
 */
dotenv.config();
const UI_TIMEOUT = process.env.UI_TIMEOUT || 1500;

/**
 * Websocket utilities
 */
function advanceUser(session) { 
    let {
        currUser,
        nextUser,
        activePrompt,
    } = getSessionState(session);

    resetTimer(session);

    if(activePrompt && currUser) {
        // Update current user
        currUser.state = 'spoken';

        if(nextUser) {
            // Activate the next user
            nextUser.state = 'active';
        } else {
            // Advance prompt if at end of user list
            advancePrompt(session);
        }
    }
}
function advancePrompt(session) { 
    let {
        activePrompt,
        nextPrompt,
        users
    } = getSessionState(session);
    let maxSeconds = (session.roundtable_minutes * 60);

    if(activePrompt) {
        activePrompt.state = (activePrompt.state == 'active' && maxSeconds != 0) 
            ? 'roundtable' : 'finished';

        resetTimer(session);
        users.forEach(user => user.state = '');

        if(nextPrompt && (activePrompt.state == 'finished' || maxSeconds == 0)) {
            // Activate nextPrompt
            nextPrompt.state = 'active';
            users[0].state = 'active';
        } else if(activePrompt.state == 'finished') {
            // Advance the session
            advanceSession(session);
        } 
    }
}
function advanceSession(session) { 
    let users = sortUsers(session.id);

    // Advance session state
    session.state = (session.state == 'opening') ? 'started' : 'closing';

    if(session.state == 'started') {
        // Activate first prompt and user
        users[0].state = 'active';
        session.prompts[0].state = 'active';
    }
    else if(session.state == 'closing') {
        // Advance all prompts, clear active user
        users.forEach(user => user.state = 'spoken');
        session.prompts.forEach(prompt => prompt.state = 'finished');
        
        // Reset the timer
        resetTimer(session);
    }
}
function getSessionState(session) {
    let users               = sortUsers(session.id),
        currUserIndex       = users.findIndex(usr => usr.state == 'active'),
        currUser            = users[currUserIndex],
        nextUser            = users[currUserIndex + 1],
        maxSeconds          = session.participant_seconds,
        currSeconds         = maxSeconds,
        activePromptIndex   = session.prompts
            .findIndex(prompt => prompt.state == 'active' 
                || prompt.state == 'roundtable'),
        activePrompt        = session.prompts[activePromptIndex],
        nextPrompt          = session.prompts[activePromptIndex + 1];
    
    let stateObj = {
        users,
        currUserIndex,
        currUser,
        nextUser,
        maxSeconds,
        currSeconds,
        activePromptIndex,
        activePrompt,
        nextPrompt
    };

    if(activePrompt && activePrompt.state == 'roundtable') {
        stateObj.maxSeconds = (session.roundtable_minutes * 60);
        stateObj.currSeconds = stateObj.maxSeconds;
        
        if(stateObj.maxSeconds == 0) {
            stateObj.maxSeconds = 1;
            stateObj.currSeconds = 0;
        }
    } else if(session.state == 'closing') {
        stateObj.maxSeconds = 1;
        stateObj.currSeconds = 0;
    }


    return stateObj;
}
function resetTimer(session) {
    // Reset the timer
    clearInterval(session.timer);
    session.timer = null;
}
function sortUsers(session_id) {
    let users = getSessionUsers(session_id),
        session = getSession(session_id);

    if(session && session.user_id_order.length > 0) {
        let ordered_user_ids = session.user_id_order.filter(usr_id => {
            return !!(users.find(user => user.id == usr_id));
        });
        
        users = ordered_user_ids.map((user_id) => {
            return users.find(user => user.id == user_id);
        });
    }

    return users;
}
function updateUi(io, session) {
    let { currSeconds, maxSeconds } = getSessionState(session);

    updateUserList(io, session.id);
    io.to(session.id).emit('advanceTimer', { currSeconds, maxSeconds });
    io.to(session.id).emit('updateSession', session);
}
function updateUserList(io, session_id) {
    let users = sortUsers(session_id);

    // console.log('updateUserList...', users, session.user_id_order);
    io.to(session_id).emit('userList', {
        session_id: session_id,
        users: users
    });
}

/**
 * Websocket Event Handlers
 */
function eventAdvancePrompt(io, socket) {
    let user = getUserBySocket(socket.id),
        session = getSession(user.session_id);
    
    advancePrompt(session);
    updateUi(io, session);
}
function eventAdvanceSession(io, socket) {
    let user = getUserBySocket(socket.id),
        session = getSession(user.session_id);
    
    advanceSession(session);
    updateUi(io, session);
}
function eventAdvanceUser(io, socket) {
    let user = getUserBySocket(socket.id),
        session = getSession(user.session_id);

    advanceUser(session);
    setTimeout(() => updateUi(io, session), UI_TIMEOUT);
}
function eventDisconnect(io, socket) {
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
}
function eventReorderUsers(io, socket, new_user_id_order) {
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
}
function eventStartSession(io, socket, params) {
    let { prompts, options } = params,
        user = getUserBySocket(socket.id),
        session = getSession(user.session_id);

        // Translate session props
        session.state = 'opening';
        session.prompts = prompts.map(prompt => {
            return { 
                text: prompt,
                state: '' // '', 'active', 'finished'
            };
        });

        session.host_participate = options.host_participate;
        session.roundtable_minutes = parseInt(options.roundtable_minutes);
        session.participant_seconds = parseInt(options.participant_seconds);

        if(!session.host_participate) {
            let hostIndex = session.user_id_order
                .findIndex(user_id => user_id == session.host_id);

            session.user_id_order.splice(hostIndex, 1);
            updateUserList(io, session.id);
        }

        io.to(session.id).emit('sessionStarted', session);
        // console.log(`session ${session.id} started...`, session, options);
}
function eventStartTimer(io, socket) {
    let user = getUserBySocket(socket.id),
        session = getSession(user.session_id),
        timer = null;

    if(session && !session.timer) { 
        let {
            activePrompt,
            maxSeconds,
            currSeconds
        } = getSessionState(session);

        // console.log('emit advanceTimer...', currSeconds, maxSeconds);
        io.to(session.id).emit('advanceTimer', { currSeconds, maxSeconds });

        timer = setInterval(() => {
            // Cycle timer
            if(currSeconds > 0) currSeconds--;
            io.to(session.id).emit('advanceTimer', { currSeconds, maxSeconds });

            // Finish timer
            if(currSeconds == 0) {
                resetTimer(session);
                
                if(activePrompt.state == 'roundtable') {
                    advancePrompt(session);
                } else {
                    advanceUser(session);
                }
                
                updateUi(io, session);
            }
        }, 1000);

        // Store the interval ID to be cleared later
        session.timer = parseInt(timer);
    }
}
function eventVerify(io, socket, params) {
    let { username, session_id, is_host } = params;

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
}


module.exports = {
    eventAdvancePrompt,
    eventAdvanceSession,
    eventAdvanceUser,
    eventDisconnect,
    eventReorderUsers,
    eventStartSession,
    eventStartTimer,
    eventVerify
};
