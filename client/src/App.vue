<template>
  <Header />
  <main>
    <router-view />
  </main>
</template>

<script>
import Header from './components/Header';

export default {
  name: 'App',
  components: {
    Header
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
select:-webkit-autofill,
select:-webkit-autofill:hover,
select:-webkit-autofill:focus  {
    -webkit-box-shadow: 0 0 0 30px #555 inset !important;
    -webkit-text-fill-color: white !important;
}

a, a:link, a:visited, a:active {
  color: #900;
  text-decoration: none;
}
a:hover {
  color: #f00;
}

body {
  background-color: #333;
  color: white;
  font-family: sans-serif;
}

button {
  padding: 10px;
  margin: 0 5px;
  border: none;
  border-radius: 4px;
  color: #ccc;
  background-color: #555;
  font: 1rem sans-serif;
  cursor: pointer;
}

header {
  max-width: 500px;
  margin: 30px auto;
  text-align: center;
}

main { 
  border-radius: 10px;
  background-color: #121212;
  max-width: 500px;
  min-height: 250px;
  margin: 30px auto;
  padding: 20px;
}

p {
  margin: 10px 0;
}

.large {
  font-size: 1.5rem;
}

.small {
  font-size: 0.8rem;
}

.center {
  text-align: center;
  width: 100%;
}

.right {
  text-align: right;
  width: 100%;
}

.form-control {
  margin: 15px 0;
}
.form-control label {
  font-weight: bold;
}
.form-control label.small {
  font-weight: normal;
}
.form-control input {
  display: block;
  width: 100%;
  padding: 5px;
  font-size: 1rem;
  background-color: #222;
  color: white;
  border: none;
}
.form-control input[type=checkbox] {
  width: auto;
  display: inline;
  margin-right: 5px;
}

#user-list {
    list-style-type: none;
}
#user-list li {
    font-size: 0.9rem;
    padding: 5px;
}
#user-list li.active {
    background-color: #050;
    font-weight: bold;
}
</style>
