<template>
    <SessionId :session_id="session_id" :show_code="true" />
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
            <label for="time-min">
                Opening/Closing statement time: <i class="small">(mm:ss)</i>
            </label>
            <input v-model="masked_participant_seconds" v-maska="'##:##'" placeholder="01:00"
                inputmode="numeric" />
        </div>
        <div class="form-control">
            <label for="time-roundtable">
                Roundtable minutes: <span class="small">(enter '0' for no roundtable)</span>
            </label>
            <input v-model="masked_roundtable_minutes" v-maska="'##:00'"
                id="time-roundtable" placeholder="10:00" size="2" max="99" min="0" 
                inputmode="numeric" />
        </div>
        <div class="form-control">
            <label for="host-participate" class="checkbox" @click="clickHostPart">
                <i class="far fa-check-square" v-if="options.host_participate"></i>
                <i class="far fa-square" v-else></i>
                <div>Will the host participate in the debate?</div>
            </label>
        </div>
        <div class="form-control">
            <label for="password-protect" class="checkbox" @click="clickPasswordProtect">
                <i class="far fa-check-square" v-if="options.password_protected"></i>
                <i class="far fa-square" v-else></i>
                <div>Will the session be password protected?</div>
            </label>
        </div>
        <template  v-if="options.password_protected">
            <div class="form-control">
                <label for="password">Password:</label>
                <input v-model="options.password" type="password" id="password"
                    @change="changePassword" :class="{ 'valid': password_valid }" />
            </div>
            <div class="form-control">
                <label for="password_confirm">Confirm Password:</label>
                <input v-model="options.password_confirm" type="password" id="password_confirm"
                    @change="changePassword" :class="{
                        'valid': password_valid,
                        'invalid': !password_valid
                    }" />
            </div>
        </template>        
    </form>
    <p>Users (<i class="small">drag and drop to sort</i>):</p>
    <ul id="user-list">
        <Draggable :list="users" item-key="id" @end="$emit('user-sort', users)">
            <template #item="{ element, index }">
                <ItemUser :user="element" :client_username="clientUser" :client_is_host="true"
                    @remove-user="clickRemoveUser" />
            </template>
        </Draggable>
    </ul>
    <div class="center">
        <Button text="Start Session" color="green" icon="fa-play" icon_before="true"
            @btn-click="onFormSubmit" />
    </div>
</template>

<script>
import draggable from 'vuedraggable';
import Button from './elements/Button';
import ItemUser from './elements/ItemUser';
import SessionId from './elements/SessionId';

export default {
    name: "SetupSessionForm",
    props: {
        users: Array
    },
    components: {
        Draggable: draggable,
        Button,
        ItemUser,
        SessionId
    },
    data: () => ({
        clientUser: sessionStorage.getItem('username'),
        newPrompt: '',
        options: {
            participant_seconds: null,
            roundtable_minutes: null,
            host_participate: false,
            password_protected: false,
            password: "",
            password_confirm: ""
        },
        prompts: [],
        username: sessionStorage.getItem('username'),
        session_id: '',
        masked_participant_seconds: "01:00",
        masked_roundtable_minutes: "10:00",
        password_valid: false
    }),
    methods: {
        deletePrompt(index) {
            // if(confirm("Are you sure you want to delete the selected prompt?"))
            this.prompts.splice(index, 1);
        },
        changePassword(e) {
            if(password.value == password_confirm.value) {
                this.password_valid = true;
                this.$emit("password-protect", password.value );
            } else {
                this.password_valid = false;
            }
        },
        clickHostPart(e) {
            this.options.host_participate = !this.options.host_participate;
        },
        clickPasswordProtect(e) {
            this.options.password_protected = !this.options.password_protected;
        },
        clickRemoveUser(user) {
            this.$emit('remove-user', user.id);
        },
        onFormSubmit(e) {
            let masked_part_seconds = !!(this.masked_participant_seconds) 
                ? this.masked_participant_seconds.split(":") : 0;
            let masked_round_minutes = !!this.masked_roundtable_minutes 
                ? this.masked_roundtable_minutes.split(":")[0] : 0;

            this.options.participant_seconds = !(!!masked_part_seconds) ? masked_part_seconds 
                : (parseInt(masked_part_seconds[0]) * 60) + parseInt(masked_part_seconds[1]);

            this.options.roundtable_minutes = parseInt(masked_round_minutes);
            
            this.$emit('begin-session', { prompts: this.prompts, options: this.options });
        },
        onPromptSubmit(e) {
            e.preventDefault();

            if(this.newPrompt) {
                this.prompts.push(this.newPrompt);
                this.newPrompt = '';
            }
        }
    },
    created() {
        this.session_id = this.$route.params.session_id;
    },
    emits: [ 
        'begin-session', 
        'user-sort', 
        'password-protect',
        'remove-user' 
    ]
}
</script>

<style scoped>
h4{
    margin-bottom: 25px;
}

label.checkbox {
    display: flex;
}
label.checkbox div {
    padding-left: 0.5rem;
    cursor: pointer;
}
label.checkbox i {
    font-size: 1.35rem;
    cursor: pointer;
}

i.fa-check-square {
    color: green;
}

input.valid {
    border: solid 2px green;
    /* border-radius: 5px; */
}
input.invalid {
    border: solid 2px red;
    /* border-radius: 5px; */
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
</style>
