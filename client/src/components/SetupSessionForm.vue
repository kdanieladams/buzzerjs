<template>
    <h2 class="center">{{ session_id }}</h2>
    <h4 class="center">Hey {{ username }}! Setup your new session.</h4>
    <p>Enter the prompts for debate (<i class="small">drag and drop to sort</i>):</p>
    <form @submit="onPromptSubmit" id="add-prompts-form">
        <div class="form-control">
            <input v-model="newPrompt" 
                name="prompt-text" 
                placeholder="Add new prompt..." 
                autocomplete="off"
            />
        </div>
        <Button icon="fa-plus" />
    </form>
    <ul id="prompt-list">
        <Draggable :list="prompts" item-key="(elm) => { return elm; }">
            <template #item="{ element, index }">
                <li>
                    <div>{{ element }}</div> 
                    <i class='far fa-times-circle delete-prompt' @click="deletePrompt(index)"></i>
                </li>        
            </template>
        </Draggable>
    </ul>
    <p>Select options for the session:</p>
    <form id="options-form">
        <div class="form-control">
            <label for="host-participate">
                <div>Will the host participate in the debate?</div>
                <input v-model="options.host_participate" type="checkbox" id="host-participate" />
            </label>
        </div>
        <div class="form-control">
            <label for="time-min">
                Participant response time? <i class="small">(mm:ss)</i>
            </label>
            <input v-model="masked_participant_seconds" v-maska="'##:##'" placeholder="00:00"
                inputmode="numeric" />
        </div>
        <div class="form-control">
            <label for="time-roundtable">
                Roundtable minutes? <span class="small">(enter '0' for no roundtable)</span>
            </label>
            <input v-model="masked_roundtable_minutes" v-maska="'##:00'"
                id="time-roundtable" placeholder="01:00" size="2" max="99" min="0" 
                inputmode="numeric" />
        </div>
    </form>
    <p>Users (<i class="small">drag and drop to sort</i>):</p>
    <ul id="user-list">
        <Draggable :list="users" item-key="id" @end="$emit('user-sort', users)">
            <template #item="{ element, index }">
                <ItemUser :user="element" :client_username="clientUser" />
            </template>
        </Draggable>
    </ul>
    <div class="center">
        <Button text="Start Session" color="green" icon="fa-play" 
            @btn-click="onFormSubmit" />
    </div>
</template>

<script>
import draggable from 'vuedraggable';
import Button from './Button';
import ItemUser from './ItemUser';

export default {
    name: "SetupSessionForm",
    props: {
        users: Array
    },
    components: {
        Draggable: draggable,
        Button,
        ItemUser
    },
    data: () => ({
        clientUser: sessionStorage.getItem('username'),
        newPrompt: '',
        options: {
            host_participate: true,
            participant_seconds: null,
            roundtable_minutes: null
        },
        prompts: [],
        username: sessionStorage.getItem('username'),
        session_id: '',
        masked_participant_seconds: "",
        masked_roundtable_minutes: ""
    }),
    methods: {
        onPromptSubmit(e) {
            e.preventDefault();

            if(this.newPrompt) {
                this.prompts.push(this.newPrompt);
                this.newPrompt = '';
            }
        },
        deletePrompt(index) {
            // if(confirm("Are you sure you want to delete the selected prompt?"))
            this.prompts.splice(index, 1);
        },
        onFormSubmit(e) {
            let masked_part_seconds = this.masked_participant_seconds.split(":"),
                masked_round_minutes = this.masked_roundtable_minutes.split(":");

            this.options.participant_seconds = (parseInt(masked_part_seconds[0]) * 60)
                + parseInt(masked_part_seconds[1]);
            this.options.roundtable_minutes = parseInt(masked_round_minutes[0]);
            
            // console.log(this.options);
            this.$emit('begin-session', { prompts: this.prompts, options: this.options })
        }
    },
    created() {
        this.session_id = this.$route.params.session_id;
    },
    emits: [ 'begin-session', 'user-sort' ]
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
#add-prompts-form ::v-deep(button.btn) {
    flex: 1;
    margin-right: 0;
    padding: 0;
    font: 1.2rem bold sans-serif;
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
    cursor: move;
}
#prompt-list li i.delete-prompt {
    color: #900;
    cursor: pointer;
    font-size: 1.5rem;
}
#prompt-list li i.delete-prompt:hover {
    color: red;
}

#options-form {
    margin-bottom: 30px;
}

#user-list li {
    cursor: move;
}
#user-list li:hover {
    background-color: #555;
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
