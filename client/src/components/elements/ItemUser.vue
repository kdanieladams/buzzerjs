<template>
    <li :class="user.state">
        <i v-if="user.state == 'active'" class="fas fa-user-clock"></i>
        <i v-if="user.state == 'spoken'" class="far fa-user"></i>
        <i v-if="!user.state" class="fas fa-user"></i>
        {{ user.username }}
        <i v-if="client_username == user.username" class="small">(you)</i>
    </li>
</template>

<script>
export default {
    name: "ItemUser",
    props: {
        user: Object,
        client_username: String
    }
}
</script>

<style scoped>
li {
    font-size: 0.9rem;
    padding: 5px;
}
li.active {
    background-color: #050;
    font-weight: bold;
}
li.spoken {
    color: #999;
}
</style>