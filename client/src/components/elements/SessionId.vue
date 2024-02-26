<template>
    <h2 class="center">
        <template v-if="show_session_code">
            {{ session_id }} <i class="fas fa-eye-slash" @click="clickHideSession" />
        </template>
        <template v-if="!show_session_code">
            * * * * * * * <i class="fas fa-eye" @click="clickHideSession" />
        </template>
    </h2>
    <h6 class="center">Session Code</h6>
</template>
<script>
export default {
    name: "SessionId",
    props: {
        session_id: String,
        show_code: Boolean
    },
    data() {
        return {
            show_session_code: this.show_code || false
        };
    },
    methods: {
        clickHideSession() {
            this.show_session_code = !this.show_session_code;
        }
    },
    mounted() {
        let h2 = document.querySelector("h2.center");

        h2.addEventListener('dblclick', function(e) {
            const selection = window.getSelection();
            const text = selection.toString();
            
            // Check if there is a trailing whitespace
            if (/\s+$/.test(text)) { 
                selection.modify("extend", "left", "character");
            }
        });
    },
    emits: [ 'hide-session-click' ]
};
</script>
<style scoped>
h2 i {
    color: #999;
    font-size: 1rem;
    font-weight: normal;
}
h2 i:hover {
    color: #fff;
    cursor: pointer;
}
h6 {
    margin-bottom: 16px;
}
</style>