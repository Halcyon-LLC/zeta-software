<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <MainPage msg="Zeta Software GUI" />
    <TextField msg="jesus" @textUpdate="updateFirstName" />
    <NumberList/>
    <div> {{ firstName }}</div>

  </div>
</template>

<script>
import MainPage from "./components/MainPage.vue";
import TextField from "./components/TextField.vue";
import NumberList from "./components/NumberList.vue";

export default {
  name: "App",
  components: {
    MainPage,
    TextField,
    NumberList,
  },

  data() {
    return {
      firstName : "",
    }
  },

  methods: {
    updateFirstName(value) {
      this.firstName = value;
    }

  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
