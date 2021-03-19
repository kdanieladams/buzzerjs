<template>
    <h2 class="center">Session {{ session.id }} started!</h2>
    <p>Prompts:
        <div v-for="(prompt, i) in session.prompts" class="small" style="background-color: #333; margin: 10px 0;"> 
            {{ prompt }}
        </div>
    </p>
    <hr />
    <p>Host is participating? {{ session.host_participate }}</p>
    <p>Participant minutes: {{ session.participant_minutes }}</p>
    <p>Roudtable minutes: {{ session.roundtable_minutes }}</p>
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

export default {
    name: 'ActiveHost',
    props: {
        session: Object,
        users: Array
    },
    components: {
        Draggable: draggable
    },
    data() {
        return {
            clientUser: sessionStorage.getItem('username')
        }
    },
    methods: {
        sortUsers() {
            console.log('draggable sort...');
        }
    },
    emits: [ 'user-sort' ]
}
</script>

<style scoped>
#user-list li {
    cursor: move;
}
</style>