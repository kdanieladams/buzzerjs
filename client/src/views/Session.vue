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
            is_host: false,
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
        // console.log('Session created', process.env);
        this.socket = io(`http://${ process.env.VUE_APP_SERVER_ADDR }:${ process.env.VUE_APP_SERVER_PORT }`);
    },
    mounted() {
        let username = sessionStorage.getItem('username');
        
        this.session_id = this.$route.params.session_id;
        this.is_host = !!(this.$route.params.is_host == 'host');

        this.socket.emit('verify', { 
            username, 
            session_id: this.session_id,
            is_host: this.is_host
        });
        this.socket.on('verification', ({ value, msg }) => {
            this.verify(value, msg);
        });
    }
}
</script>
