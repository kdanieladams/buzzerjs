<template>
    <h2 class="center">Session {{ session.id }}</h2>
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
import Button from './Button';
import ItemPrompt from './ItemPrompt';
import ItemUser from './ItemUser';
import Timer from './Timer';

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