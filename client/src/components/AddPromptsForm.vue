<template>
    <h2 class="center">{{ session_id }}</h2>
    <h4 class="center">Hey {{ username }}! Setup your new session.</h4>
    <p>Enter the prompts for debate:</p>
    <form @submit="onPromptSubmit" id="add-prompts-form">
        <div class="form-control">
            <input v-model="newPrompt" 
                name="prompt-text" 
                placeholder="Add new prompt..." 
                autocomplete="off"
            />
        </div>
        <button class="btn" style="background-color: green;">
            <i class="fas fa-plus"></i>
        </button>
    </form>
    <ul id="prompt-list">
        <li v-for="(prompt, i) in prompts">
            <div>{{ prompt }}</div> 
            <i class='far fa-times-circle delete-prompt' @click="deletePrompt(i)"></i>
        </li>
    </ul>
    <p>Select options for the session:</p>
    <form id="options-form">
        <div class="form-control">
            <label for="host-participate">
                <div>Will the host participate in the debate?</div>
                <input type="checkbox" id="host-participate" />
            </label>
        </div>
        <div class="form-control time-field">
            <label for="time-min">
                Participant response minutes?
            </label>
            <input type="number" id="time-min" size="2" max="99" min="0"  value="1" />
        </div>
        <div class="form-control time-field">
            <label for="time-roundtable">
                Roundtable minutes? <span class="small">(enter '0' for no roundtable)</span>
            </label>
            <input type="number" id="time-roundtable" size="2" max="99" min="0"  value="30" />
        </div>
    </form>
    <div class="center">
        <Button text="Start Session" color="#900" icon="fa-play" />
    </div>
</template>

<script>
import Button from './Button';

export default {
    name: "AddPromptsForm",
    props: {
        session_id: String
    },
    components: {
        Button
    },
    data() {
        return {
            newPrompt: '',
            prompts: [],
            username: sessionStorage.getItem('username')
        };
    },
    methods: {
        onPromptSubmit(e) {
            e.preventDefault();

            this.prompts.push(this.newPrompt);
            this.newPrompt = '';
        },
        deletePrompt(index) {
            if(confirm("Are you sure you want to delete the selected prompt?"))
                this.prompts.splice(index, 1);
        }
    }
}
</script>

<style scoped>
h4{
    margin-bottom: 25px;
}
button.btn {
    font-size: 1rem !important;
}
label[for='host-participate'] {
    display: flex;
}
label[for='host-participate'] div {
    flex: 4;
}

#add-prompts-form {
    display: flex;
}
#add-prompts-form .form-control {
    flex: 4;
    margin: 0;
}
#add-prompts-form button {
    flex: 1;
    padding: 0;
    font: 25px bold sans-serif;
}

#prompt-list {
    margin: 15px 0 35px;
}
#prompt-list li {
    display: flex;
    align-items: center;
    list-style-type: none;
    background-color: #333;
    margin: 10px 0;
    padding: 5px;
}
#prompt-list li div {
    flex: 5;
}
#prompt-list li i.delete-prompt {
    color: #c00;
    cursor: pointer;
    font-size: 1.5rem;
}
#prompt-list li i.delete-prompt:hover {
    color: red;
}

#options-form {
    margin-bottom: 30px;
}

.time-field {
    display: flex;
    align-items: center;
}
.time-field label {
    flex: 4;
}
.time-field input {
    width: 50px;
}
</style>
