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

function userJoin(username, ip, session_id) {
    const user = { id: generateUserId(), username, ip, session_id };

    users.push(user);
    console.log('user joined', user);
    return user;
}

function userLeave(id) {
    const index = users.findIndex(user => user.id === id);
    
    if(index !== -1) {
        return users.splice(index, 1)[0];
    }
}

function getSessionUsers(session) {
    return users.filter(user => user.session_id == session);
}

function validateUser(username, session) {
    let invalidUser = users.find(user => user.username == username && user.session_id == session);

    if(invalidUser || !username)
        return false;

    return true;
}

module.exports = {
    getSessionUsers,
    userJoin,
    userLeave,
    validateUser
};
