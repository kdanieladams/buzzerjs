const sessions = [];

function createSession(session_id, host_id) {
    let session = sessions.find(s => s.id == session_id);

    if(!session) {
        session = { 
            id: session_id,
            host_id: host_id,
            prompts: [],
            host_participate: false,
            participant_minutes: 0,
            roundtable_minutes: 0,
            started: false
        };
        sessions.push(session);
        console.log(`session ${session.id} created...`);
    }
    
    return session;
}

function destroySession(session_id) {
    let index = sessions.findIndex(session => session.id === session_id);
    
    if(index !== -1) {
        return sessions.splice(index, 1)[0];
    }
}

function getSession(session_id) {
    return sessions.find(s => s.id == session_id);
}

function validateSession(session_id) {
    let valid = sessions.findIndex(session => session.id == session_id) !== -1;
    // console.log('validate session', valid, sessions);
    return valid;
}

module.exports = {
    createSession,
    destroySession,
    getSession,
    validateSession
};
