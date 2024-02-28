<template>
    <div class="center">
        <h3>Welcome to the waiting room.</h3>
        <div class="hourglass-icon up">
            <i class="fas fa-hourglass-half"></i>
        </div>
        <p>Waiting on host to begin session {{ session_id }}<em id="ellipsis_elm">...</em></p>
        <Button text="Cancel" color="#900" @btn-click="$router.push('/')" />
    </div>
</template>

<script>
import Button from './elements/Button';

export default {
    name: 'WaitingRoom',
    components: {
        Button
    },
    data() {
        return {
            session_id: '',
            animationInterval: null
        };
    },
    mounted() {
        let ellipsisElm = document.getElementById("ellipsis_elm"),
            iconElm = document.getElementsByClassName("hourglass-icon")[0],
            halfSecondCount = 0;

        this.session_id = this.$route.params.session_id;
        this.animationInterval = setInterval((e) => {
            if(ellipsisElm.innerHTML === "...") {
                ellipsisElm.innerHTML = ".";
                return;
            }

            if(halfSecondCount >= 6) {
                iconElm.classList.toggle("up");
                iconElm.classList.toggle("down");
                halfSecondCount = 0;
            }

            ellipsisElm.innerHTML += ".";
            halfSecondCount++;
        }, 500);
    },
    beforeUnmount() {
        clearInterval(this.animationInterval);
    }
}
</script>

<style scoped>
em#ellipsis_elm {
    display: inline-block;
    width: 1rem;
    text-align: left;
}
.hourglass-icon {
    margin: 2rem 0;
    font-size: 4rem;
}
.hourglass-icon.up {
    transform: rotate(0deg);
    transition: 0.25s linear;
}
.hourglass-icon.down {
    transform: rotate(180deg);
    transition: 0.25s linear;
}
.hourglass-icon i {
    width: 96px;
    height: 96px;
    padding: 15px;
    border: solid 3px white;
    border-radius: 50%;
}
</style>
