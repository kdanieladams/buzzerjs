<template>
    <h2 class="center">Session has started!</h2>
    <Timer ref="timer" :active_user="users[0]" 
        :session="session" />
    <div v-if="users.length > 0 && users[0].username == clientUser" class="center">
        <Button color="green" text="Ready" 
            icon="fa-play" @btn-click="demoTimer" />
    </div>
    <br />
    <p>Prompts:
        <div v-for="(prompt, i) in session.prompts" class="small" 
            style="background-color: #333; margin: 10px 0;"> 
            {{ prompt }}
        </div>
    </p>
    <hr />
    <p>Users:</p>
    <ul id="user-list">
        <li v-for="(user, i) in users" 
            :class="i == 0 ? 'active' : ''">
            <i v-if="i == 0" class="fas fa-user-clock"></i>
            <i v-if="i != 0" class="fas fa-user"></i>
            {{ user.username }}
            <i v-if="clientUser == user.username" class="small">(you)</i>
        </li>
    </ul>
</template>

<script>
import Button from './Button';
import Timer from './Timer';

export default {
    name: 'ActiveParticipant',
    props: {
        session: Object,
        users: Array
    },
    components: {
        Button,
        Timer
    },
    data() {
        return {
            clientUser: sessionStorage.getItem('username')
        };
    },
    methods: {
        demoTimer() {
            let maxSeconds = (this.session.participant_minutes * 60),
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
    }
}
</script>
