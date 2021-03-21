<template>
    <div :class="'prompt ' + prompt.state">
        <i v-if="prompt.state == 'active'" class="far fa-question-circle"></i> 
        {{ prompt.text }}
    </div>
</template>

<script>
export default {
    name: "ItemPrompt",
    props: {
        prompt: Object
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