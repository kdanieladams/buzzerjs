<template>
    <div class="center" v-if="!showRegistrationForm">
        <p>What would you like to do?</p>
        <Button text="Host a Panel" color="#900" @btn-click="showForm(true)" />
        <Button text="Participate in a Panel" @btn-click="showForm()" />    
    </div>
    <div v-if="showRegistrationForm">
        <a href="#" @click="hideForm()">&lt;&lt; Back</a>
        <RegistrationForm :isHosting="isHosting" />
    </div>
</template>

<script>
import Button from '../components/Button';
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
    },
    created() {
        sessionStorage.removeItem('username');
    }
}
</script>
