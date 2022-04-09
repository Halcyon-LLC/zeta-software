<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <MainPage msg="Zeta Software GUI" />
    <TextField msg="jesus" @textUpdate="updateFirstName" />
    <NumberList />
    <div>{{ firstName }}</div>
    <button @click="readFile(path)">Button to Click</button>
  </div>
</template>

<script>
import MainPage from './components/MainPage.vue'
import TextField from './components/TextField.vue'
import NumberList from './components/NumberList.vue'

export default {
  name: 'App',
  components: {
    MainPage,
    TextField,
    NumberList,
  },

  mounted() {
    // handle reply from the backend
    window.ipc.on('CAPTURE_DATA', (payload) => {
      console.log(payload.content)
    })
  },

  data() {
    return {
      firstName: '',
      path: 'emptyFile.txt',
    }
  },

  methods: {
    updateFirstName(value) {
      this.firstName = value
    },

    readFile(path) {
      console.log('Hey')
      // ask backend to read file
      const payload = { path }
      window.ipc.send('CAPTURE_DATA', payload)
    },
  },
}
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
