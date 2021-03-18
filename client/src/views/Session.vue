<template>
    <router-link v-if="is_host || session_started" to="/">
        &lt;&lt; Cancel
    </router-link>
    <p v-if="!verified" class="center">
        Attempting to connect...
    </p>
    <template v-if="verified">
        <template v-if="!session_started">
            <WaitingRoom v-if="!is_host" 
                :session_id="session_id" />
            <SetupSessionForm v-if="is_host" 
                :session_id="session_id"
                @begin-session="startSession" />
        </template>
        <template v-if="session_started">
            <h2 class="center">Session has started!</h2>
            <p>Here are the properties of the session:</p>
            <p>Prompts:
                <div v-for="(prompt, i) in active_session.prompts"> 
                    {{ prompt }}
                </div>
            </p>
            <p>Host is participating? {{ active_session.host_participate }}</p>
            <p>Participant minutes: {{ active_session.participant_minutes }}</p>
            <p>Roudtable minutes: {{ active_session.roundtable_minutes }}</p>
        </template>
    </template>
</template>

<script>
import { io } from "socket.io-client";
import WaitingRoom from '../components/WaitingRoom';
import SetupSessionForm from '../components/SetupSessionForm';

export default {
    name: 'Session',
    components: {
        WaitingRoom,
        SetupSessionForm
    },
    data() {
        return {
            active_session: null,
            session_id: '',
            is_host: false,
            session_started: false,
            socket: null,
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
        this.socket = io(`http://${ process.env.VUE_APP_SERVER_ADDR }:${ process.env.VUE_APP_SERVER_PORT }`);
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
        this.socket.on('verification', ({ value, msg, started }) => {
            this.verify(value, msg);
            this.session_started = started;
        });

        // Handle session start
        this.socket.on('sessionStarted', session => {
            console.log('sessionStarted', session);
            this.active_session = session;
            this.session_started = true;
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
