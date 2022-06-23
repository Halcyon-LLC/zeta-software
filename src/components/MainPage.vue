<template>
  <div class="mainPage">
    <div class="CADContainer">
      <CADViewer :CADFile="selectedCADFile" :PressureData="pressureData" />
      <div v-if="isPressureDataEmpty" class="italicText">
        No data is available.
      </div>
      <div class="buttonContainer">
        <div class="button" style="width: 225px" @click="loadPressureData()">
          Load Pressure Data
        </div>
      </div>
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
      <div class="button" @click="selectDownloadDirectory()">
        Choose File Directory
      </div>
      <div
        :class="canCaptureData ? 'button disableButton' : 'button'"
        :disabled="canCaptureData == true"
        @click="readFile(selectedPath, fileName)"
      >
        Capture Data
      </div>
      <dotted-loading-bar v-if="isDataCaptureProcessing" class="loadingBar" />
      <div class="normalText">Device is not connected.</div>
    </div>
  </div>
</template>

<script>
import DottedLoadingBar from './DottedLoadingBar.vue'
import TextField from './TextField.vue'
import CADViewer from './CADViewer.vue'

export default {
  name: 'App',
  components: {
    TextField,
    CADViewer,
    DottedLoadingBar,
  },

  data() {
    return {
      firstName: '',
      lastName: '',
      selectedPath: '',
      selectedCADFile: '',
      pressureData: [],
      isDataCaptureProcessing: false,
      isPressureDataEmpty: true,
      isDeviceConnected: false, //default to false if device isnt auto conn
    }
  },

  mounted() {
    // handle reply from the backend
    //This is remounted every single time mainPage re-renders.
    //This acts as a subscription, so you can accidentally attach multiple listeners if page re-renders.
    window.ipc.on('CAPTURE_DATA', (payload) => {
      this.isDataCaptureProcessing = false //data capture is complete
    })

    window.ipc.on('GET_FILE_LOCATION', (payload) => {
      this.selectedPath = payload.content
    })

    window.ipc.on('OPEN_SELECTED_FILE', (payload) => {
      this.selectedCADFile = payload.content
    })

    window.ipc.on('LOAD_PRESSURE_DATA', (payload) => {
      this.pressureData = payload.content
      this.isPressureDataEmpty = false
    })

    window.ipc.send('OPEN_SELECTED_FILE', undefined) //call the function to load the CAD file
  },

  computed: {
    fileName() {
      return this.firstName || this.lastName
        ? this.firstName + this.lastName
        : ''
    },

    canCaptureData() {
      return this.isDataCaptureProcessing || !this.isDeviceConnected
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
      this.isDataCaptureProcessing = true
      window.ipc.send('CAPTURE_DATA', payload)
    },

    selectDownloadDirectory() {
      window.ipc.send('GET_FILE_LOCATION', undefined)
    },

    openCADFile() {
      window.ipc.send('OPEN_SELECTED_FILE', undefined)
    },

    loadPressureData() {
      window.ipc.send('LOAD_PRESSURE_DATA', undefined)
    },
  },
}
</script>

<style>
@import '../assets/styles/buttonStyles.css';

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

.userInputCapture {
  justify-content: center;
  display: flex;
  width: 250px;
  text-align: center;
  flex-direction: column;
  margin-left: 20px;
}

.italicText {
  font-style: italic;
  font-family: 'Source Sans Pro';
  font-size: 20px;
  color: #87949b;
}

.normalText {
  font-style: none;
  font-family: 'Source Sans Pro';
  margin-top: 5px;
  font-size: 20px;
  color: #87949b;
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
