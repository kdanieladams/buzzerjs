<template>
    <div :class="'prompt ' + (isActive ? 'active' : '') + (isFinished ? 'finished' : '')">
        <i v-if="isActive == true" class="far fa-question-circle"></i> 
        {{ prompt.text }}
    </div>
</template>

<script>
export default {
    name: "ItemPrompt",
    props: {
        prompt: Object
    },
    computed: {
        isActive() {
            return this.prompt.state != 'Init' && this.prompt.state != 'Finished';
        },
        isFinished() {
            return this.prompt.state == 'Finished';
        }
    }
}
</script>

<style scoped>
.prompt {
    background-color: #333; 
    margin: 10px 0;
    padding: 5px;
}
.prompt.active {
    background-color: #777;
    font-weight: bold;
}
.prompt.finished {
    color: #555;
}
</style>