<template>
    <router-link v-if="is_host || session_started" to="/">
        <i class="fas fa-angle-double-left"></i> Cancel
    </router-link>
    <p v-if="!verified" class="center">
        Attempting to connect...
    </p>
    <template v-if="verified">
        <template v-if="!session_started">
            <WaitingRoom v-if="!is_host" />
            <SetupSessionForm v-if="is_host" :users="users"
                @begin-session="startSession" @user-sort="sortUsers" />
        </template>
        <template v-if="session_started">
            <ActiveParticipant v-if="!is_host" :session="active_session"
                :users="users" :active_user="active_user" 
                :curr_seconds="curr_seconds" :max_seconds="max_seconds" 
                @start-timer="startTimer" @advance-user="advanceUser" />
            <ActiveHost v-if="is_host" :session="active_session"
                :users="users" :active_user="active_user" 
                :curr_seconds="curr_seconds" :max_seconds="max_seconds" 
                @start-timer="startTimer" @advance-session="advanceSession" 
                @advance-prompt="advancePrompt" @advance-user="advanceUser" />
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
        sortUsers(users) {
            let new_user_id_order = users.map(user => user.id);

            this.socket.emit('reorderUsers', new_user_id_order);
        },
        startSession({ prompts, options }) {
            // Validate session setup form
            if(prompts.length == 0) {
                alert('You must include at least one prompt.');
            } else if(options.participant_seconds <= 0) {
                alert('Participant response time must be greater than 0s.');
            } else if(this.users.length <= 1) {
                alert('There must be more than 1 user present to start the session.');
            } else {
                // Start the session
                this.socket.emit('startSession', { prompts, options });
            }
        },
        startTimer() {
            this.socket.emit('startTimer');
        },
        verify(value, msg) {
            if(!value) {
                alert(msg);
                this.$router.push('/');
                return;
            }

            this.verified = value;
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
        this.socket.on('verification', ({ value, msg, started, session }) => {
            this.verify(value, msg);
            this.session_started = started;
            this.active_session = session;
        });

        // Handle session start
        this.socket.on('sessionStarted', session => {
            // console.log('sessionStarted', session);
            this.active_session = session;
            this.session_started = true;
        });

        // Update user list
        this.socket.on('userList', ({ session_id, users }) => {
            if(this.active_session && this.active_session.id == session_id) {
                this.users = users;
                this.active_user = users.find(usr => usr.state == 'active');
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
            alert(msg);
            this.$router.push('/');
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
::v-deep(#user-list) {
    list-style-type: none;
}
</style>