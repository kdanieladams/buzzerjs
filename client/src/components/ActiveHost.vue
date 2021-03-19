<template>
    <h2 class="center">Session {{ session.id }} started!</h2>
    <Timer ref="timer" :active_user="users[0]" 
        :session="session" />
    <div v-if="users.length > 0 && users[0].username == clientUser" class="center">
        <Button color="green" text="Ready" 
            icon="fa-play" @btn-click="demoTimer" />
    </div>
    <p>Prompts:
        <div v-for="(prompt, i) in session.prompts" 
            :class="i == 0 ? 'prompt active' : 'prompt'"> 
            <i v-if="i == 0" class='fas fa-question'></i> {{ prompt.text }}
        </div>
    </p>
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
        Roudtable time:
        <span class="value">{{ session.roundtable_minutes }}:00</span>
    </p>
    <hr />
    <p>Users:</p>
    <ul id="user-list">
        <Draggable :list="users" item-key="id" @end="$emit('user-sort', users)">
            <template #item="{ element, index }">
                <li :class="index == 0 ? 'active' : ''">
                    <i v-if="index == 0" class="fas fa-user-clock"></i>
                    <i v-if="index != 0" class="fas fa-user"></i>
                    {{ element.username }}
                    <i v-if="clientUser == element.username" class="small">(you)</i>
                </li>
            </template>
        </Draggable>
    </ul>
</template>

<script>
import draggable from 'vuedraggable';
import Button from './Button';
import Timer from './Timer';

export default {
    name: 'ActiveHost',
    props: {
        session: Object,
        users: Array
    },
    components: {
        Draggable: draggable,
        Button,
        Timer
    },
    data() {
        return {
            clientUser: sessionStorage.getItem('username'),
            translatedSeconds: '0:00'
        }
    },
    methods: {
        demoTimer() {
            let maxSeconds = this.session.participant_seconds,
            currSeconds = maxSeconds;

            let interval = setInterval(() => {
                currSeconds--;
                this.$refs.timer.cycleTimer(currSeconds, maxSeconds);
                // console.log('cycle interval...', currSeconds);
                
                if(currSeconds == 0) 
                    clearInterval(interval);                
            }, 1000);
        }
    },
    mounted() {
        this.translatedSeconds = this.$refs.timer.translateSeconds(this.session.participant_seconds);
    },
    emits: [ 'user-sort' ]
}
</script>

<style scoped>
hr {
    border-color: #999;
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

.prompt {
    background-color: #333; 
    margin: 10px 0;
    padding: 5px;
}
.prompt.active {
    background-color: #777;
    font-weight: bold;
}

#user-list li {
    cursor: move;
}
</style>