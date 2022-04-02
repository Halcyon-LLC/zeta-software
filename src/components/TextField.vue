<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <input v-model="textField" :placeholder="placeholderText"  @change="sendText(textField)">
  </div>
</template>

<script>
export default {
  name: "TextField",

  props: {
    msg: String,
  },

  data() {
      return {
        textField: "",
      }
  },

  computed: {
      placeholderText() {
        return "Placeholder text 1";
    }
  },

  methods: {
      sendText(value) {
        this.$emit('textUpdate', value)
      }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
