<template>
  <div class="mainPage">
    <div class="userInputCapture">
      <TextField
        class="TextField"
        placeHolder="Patient's first name"
        @textUpdate="updateFirstName"
      />
      <TextField
        placeHolder="Patient's last name"
        @textUpdate="updateLastName"
      />
       <input
        class="nonEditableTextField"
        v-model="selectedPath"
        placeholder="Data download location: "
        readonly
      />
      <div class="button" @click="selectDownloadDirectory()">Choose File Directory</div>
      <div class="button" @click="readFile(selectedPath, fileName)">Capture Data</div>
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
      selectedPath: "",
    };
  },

  mounted() {
    // handle reply from the backend
    //This is remounted every single time mainPage re-renders.
    //This acts as a subscription, so you can accidentally attach multiple listeners if page re-renders.
    window.ipc.on("CAPTURE_DATA", (payload) => {
      console.log(payload.content);
    });

    window.ipc.on("GET_FILE_LOCATION", (payload) => {
        console.log(payload.content)
        this.selectedPath = payload.content
    });
  },

  computed: {
    fileName() {
      return this.firstName || this.lastName ? this.firstName + this.lastName : ''
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
      window.ipc.send("CAPTURE_DATA", payload);
    },

    selectDownloadDirectory() {
      window.ipc.send("GET_FILE_LOCATION", undefined);
    }
  },
}
</script>

<style>
.mainPage {
  text-align: center;
  margin: auto;
  color: #2c3e50;
  margin-top: 60px;
}

.textField {
  margin-top: 10px;
  margin-bottom: 15px;
}

.nonEditableTextField {
    border-width: 0px;
    border: none;
    font-size: 18px;
    margin-top: 25px;
    overflow: hidden;
    -o-text-overflow: ellipsis;
    -ms-text-overflow: ellipsis;
    text-overflow: ellipsis;
    border-bottom: 1px solid;
    border-bottom-style: solid;
    outline: none;
}

.button {
  background-color: #38b6ff;
  color: white;
  padding: 4px;
  margin-top: 8px;
  user-select: none;
  height: 22px;
  text-align: center;
  font-size: 18px;
}

.userInputCapture {
  justify-content: center;
  display: flex;
  width: 250px;
  text-align: center;
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
