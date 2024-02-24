<template>
    <form @submit="onSubmit">
        <h3 v-if="isHosting" class="center">Let's start a new session!</h3>
        <h3 v-else class="center">Let's join a session!</h3>
        <div class="form-control">
            <label for="username">Username:</label>
            <input v-model="username" name="username" />
        </div>
        <div class="form-control">
            <label for="rememberme" class="small">
                <input v-model="rememberme" type="checkbox" id="rememberme" />
                Remember Username?
            </label>
        </div>
        <div v-if="isHosting" class="center">
            <p>Your Session ID for this debate will be as follows:</p>
            <p id="session-code">{{ sessionCode }}</p>
            <p class="small">Your participants require your Session ID to join.</p>
        </div>
        <div v-if="!isHosting" class="form-control">
            <label for="session-id">Session ID:</label>
            <input v-model="sessionCode" id="session-id" autocomplete="off" />
        </div>
        <div class="right">
            <Button :text="isHosting ? 'Next Step &gt;&gt;' : 'Join Session'" />
        </div>
    </form>
</template>

<script>
import Button from './elements/Button';

export default {
    name: "RegistrationForm",
    props: {
        isHosting: Boolean
    },
    components: {
        Button
    },
    data() {
        return {
            rememberme: false,
            sessionCode: "",
            username: ""
        };
    },
    methods: {
        generateSessionCode() {
            let characters = "ABCDEFGHIJKLMNPQRSTUVWXYZ1234567890",
                code = '',
                codeLength = 5;
            
            for(let i = 0; i < codeLength; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            return code;
        },
        onSubmit(e) {
            e.preventDefault();

            if(this.rememberme)
                localStorage.setItem('username', this.username);
            else
                localStorage.removeItem('username');

            sessionStorage.setItem('username', this.username);

            // send request to create user and validate/create session
            if(this.sessionCode) {
                if(this.isHosting)
                    this.$router.push({ name: 'Session', params: { session_id: this.sessionCode, is_host: 'host' } });
                else
                    this.$router.push({ name: 'Session', params: { session_id: this.sessionCode } });
            } else {
                alert("Session ID is required.");
            }
        }
    },
    created() {
        let storedUsername = localStorage.getItem('username');

        if(this.isHosting)
            this.sessionCode = this.generateSessionCode();

        if(storedUsername != null) {
            this.username = storedUsername;
            this.rememberme = true;
        }
    }
}
</script>

<style scoped>
#session-code {
    background-color: #900;
    padding: 15px;
    font-size: 2rem;
}
</style>
