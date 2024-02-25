const sessions = [];

const sessionPhase = {
    0: "Introduction",
    1: "In Progress",
    2: "Outtro"
};

const promptPhase = {
    0: "Init",
    1: "Opening",
    2: "Roundtable",
    3: "Closing",
    4: "Finished"
}

/**
 * Sessions Model
 */
function createSession(session_id, host_id) {
    let session = sessions.find(s => s.id == session_id);

    if(!session) {
        session = { 
            id: session_id,
            host_id: host_id,
            password: "",
            prompts: [],
            host_participate: false,
            participant_seconds: 0,
            roundtable_minutes: 0,
            state: sessionPhase[0], 
            timer: null,
            user_id_order: []
        };
        sessions.push(session);
        console.log(`session ${session.id} created...`);
        // console.log("sessions list: " + sessions.map(s => s.id));
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

function setUserOrder(session_id, new_user_id_order) {
    let session = getSession(session_id);
    session.user_id_order = new_user_id_order;
}

function validateSession(session_id) {
    let valid = sessions.findIndex(session => session.id == session_id) !== -1;
    return valid;
}

function validatePassword(pwd, session_id) {
    let session = getSession(session_id);
    return pwd == session.password;
}

module.exports = {
    createSession,
    destroySession,
    getSession,
    sessionPhase,
    promptPhase,
    setUserOrder,
    validateSession,
    validatePassword
};
