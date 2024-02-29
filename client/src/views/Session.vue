<template>
    <div class="topnav">
        <div class="cancel-link">
            <router-link v-if="is_host || session_started" to="/">
                <i class="fas fa-angle-double-left"></i> Cancel
            </router-link>
        </div>
        <i v-if="session_started && !sound_on" class="fas fa-volume-mute" @click="clickToggleSound"></i>
        <i v-if="session_started && sound_on" class="fas fa-volume-up" @click="clickToggleSound"></i>
    </div>
    <p v-if="!verified" class="center">
        Attempting to connect...
    </p>
    <template v-if="verified">
        <template v-if="!session_started">
            <WaitingRoom v-if="!is_host" />
            <SetupSessionForm v-if="is_host" :users="users"
                @begin-session="startSession" @user-sort="sortUsers"
                @password-protect="passwordProtect" @remove-user="removeUser" />
        </template>
        <template v-if="session_started">
            <ActiveParticipant v-if="!is_host" :session="active_session"
                :users="users" :active_user="active_user" 
                :curr_seconds="curr_seconds" :max_seconds="max_seconds" 
                :sound_on="sound_on" @start-timer="startTimer" 
                @advance-user="advanceUser" />
            <ActiveHost v-if="is_host" :session="active_session"
                :users="users" :active_user="active_user" 
                :curr_seconds="curr_seconds" :max_seconds="max_seconds" 
                :sound_on="sound_on" @start-timer="startTimer" 
                @advance-session="advanceSession" @advance-prompt="advancePrompt" @advance-user="advanceUser"
                @play-pause-timer="playPauseTimer" @remove-user="removeUser" 
                @reset-user="resetUser" />
        </template>
    </template>
</template>

<script>
import { io } from "socket.io-client";
import ActiveHost from '../components/ActiveHost';
import ActiveParticipant from '../components/ActiveParticipant';
import SetupSessionForm from '../components/SetupSessionForm';
import WaitingRoom from '../components/WaitingRoom';

export default {
    name: 'Session',
    components: {
        ActiveHost,
        ActiveParticipant,
        SetupSessionForm,
        WaitingRoom
    },
    data() {
        return {
            active_session: null,
            active_user: null,
            curr_seconds: 0,
            max_seconds: 0,
            is_host: false,
            session_id: '',
            session_started: false,
            socket: null,
            sound_on: true,
            users: [],
            verified: false
        };
    },
    methods: {
        advancePrompt() {
            this.socket.emit('advancePrompt');
        },
        advanceSession() {
            this.socket.emit('advanceSession');
        },
        advanceUser() {
            this.socket.emit('advanceUser');
        },
        clickToggleSound() {
            this.sound_on = !this.sound_on;
        },
        passwordProtect(password) {
            this.socket.emit('passwordProtectSession', { session_id: this.session_id, password: password });
        },
        playPauseTimer(user_id) {
            this.socket.emit('playPauseTimer', { session_id: this.session_id, curr_seconds: this.curr_seconds });
        },
        removeUser(user_id) {
            this.socket.emit('removeUser', user_id);
        },
        resetUser(user_id) {
            this.socket.emit('resetUser', user_id);
        },
        sortUsers(users) {
            let new_user_id_order = users.map(user => user.id);

            this.socket.emit('reorderUsers', new_user_id_order);
        },
        startSession({ prompts, options }) {
            // Validate session setup form
            if(prompts.length == 0) {
                alert('You must include at least one prompt.');
                return;
            } 
            if(options.participant_seconds <= 0 || isNaN(options.participant_seconds)) {
                alert('Opening Statement must be greater than 0s.');
                return;
            } 
            if(options.password_protected 
                && (!options.password || options.password != options.password_confirm)) 
            {
                alert('Passwords don\'t match!');
                return;
            } 
            if(this.users.length <= 1) {
                alert('There must be more than 1 user present to start the session.');
                return;
            }
            // Start the session
            this.socket.emit('startSession', { prompts, options });
        },
        startTimer() {
            this.socket.emit('startTimer');
        },
        verify(value, msg, user_id = 0) {
            this.verified = value;

            if(!value) {
                if(msg == "Password required." && !!user_id) {
                    let pwd = prompt("Please enter the session password:");
                    // emit event back to socket to test password...
                    this.socket.emit('verifyPassword', { 
                        session_id: this.session_id,
                        user_id: user_id,
                        password: pwd
                    });
                    return;
                }

                sessionStorage.setItem("appErr", msg);
                this.$router.push('/');
                return;
            }
        }
    },
    created() {
        if(process.env.NODE_ENV == 'development')
            this.socket = io(`http://${ process.env.VUE_APP_SERVER_ADDR }`);
        else
            this.socket = io({ secure: true });
    },
    mounted() {
        let username = sessionStorage.getItem('username');
        
        this.session_id = this.$route.params.session_id;
        this.is_host = !!(this.$route.params.is_host == 'host');

        // Verify username and session id
        this.socket.emit('verify', { 
            username, 
            session_id: this.session_id,
            is_host: this.is_host
        });
        this.socket.on('verification', ({ value, msg, started, session, user_id }) => {
            this.verify(value, msg, user_id);
            if(this.verified) {
                this.session_started = started;
                this.active_session = session;
            }
        });

        // Handle session start
        this.socket.on('sessionStarted', session => {
            this.active_session = session;
            this.session_started = true;
        });

        // Update user list
        this.socket.on('userList', ({ session_id, users }) => {
            if(this.active_session && this.active_session.id == session_id) {
                this.users = users;
                this.active_user = users.find(usr => usr.state == 'Active');
            }
        });

        // Update session properties
        this.socket.on('updateSession', session => {
            this.active_session = session;
        });

        // Update timer
        this.socket.on('advanceTimer', ({ currSeconds, maxSeconds }) => {
            this.curr_seconds = currSeconds;
            this.max_seconds = maxSeconds;
        });

        // Handle session end
        this.socket.on('sessionEnd', msg => {
            sessionStorage.setItem("appErr", msg);
            this.$router.push('/');
        });

        // Handle removed user
        this.socket.on('removedUser', user => {
            if(sessionStorage.getItem('username') == user.username) {
                let msg = "You've been removed from the session by the host."
                sessionStorage.setItem("appErr", msg);
                this.$router.push('/');
            }
        });
    },
    beforeUnmount() {
        // cleanup before unmount
        this.socket.close();
        sessionStorage.removeItem('username');
    }
}
</script>

<style scoped>
.topnav {
    display: flex;
    color: #ccc;
}
.topnav div.cancel-link {
    display: inline-block;
    flex: 4;
}
.topnav i {
    display: inline-block;
    cursor: pointer;
}

.topnav i:hover {
    color: white;
}

::v-deep(#user-list) {
    list-style-type: none;
}
</style>