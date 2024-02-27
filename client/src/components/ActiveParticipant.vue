<template>
    <SessionId :session_id="session.id" />
    <h5 class="center">{{ session.state }}</h5>
    <Timer ref="timer" :active_user="active_user" :session="session" 
        :curr_seconds="curr_seconds" :max_seconds="max_seconds" />
    <div v-if="active_user && active_user.username == clientUser" class="center">
        <Button v-if="!timerStarted" color="green" text="Ready" 
            icon="fa-play" @btn-click="startTimer" />
        <Button v-if="timerStarted && curr_seconds != 0" color="#ad6f00" text="Yield Time" 
            icon="fa-pause" @btn-click="$emit('advance-user')" />
    </div>
    <br />
    <p>Prompts:
        <template v-for="(prompt, i) in session.prompts">
            <ItemPrompt :prompt="prompt" />
        </template>
    </p>
    <hr />
    <p>Users:</p>
    <ul id="user-list">
        <template v-for="(user, i) in users">
            <ItemUser :user="user" :client_username="clientUser" />
        </template>
    </ul>
</template>

<script>
import Button from './elements/Button';
import ItemPrompt from './elements/ItemPrompt';
import ItemUser from './elements/ItemUser';
import SessionId from './elements/SessionId';
import Timer from './elements/Timer';

export default {
    name: 'ActiveParticipant',
    props: {
        active_user: Object,
        curr_seconds: Number,
        max_seconds: Number,
        session: Object,
        users: Array
    },
    components: {
        Button,
        ItemPrompt,
        ItemUser,
        SessionId,
        Timer
    },
    data() {
        return {
            clientUser: sessionStorage.getItem('username'),
            timerStarted: false
        };
    },
    methods: { 
        startTimer() {
            this.$emit('start-timer');
            this.timerStarted = true;
        }
    },
    mounted(){
        this.$watch('active_user', () => {
            this.timerStarted = false;
        });

        this.$watch('curr_seconds', (newVal, oldVal) => {
            if(newVal < oldVal && oldVal != 0) {
                this.timerStarted = true;
            } else {
                this.timerStarted = false;
            }
        })
    },
    emits: [ 'advance-user', 'start-timer' ]
}
</script>

<style scoped>
h5 {
    text-transform: uppercase;
    font-size: 0.8rem;
}
</style>