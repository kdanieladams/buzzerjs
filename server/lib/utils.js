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
        currUser.state = Users.userState[2];

        if(nextUser) {
            // Activate the next user
            nextUser.state = Users.userState[1];
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

    if(activePrompt) {
        let activePromptStateIndex = Object.keys(Sessions.promptPhase)
            .findIndex(phase => activePrompt.state == Sessions.promptPhase[phase]);
        
        // Advance prompt state
        activePrompt.state = Sessions.promptPhase[activePromptStateIndex + 1];

        resetTimer(session);
        users.forEach(user => user.state = Users.userState[0]);

        if(activePrompt.state == Sessions.promptPhase[3]) {
            // Closing statements, kick off the first user.
            users[0].state = Users.userState[1];
        }

        if(nextPrompt && activePrompt.state == Sessions.promptPhase[4]) {
            // Set session state to Intro (gives the host a chance to read the prompt and answer questions).
            session.state = Sessions.sessionPhase[0];
            
            // Activate the next prompt
            nextPrompt.state = Sessions.promptPhase[1];
        } else if(activePrompt.state == Sessions.promptPhase[4]) {
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
        let promptIndex = session.prompts.findIndex(p => p.state != Sessions.promptPhase[0] && p.state != Sessions.promptPhase[4]);

        if(promptIndex == -1) promptIndex = 0;

        // Activate next prompt and user
        users[0].state = Users.userState[1];
        session.prompts[promptIndex].state = Sessions.promptPhase[1];
    }
    else if(session.state == Sessions.sessionPhase[2]) {
        // Advance all prompts, clear active user
        users.forEach(user => user.state = Users.userState[2]);
        session.prompts.forEach(prompt => prompt.state = Sessions.promptPhase[4]);
        
        // Reset the timer
        resetTimer(session);
    }
}

function getSessionState(session) {
    //TODO: handle lack of session object
    let users               = sortUsers(session.id),
        currUserIndex       = users.findIndex(usr => usr.state == Users.userState[1]),
        currUser            = users[currUserIndex],
        nextUser            = users[currUserIndex + 1],
        maxSeconds          = session.participant_seconds,
        currSeconds         = maxSeconds,
        activePromptIndex   = session.prompts
            .findIndex(prompt => prompt.state != Sessions.promptPhase[4] 
                && prompt.state != Sessions.promptPhase[0]),
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

    if(activePrompt && activePrompt.state == Sessions.promptPhase[2]) {
        stateObj.maxSeconds = (session.roundtable_minutes * 60);
        stateObj.currSeconds = stateObj.maxSeconds;
        
        if(stateObj.maxSeconds == 0) {
            //TODO: I dunno why this is here...there doesn't seem to be any circumstance where maxSeconds == 0
            stateObj.maxSeconds = 1;
            stateObj.currSeconds = 0;
        }
    } else if(session.state == Sessions.sessionPhase[0] || session.state == Sessions.sessionPhase[2]) {
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
