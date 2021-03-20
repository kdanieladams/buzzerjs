<template>
    <h2 class="center">Session {{ session.id }} started!</h2>
    <Timer ref="timer" :active_user="active_user" 
        :session="session" />
    <div v-if="active_user && active_user.username == clientUser" class="center">
        <Button color="green" text="Ready" 
            icon="fa-play" @btn-click="demoTimer" />
    </div>
    <p>Prompts:
        <template v-for="(prompt, i) in session.prompts">
            <ItemPrompt :prompt="prompt" />
        </template>
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
                <ItemUser :user="element" :client_username="clientUser" />
            </template>
        </Draggable>
    </ul>
</template>

<script>
import draggable from 'vuedraggable';
import Button from './Button';
import ItemPrompt from './ItemPrompt';
import ItemUser from './ItemUser';
import Timer from './Timer';

export default {
    name: 'ActiveHost',
    props: {
        session: Object,
        users: Array,
        active_user: Object
    },
    components: {
        Draggable: draggable,
        Button,
        ItemPrompt,
        ItemUser,
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
p.session-property {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
}
p.session-property .value {
    font-weight: bold;
    color: #ccc;
}

#user-list li {
    cursor: move;
}
</style>