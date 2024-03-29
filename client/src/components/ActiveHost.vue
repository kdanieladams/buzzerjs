<template>
    <SessionId :session_id="session.id" :show_code="true" />
    <h5 class="center" id="session-state">{{ session.state }}</h5>
    <Timer ref="timer" :active_user="active_user" :session="session" 
        :curr_seconds="curr_seconds" :max_seconds="max_seconds"
        :sound_on="sound_on" />
    <div v-if="showTimerBtn" class="center">
        <Button v-if="!timerStarted" color="green" text="Ready" 
            icon="fa-play" @btn-click="startTimer" />
        <Button v-if="timerStarted && curr_seconds != 0 && !promptIsRoundtable" color="#ad6f00" text="Yield Time" 
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
            <ItemUser :user="user" :client_username="clientUser" :client_is_host="true"
                :active_user="active_user" :play_pause="play_pause_val" 
                @play-pause-timer="clickPlayPauseTimer" @remove-user="clickRemoveUser" 
                @reset-user="clickResetUser" />
        </template>
    </ul>
    <hr />
    <p>Settings:</p>
    <p class="session-property">
        Host is participating? 
        <span class="value" :style="session.host_participate ? 'color: green;' : 'color: red;'">
            {{ session.host_participate }}
        </span>
    </p>
    <p class="session-property">
        Session is password protected? 
        <span class="value" :style="!!session.password ? 'color: green;' : 'color: red;'">
            {{ !!session.password ? "true" : "false" }}
        </span>
    </p>
    <p v-if="!!session.password" class="session-property password-display">
        Password: 
        <span v-if="show_password" class="value">
            {{ session.password }}
            <i class="fas fa-eye-slash" @click="clickShowPassword" />
        </span>
        <span v-if="!show_password" class="value">
            {{ masked_password }}
            <i class="fas fa-eye" @click="clickShowPassword" />
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
    <div class="right btn-bar">
        <template v-if="session.state == 'In Progress'">
            <Button v-if="!promptIsRoundtable" text="Next User" icon="fa-angle-double-right"
                @btn-click="$emit('advance-user')" /> 
            <Button :text="(promptIsClosing ? 'Next' : 'Advance') + ' Prompt'" icon="fa-angle-double-right" 
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
import SfxDing from '../assets/sfx/reception-bell.mp3';
import Timer from './elements/Timer';

export default {
    name: 'ActiveHost',
    props: {
        active_user: Object,
        curr_seconds: Number,
        max_seconds: Number,
        session: Object,
        sound_on: Boolean,
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
            btnPrimaryProps: {
                text: 'Begin Debate',
                color: 'green',
                icon: 'fa-angle-double-right',
                icon_before: false
            },
            clientUser: sessionStorage.getItem('username'),
            masked_password: "",
            play_pause_val: true,
            show_password: false,
            translatedSeconds: '0:00',
            timerStarted: false,
        }
    },
    computed: {
        showTimerBtn() {
            let activePrompt = this.session.prompts
                .find(p => p.state != 'Init' && p.state != 'Finished');
            
            return (this.active_user && this.active_user.username == this.clientUser) 
                || (activePrompt && activePrompt.state == 'Roundtable');
        },
        promptIsRoundtable() {
            let roundtableIndex = this.session.prompts.findIndex(p => p.state == 'Roundtable');
            return (roundtableIndex != -1);
        },
        promptIsClosing() {
            let activePrompt = this.session.prompts.find(p => p.state != 'Init' && p.state != 'Finished')
            return activePrompt.state == 'Closing';
        }
    },
    methods: { 
        btnPrimaryClick() {
            if(this.session.state == 'Session Ended') {
                this.$router.push('/');
                return;
            }

            this.$emit('advance-session');
        },
        clickPlayPauseTimer(user){
            this.$emit('play-pause-timer', user.id);
        },
        clickRemoveUser(user) {
            this.$emit('remove-user', user.id);
        },
        clickResetUser(user) {
            this.$emit('reset-user', user.id);
        },
        clickShowPassword(e) {
            this.show_password = !this.show_password;
            if(!this.show_password) 
                this.masked_password = this.passwordify(this.session.password);
        },
        passwordify(str) {
            let output = "";
            for(let i = 0; i < str.length; i++) {
                output += "* ";
            }
            return output;
        },
        startTimer() {
            let activePrompt = this.session.prompts
                .find(p => p.state != 'Init' && p.state != 'Finished');

            this.$emit('start-timer');
            this.timerStarted = true;
            if(this.sound_on && activePrompt.state != "Roundtable") this.sfxDing.play();
        }
    },
    mounted() {
        this.sfxDing = new Audio(SfxDing);
        this.sfxDing.volume = 0.8;

        this.translatedSeconds = this.$refs.timer.translateSeconds(this.session.participant_seconds);
        
        if(!!this.session.password) {
            this.masked_password = this.passwordify(this.session.password);
        }

        this.$watch('active_user', () => {
            this.timerStarted = false;
        });

        this.$watch('curr_seconds', (newVal, oldVal) => {
            if(newVal < oldVal && oldVal != 0) {
                // Pause button
                this.play_pause_val = false;
            } else {
                // Play button
                this.play_pause_val = true;
            }
        });

        this.$watch('session', (newSession, oldSession) => {
            if(newSession.state == 'Prompt Intro') {
                this.btnPrimaryProps = {
                    text: 'Begin Debate',
                    color: 'green',
                    icon: 'fa-angle-double-right',
                    icon_before: false
                };
            }
            else if(newSession.state == 'In Progress') {
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
        'play-pause-timer',
        'remove-user',
        'reset-user',
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
p.session-property.password-display i:hover {
    cursor: pointer;
}

div.btn-bar {
    margin-top: 25px;
}
div.btn-bar button.btn:last-child {
    margin-right: 0; 
}
</style>