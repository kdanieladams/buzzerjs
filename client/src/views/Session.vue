<template>
    <p v-if="!verified" class="center">
        Attempting to connect...
    </p>
    <WaitingRoom v-if="verified" :session_id="session_id" />
</template>

<script>
import { io } from "socket.io-client";
import WaitingRoom from '../components/WaitingRoom';

export default {
    name: 'Session',
    components: {
        WaitingRoom
    },
    data() {
        return {
            session_id: '',
            socket: null,
            verified: false
        };
    },
    methods: {
        verify(value, msg) {
            console.log('verification', value, msg);
            
            if(!value) {
                alert(msg);
                this.$router.push('/');
                return;
            }

            this.verified = value;
        }
    },
    created() {
        this.socket = io('http://localhost:3000');
    },
    mounted() {
        let username = sessionStorage.getItem('username');
        
        this.session_id = this.$route.params.session_id;
        this.socket.emit('verify', { username, session_id: this.session_id });
        this.socket.on('verification', ({ value, msg }) => {
            this.verify(value, msg);
        });
    }
}
</script>
