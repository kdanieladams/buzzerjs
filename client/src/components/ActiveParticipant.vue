<template>
    <h2 class="center">Session has started!</h2>
    <div id="timer">
        <div v-if="users.length > 0" id="active-user">{{ users[0].username }}</div>
    </div>
    <p>Prompts:
        <div v-for="(prompt, i) in session.prompts" class="small" style="background-color: #333; margin: 10px 0;"> 
            {{ prompt }}
        </div>
    </p>
    <hr />
    <p>Users:</p>
    <ul>
        <li v-for="(user, i) in users">
            {{ user.username }}
        </li>
    </ul>
</template>

<script>
import ProgressBar from 'progressbar.js';

export default {
    name: 'ActiveParticipant',
    props: {
        session: Object,
        users: Array
    },
    methods: {
        initTimer() {
            let maxSeconds = this.session.participant_minutes * 60,
                currSeconds = maxSeconds,
                timerInterval = null;

            let circleTimer = new ProgressBar.Circle('#timer', {
                strokeWidth: 2,
                easing: 'easeInOut',
                duration: 300,
                color: '#FFEA82',
                trailColor: '#333',
                trailWidth: 1
            });

            timerInterval = setInterval(() => {
                if(currSeconds == 0)
                    clearInterval(timerInterval);
                circleTimer.animate(currSeconds/maxSeconds);
                circleTimer.setText(this.translateSeconds(currSeconds));
                currSeconds--;
            }, 1000);
        },
        translateSeconds(seconds) {
            let minutes = Math.floor(seconds / 60);
            seconds = seconds - (minutes * 60);

            if(seconds < 10) seconds = "0" + seconds;

            return minutes + ":" + seconds;
        }
    },
    mounted() {
        this.initTimer();
    }
}
</script>

<style scoped>
#timer {
    position: relative;
    margin: 20px auto;
    width: 200px;
    height: 200px;
    font-size: 2rem;
}

#timer #active-user {
    position: absolute;
    bottom: 25px;
    width: 100%;
    font-size: 1rem;
    text-align: center;
}
</style>