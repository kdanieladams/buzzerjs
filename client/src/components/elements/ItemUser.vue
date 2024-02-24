<template>
    <li :class="user.state">
        <div>
            <i v-if="user.state == 'active'" class="fas fa-user-clock"></i>
            <i v-if="user.state == 'spoken'" class="far fa-user"></i>
            <i v-if="!user.state" class="fas fa-user"></i>
            {{ user.username }}
            <i v-if="client_username == user.username" class="small">(you)</i>
        </div>
        <i v-if="client_is_host && !(client_username == user.username)" 
            class="far fa-times-circle remove-user" 
            @click="$emit('remove-user', user)" />
    </li>
</template>

<script>
export default {
    name: "ItemUser",
    props: {
        client_is_host: Boolean,
        client_username: String,
        user: Object
    },
    emits: [ 'remove-user' ]
}
</script>

<style scoped>
li {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    padding: 5px;
}
li div {
    flex: 5;
}
li i.remove-user {
    color: #999;
    cursor: pointer;
    font-size: 1.5rem;
}
li i.remove-user:hover {
    color: red;
}
li.active {
    background-color: #050;
    font-weight: bold;
}
li.spoken {
    color: #999;
}
</style>