<template>
    <div id="timer">
        <div id="timer-text" v-html="timerText"></div>
    </div>
</template>

<script>
import ProgressBar from 'progressbar.js';

export default {
    name: 'Timer',
    props: { 
        active_user: Object,
        session: Object,
        curr_seconds: Number,
        max_seconds: Number
    },
    data() {
        return {
            circleTimer: null
        };
    },
    methods: {
        cycleTimer(currSeconds, maxSeconds) {
            maxSeconds = maxSeconds || this.max_seconds;
            currSeconds = currSeconds || 0;

            this.circleTimer.animate(currSeconds/maxSeconds);
            this.circleTimer.setText(this.translateSeconds(currSeconds));
        },
        initTimer() {
            this.circleTimer = new ProgressBar.Circle('#timer', {
                strokeWidth: 2,
                easing: 'easeInOut',
                duration: 300,
                color: '#FFEA82',
                trailColor: '#333',
                trailWidth: 1
            });

            this.cycleTimer(0, this.session.participant_seconds);
        },
        translateSeconds(seconds) {
            let minutes = Math.floor(seconds / 60);
            seconds = seconds - (minutes * 60);

            if(seconds < 10) seconds = "0" + seconds;

            return minutes + ":" + seconds;
        }
    },
    computed: {
        timerText() {
            let activePrompt = this.session.prompts
                .find(prompt => prompt.state != 'Init' && prompt.state != 'Finished');
            let text = "";

            if(activePrompt) {
                text = activePrompt.state;

                if(this.active_user) {
                    text = this.active_user.username + "<br />"
                        + "<i style='font-size: 0.8rem;'>" + activePrompt.state + "</i>";
                }
            }
            
            return text;
        }
    },
    mounted() {
        this.initTimer();
        this.$watch('curr_seconds', (newVal, oldVal) => {
            this.cycleTimer(newVal);
        });
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

#timer #timer-text {
    position: absolute;
    top: 125px; 
    width: 100%;
    font-size: 1rem;
    text-align: center;
    line-height: 1.25rem;
}
</style>
