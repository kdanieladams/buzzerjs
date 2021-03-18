<template>
    <h2>Session started!</h2>
    <p>Prompts:
        <div v-for="(prompt, i) in session.prompts" class="small" style="background-color: #333; margin: 10px 0;"> 
            {{ prompt }}
        </div>
    </p>
    <hr />
    <p>Host is participating? {{ session.host_participate }}</p>
    <p>Participant minutes: {{ session.participant_minutes }}</p>
    <p>Roudtable minutes: {{ session.roundtable_minutes }}</p>
    <hr />
    <p>Users:</p>
    <ul>
        <li v-for="(user, i) in users">
            {{ user.username }}
        </li>
    </ul>
</template>

<script>
export default {
    name: 'ActiveHost',
    props: {
        session: Object,
        users: Array
    }
}
</script>
