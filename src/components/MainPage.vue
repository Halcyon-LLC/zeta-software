<template>
  <div class="mainPage">
    <div class="CADContainer">
      <CADViewer :CADFile="selectedCADFile"/>
      <div class="button" @click="openCADFile()">Select CAD</div>
    </div>
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
      <div :class="isDataCaptureProcessing ? 'button disableButton' : 'button'" :disabled="isDataCaptureProcessing == true" 
      @click="readFile(selectedPath, fileName)">Capture Data</div>
      <dotted-loading-bar v-if="isDataCaptureProcessing" class="loadingBar"/>
    </div>
  </div>
</template>

<script>
import TextField from "./TextField.vue";
import CADViewer from "./CADViewer.vue";
import DottedLoadingBar from "./DottedLoadingBar.vue"

export default {
  name: "App",
  components: {
    TextField,
    CADViewer,
    DottedLoadingBar,
  },

  data() {
    return {
      firstName: "",
      lastName: "",
      selectedPath: "",
      selectedCADFile: "",
      isDataCaptureProcessing: false,
    };
  },

  mounted() {
    // handle reply from the backend
    //This is remounted every single time mainPage re-renders.
    //This acts as a subscription, so you can accidentally attach multiple listeners if page re-renders.
    window.ipc.on("CAPTURE_DATA", (payload) => {
      console.log(payload.content);
      this.isDataCaptureProcessing = false //data capture is complete
    });

    window.ipc.on("GET_FILE_LOCATION", (payload) => {
        console.log(payload.content)
        this.selectedPath = payload.content
    });

    window.ipc.on("OPEN_SELECTED_FILE", (payload) => {
        this.selectedCADFile = payload.content
    });
  },

  computed: {
    fileName() {
      return this.firstName || this.lastName ? this.firstName + this.lastName : ''
    },
  },

  methods: {
    updateFirstName(value) {
      this.firstName = value
    },

    updateLastName(value) {
      this.lastName = value
    },

    readFile(path, fileName) {
      const payload = { path, fileName }
      window.ipc.send("CAPTURE_DATA", payload)
    },

    selectDownloadDirectory() {
      window.ipc.send("GET_FILE_LOCATION", undefined)
    },

    openCADFile() {
      this.isDataCaptureProcessing = true
      window.ipc.send("OPEN_SELECTED_FILE", undefined)
    }
  },
}
</script>

<style>
.mainPage {
  text-align: center;
  display: flex;
  flex-direction: row;
  margin: auto;
  color: #2c3e50;
  margin-top: 60px;
}

.CADContainer {
    justify-content: center;
    display: flex;
    width: 600px;
    text-align: center;
    flex-direction: column;
    margin-left: 20px;
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

.disableButton {
  pointer-events: none;
  opacity: 0.3;
}

.button:hover {
  cursor: pointer;
}

.button:active {
  background-color: #38a0ff;
}

.loadingBar {
  margin: auto;
  margin-top: 10px;
}

.userInputCapture {
  justify-content: center;
  display: flex;
  width: 250px;
  text-align: center;
  flex-direction: column;
  margin-left: 20px;
}
</style>
