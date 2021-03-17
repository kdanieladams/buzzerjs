<template>
    <div class="center">
        <h3>Welcome to the waiting room.</h3>
        <p>Waiting on session {{ session_id }} to start...</p>
        <Button text="Cancel" color="#900" @btn-click="this.$router.push('/')" />
    </div>
</template>

<script>
import Button from './Button';

export default {
    name: 'WaitingRoom',
    props: {
        session_id: String
    },
    components: {
        Button
    }
}
</script>