const Users = require('./models/users');
const Sessions = require('./models/sessions');

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
    let users = sortUsers(session.id),
        sessionStateIndex = Object.keys(Sessions.sessionPhase)
            .findIndex((phase) => session.state == Sessions.sessionPhase[phase]);

    // Advance session state
    session.state = Sessions.sessionPhase[sessionStateIndex + 1];

    if(session.state == Sessions.sessionPhase[1]) {
        // Activate first prompt and user
        users[0].state = 'active';
        session.prompts[0].state = 'active';
    }
    else if(session.state == Sessions.sessionPhase[2]) {
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
    } else if(session.state == Sessions.sessionPhase[2]) {
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
    let users = Users.getSessionUsers(session_id),
        session = Sessions.getSession(session_id);

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

    io.to(session_id).emit('userList', {
        session_id: session_id,
        users: users
    });
}

module.exports = {
    advanceUser,
    advancePrompt,
    advanceSession,
    getSessionState,
    resetTimer,
    sortUsers,
    updateUi,
    updateUserList
};
