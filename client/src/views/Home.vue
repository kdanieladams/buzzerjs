<template>
    <div class="center" v-if="!showRegistrationForm">
        <h3>Welcome to Buzzer.js!</h3>
        <p>What would you like to do?</p>
        <Button text="Start a Session" color="#900" @btn-click="showForm(true)" />
        <Button text="Join an Existing Session" @btn-click="showForm()" />    
    </div>
    <div v-if="showRegistrationForm">
        <a href="#" @click="hideForm()">&lt;&lt; Back</a>
        <RegistrationForm :isHosting="isHosting" />
    </div>
</template>

<script>
import Button from '../components/elements/Button';
import RegistrationForm from '../components/RegistrationForm';

export default {
    name: "Home",
    components: {
        Button,
        RegistrationForm
    },
    data() {
        return {
            showRegistrationForm: false,
            isHosting: false
        };
    },
    methods: {
        showForm(hosting) {
            this.showRegistrationForm = true;
            this.isHosting = hosting;
        },
        hideForm() {
            this.showRegistrationForm = false;
            this.isHosting = false;
        }
    }
}
</script>
