const sessions = [];

function createSession(session_id) {
    const session = { id: session_id };
    sessions.push(session);
    
    return session;
}

function destroySession(session_id) {
    const index = sessions.findIndex(session => session.id === session_id);
    
    if(index !== -1) {
        return sessions.splice(index, 1)[0];
    }
}

function validateSession(session_id) {
    return !!sessions.findIndex(session => session.id == session_id);
}

module.exports = {
    createSession,
    destroySession,
    validateSession
};
