<template>
  <div class="mainPage">
    <div class="userInputCapture">
      <TextField
        class="TextField"
        placeHolder="Patient's first name"
        @textUpdate="updateFirstName"
      />
      <TextField
        class="TextField"
        placeHolder="Patient's last name"
        @textUpdate="updateLastName"
      />
      <div class="button" @click="readFile(path, fileName)">Capture Data</div>
    </div>
  </div>
</template>

<script>
import TextField from "./TextField.vue";

export default {
  name: "App",
  components: {
    TextField,
  },

  data() {
    return {
      firstName: "",
      lastName: "",
      path: "emptyFile.txt",
      logo: "./assets/HalcyonLogo.jpg",
    };
  },

  mounted() {
    // handle reply from the backend
    //This is remounted every single time mainPage re-renders.
    //This acts as a subscription, so you can accidentally attach multiple listeners if page re-renders.
    window.ipc.on("READ_FILE", (payload) => {
      console.log(payload.content);
    });
  },

  computed: {
    fileName() {
      return this.firstName + this.lastName;
    },
  },

  methods: {
    updateFirstName(value) {
      this.firstName = value;
    },

    updateLastName(value) {
      this.lastName = value;
    },

    readFile(path, fileName) {
      const payload = { path, fileName };
      window.ipc.send("READ_FILE", payload);
    },
  },
};
</script>

<style>
.mainPage {
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.textField {
  margin-top: 10px;
  margin-bottom: 15px;
  width: 180px;
}

.button {
  background-color: #38b6ff;
  color: white;
  width: 130px;
  padding: 4px;
  margin-top: 8px;
  user-select: none;
  height: 22px;
  text-align: center;
  font-size: 18px;
}

.userInputCapture {
  margin: auto;
  display: flex;
  flex-direction: column;
  margin-left: 20px;
}

.button:hover {
  cursor: pointer;
}

.button:active {
  background-color: #38a0ff;
}
</style>
