const users = [];

function generateUserId() {
    let userid = '',
        characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890",
        length = 16;

    for(let i = 0; i < length; i++) {
        userid += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return userid;
}

function userJoin(username, ip, session_id, socket_id) {
    const user = { 
        id: generateUserId(), 
        username, 
        ip, 
        session_id,
        socket_id,
        state: ''
    };

    users.push(user);
    // !!! TEMPORARY
    users.forEach(user => user.state = '');
    users[users.length - 1].state = 'active';
    users[0].state = 'spoken';
    // TEMPORARY !!!

    console.log(`user joined ${session_id}`, user.username, user.id, user.ip);
    return user;
}

function userLeave(id) {
    const index = users.findIndex(usr => usr.id === id);
    
    if(index > -1) {
        return users.splice(index, 1)[0];
    }
}

function getSessionUsers(session) {
    return users.filter(user => user.session_id == session);
}

function getUserById(user_id) {
    return users.find(user => user.id == user_id);
}

function getUserBySocket(socket_id) {
    return users.find(user => user.socket_id == socket_id);
}

function validateUser(username, session) {
    let invalidUser = users.find(user => user.username == username && user.session_id == session);

    if(invalidUser || !username)
        return false;

    return true;
}

module.exports = {
    getSessionUsers,
    getUserById,
    getUserBySocket,
    userJoin,
    userLeave,
    validateUser
};
