<template>
    <h2 class="center">Session has started!</h2>
    <Timer ref="timer" :active_user="active_user" 
        :session="session" :curr_seconds="curr_seconds" />
    <div v-if="active_user && active_user.username == clientUser" class="center">
        <Button color="green" text="Ready" 
            icon="fa-play" @btn-click="$emit('start-timer')" />
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
            clientUser: sessionStorage.getItem('username')
        };
    },
    methods: {
        demoTimer() {
            let maxSeconds = this.session.participant_seconds,
            currSeconds = maxSeconds;
        
            console.log('starting interval...');

            let interval = setInterval(() => {
                currSeconds--;
                this.$refs.timer.cycleTimer(currSeconds, maxSeconds);
                // console.log('cycle interval...', currSeconds);
                
                if(currSeconds == 0) 
                    clearInterval(interval);                
            }, 1000);
        }
    },
    emits: [ 'start-timer' ]
}
</script>
