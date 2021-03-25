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
 * Websocket utilities
 */
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
function evtVerify(io, socket, params) {
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
    sortUsers,
    updateUserList,
    evtVerify
};