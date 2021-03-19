<template>
    <router-link v-if="is_host || session_started" to="/">
        &lt;&lt; Cancel
    </router-link>
    <p v-if="!verified" class="center">
        Attempting to connect...
    </p>
    <template v-if="verified">
        <template v-if="!session_started">
            <WaitingRoom v-if="!is_host" />
            <SetupSessionForm v-if="is_host" 
                @begin-session="startSession" />
        </template>
        <template v-if="session_started">
            <ActiveParticipant v-if="!is_host" :session="active_session"
                :users="users" />
            <ActiveHost v-if="is_host" :session="active_session"
                :users="users" @user-sort="sortUsers" />
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
            is_host: false,
            session_id: '',
            session_started: false,
            socket: null,
            users: [],
            verified: false
        };
    },
    methods: {
        startSession({ prompts, options }) {
            if(prompts.length > 0) {
                this.socket.emit('startSession', { prompts, options });
            }
            else {
                alert('You must include at least one prompt.');
            }
        },
        sortUsers(users) {
            let new_user_id_order = users.map(user => user.id);

            this.socket.emit('reorderUsers', new_user_id_order);
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
            this.socket = io(`http://${ process.env.VUE_APP_SERVER_ADDR }:${ process.env.VUE_APP_SERVER_PORT }`);
        else
            this.socket = io();
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
            }
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
::v-deep(#user-list li) {
    font-size: 0.9rem;
    padding: 5px;
}
::v-deep(#user-list li.active) {
    background-color: #050;
    font-weight: bold;
}
</style>