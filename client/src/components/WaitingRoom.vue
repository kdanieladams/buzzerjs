<template>
    <div class="center">
        <h3>Welcome to the waiting room.</h3>
        <p>Waiting on host to begin session {{ session_id }}...</p>
        <Button text="Cancel" color="#900" @btn-click="this.$router.push('/')" />
    </div>
</template>

<script>
import Button from './Button';

export default {
    name: 'WaitingRoom',
    components: {
        Button
    },
    data() {
        return {
            session_id: ''
        };
    },
    created() {
        this.session_id = this.$route.params.session_id;
    }
}
</script>
