<template>
    <div id="timer">
        <div v-if="active_user" id="active-user">
            {{ active_user.username }}
        </div>
    </div>
</template>

<script>
import ProgressBar from 'progressbar.js';

export default {
    name: 'Timer',
    props: { 
        active_user: Object,
        session: Object
    },
    data() {
        return {
            circleTimer: null
        };
    },
    methods: {
        cycleTimer(currSeconds, maxSeconds) {
            maxSeconds = maxSeconds || this.session.participant_minutes * 60;
            currSeconds = currSeconds || 0;

            this.circleTimer.animate(currSeconds/maxSeconds);
            this.circleTimer.setText(this.translateSeconds(currSeconds));
        },
        initTimer() {
            // let timerInterval = null;
            let maxSeconds = this.session.participant_minutes * 60;

            this.circleTimer = new ProgressBar.Circle('#timer', {
                strokeWidth: 2,
                easing: 'easeInOut',
                duration: 300,
                color: '#FFEA82',
                trailColor: '#333',
                trailWidth: 1
            });

            this.cycleTimer(maxSeconds, maxSeconds);

            // timerInterval = setInterval(() => {
            //     if(currSeconds == 0)
            //         clearInterval(timerInterval);
            //     circleTimer.animate(currSeconds/maxSeconds);
            //     circleTimer.setText(this.translateSeconds(currSeconds));
            //     currSeconds--;
            // }, 1000);
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