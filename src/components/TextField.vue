<template>
  <input
    class="textField"
    v-model="textField"
    maxlength="60"
    :placeholder="placeholderText"
    @change="sendText(textField)"
  />
</template>

<script>
export default {
  name: 'TextField',

  props: {
    placeHolder: String,
  },

  data() {
    return {
      textField: "",
    };
  },

  computed: {
    placeholderText() {
      return this.placeHolder || "";
    }
  },

  methods: {
    sendText(value) {
      this.$emit("textUpdate", value);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.textField {
  border: none;
  font-size: 18px;
  border-bottom: 1px solid;
  border-bottom-style: solid;
}