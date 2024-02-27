<template>
    <li :class="user.state.toLowerCase()">
        <div>
            <i v-if="user.state == 'Active'" class="fas fa-user-clock"></i>
            <i v-if="user.state == 'Spoken'" class="far fa-user"></i>
            <i v-if="user.state == 'Init'" class="fas fa-user"></i>
            {{ user.username }}
            <i v-if="client_username == user.username" class="small">(you)</i>
        </div>

        <div class="user-controls" v-if="showUserControls">
            <template v-if="active_user == user">
                <i v-if="playPause" class="fas fa-play" @click="clickPlayPauseUser" />
                <i v-if="!playPause" class="fas fa-pause" @click="clickPlayPauseUser" />
                <i class="fas fa-redo-alt reset-user" @click="clickResetUser" />
            </template>
            <i class="far fa-times-circle remove-user" @click="clickRemoveUser" />
        </div>
    </li>
</template>

<script>
export default {
    name: "ItemUser",
    props: {
        active_user: Object,
        client_is_host: Boolean,
        client_username: String,
        play_pause: Boolean,
        user: Object
    },
    data() {
        return {
            playPause: this.play_pause
        };
    },
    computed: {
        showUserControls() {
            return this.client_is_host && !(this.client_username == this.user.username);
        }
    },
    methods: {
        clickPlayPauseUser(e) {
            this.playPause = !this.playPause;
            this.$emit('play-pause-timer', this.user);
        },
        clickRemoveUser(e) {
            if(confirm(`Are you sure you want to remove ${this.user.username} from the session?`)) {
                this.$emit('remove-user', this.user);
            }
        },
        clickResetUser(e) {
            if(confirm(`Are you sure you want to reset ${this.user.username}'s timer?`)) {
                this.$emit('reset-user', this.user);
            }
        }
    },
    mounted() {
        this.$watch('play_pause', (newVal, oldVal) => {
            this.playPause = newVal;
        });
        this.playPause = true;
    },
    emits: [ 'play-pause-timer', 'remove-user', 'reset-user' ]
}
</script>

<style scoped>
li {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    padding: 5px;
}
li div:first-child {
    flex: 4;
}
li .user-controls {
    display: flex;
    object-position: center;
}
li .user-controls i {
    margin: 0 3px;
    color: #999;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1.25rem;
}
li .user-controls i:hover {
    color: #fff;
}
li i.remove-user {
    font-size: 1.25rem;
}
li i.remove-user:hover {
    color: red;
}
li i.reset-user:hover {
    color: orange;
}
li.active {
    background-color: #050;
    font-weight: bold;
}
li.spoken {
    color: #999;
}
</style>