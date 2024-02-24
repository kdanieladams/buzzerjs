<template>
    <SessionId :session_id="session.id" :show_session_code="show_session_code"
        @hide-session-click="clickHideSessionCode" />
    <h5 class="center" id="session-state">{{ session.state }}</h5>
    <Timer ref="timer" :active_user="active_user" :session="session" 
        :curr_seconds="curr_seconds" :max_seconds="max_seconds" />
    <div v-if="showTimerBtn" class="center">
        <Button v-if="!timerStarted" color="green" text="Ready" 
            icon="fa-play" @btn-click="startTimer" />
        <Button v-if="timerStarted && curr_seconds != 0 && !isRoundtable" color="#ad6f00" text="Yield Time" 
            icon="fa-pause" @btn-click="$emit('advance-user')" />
    </div>
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
    <hr />
    <p class="session-property">
        Host is participating? 
        <span class="value" :style="session.host_participate ? 'color: green;' : 'color: red;'">
            {{ session.host_participate }}
        </span>
    </p>
    <p class="session-property">
        Participant time:
        <span class="value">
            {{ translatedSeconds }}
        </span>
    </p>
    <p class="session-property">
        Roundtable time:
        <span class="value">{{ session.roundtable_minutes }}:00</span>
    </p>
    <div class="right">
        <template v-if="session.state == 'started'">
            <Button v-if="!isRoundtable" text="Next User" icon="fa-angle-double-right"
                @btn-click="$emit('advance-user')" /> 
            <Button :text="(isRoundtable ? 'Next' : 'Advance') + ' Prompt'" icon="fa-angle-double-right" 
                @btn-click="$emit('advance-prompt')" />
        </template>
        <Button :text="btnPrimaryProps.text" :color="btnPrimaryProps.color" 
            :icon="btnPrimaryProps.icon" :icon_before="btnPrimaryProps.icon_before"
            @btn-click="btnPrimaryClick" />
    </div>
</template>

<script>
import Button from './elements/Button';
import ItemPrompt from './elements/ItemPrompt';
import ItemUser from './elements/ItemUser';
import SessionId from './elements/SessionId';
import Timer from './elements/Timer';

export default {
    name: 'ActiveHost',
    props: {
        active_user: Object,
        curr_seconds: Number,
        max_seconds: Number,
        session: Object,
        users: Array,
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
            translatedSeconds: '0:00',
            timerStarted: false,
            show_session_code: true,
            btnPrimaryProps: {
                text: 'Begin Debate',
                color: 'green',
                icon: 'fa-angle-double-right',
                icon_before: false
            }
        }
    },
    computed: {
        showTimerBtn() {
            let activePrompt = this.session.prompts
                .find(p => p.state == 'active' || p.state == 'roundtable');
            
            return (this.active_user && this.active_user.username == this.clientUser) 
                || (activePrompt && activePrompt.state == 'roundtable');
        },
        isRoundtable() {
            let roundtableIndex = this.session.prompts.findIndex(p => p.state == 'roundtable');
            return (roundtableIndex != -1);
        }
    },
    methods: { 
        btnPrimaryClick() {
            if(this.session.state == 'closing') {
                this.$router.push('/');
                return;
            }

            this.$emit('advance-session');
        },
        clickHideSessionCode(e) {
            this.show_session_code = !this.show_session_code;
        },
        startTimer() {
            this.$emit('start-timer');
            this.timerStarted = true;
        }
    },
    mounted() {
        this.translatedSeconds = this.$refs.timer.translateSeconds(this.session.participant_seconds);
        
        this.$watch('active_user', () => {
                this.timerStarted = false;
        });

        this.$watch('session', (newSession, oldSession) => {
            if(newSession.state == 'opening') {
                this.btnPrimaryProps = {
                    text: 'Begin Debate',
                    color: 'green',
                    icon: 'fa-angle-double-right',
                    icon_before: false
                };
            }
            else if(newSession.state == 'started') {
                this.btnPrimaryProps = {
                    text: 'End Debate',
                    color: '#900',
                    icon: 'fa-stop-circle',
                    icon_before: true
                };
            }
            else {
                this.btnPrimaryProps = {
                    text: 'Go Back',
                    icon: 'fa-angle-double-left',
                    icon_before: true
                };
            }
        });
    },
    emits: [ 
        'advance-prompt', 
        'advance-session', 
        'advance-user',
        'start-timer'
    ]
}
</script>

<style scoped>
h5 {
    text-transform: uppercase;
    font-size: 0.8rem;
}

p.session-property {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
}
p.session-property .value {
    font-weight: bold;
    color: #ccc;
}

#user-list {
    margin-bottom: 15px;
}
</style>