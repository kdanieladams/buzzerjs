<template>
    <div class="center">
        <h3>Welcome to the waiting room.</h3>
        <p>Waiting on session {{ sessionid }} to start...</p>
        <Button text="Cancel" color="#900" @btn-click="this.$router.push('/')" />
    </div>
</template>

<script>
import Button from '../components/Button';

export default {
    name: "WaitingRoom",
    components: {
        Button
    },
    data() {
        return {
            sessionid: ''
        };
    },
    methods: { },
    created() {
        this.sessionid = this.$route.params.sessionid;
        // TODO: open socket and get user
    }
}
</script>