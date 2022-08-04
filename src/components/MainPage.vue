<template>
  <div class="mainPage">
    <div class="CADContainer">
      <CADViewer
        :CADFile="selectedCADFile"
        :pressureData="filteredPressureData"
      />
      <div v-if="isPressureDataEmpty" class="italicText">
        No data is available.
      </div>
      <div class="buttonContainer">
        <div class="button" style="width: 225px" @click="loadPressureData()">
          Load Pressure Data
        </div>
        <div class="heatMapLegend" />
        <div class="legendTextContainer">
          <div class="legendLeftText">0 kPa</div>
          <div class="legendRightText">545 kPa</div>
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
      <div class="button" @click="calibrate()">Calibrate Pressure</div>
      <div
        :class="isDataCaptureUnavailable ? 'button disableButton' : 'button'"
        :disabled="isDataCaptureUnavailable == true"
        @click="capture(selectedPath, fileName)"
      >
        Capture Data
      </div>
      <div v-if="!isDeviceConnected" class="normalText">
        Device is not connected.
      </div>
      <dotted-loading-bar v-if="isDataCaptureProcessing" class="loadingBar" />
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
      pressureData: undefined,
      isDataCaptureProcessing: false,
      isPressureDataEmpty: true,
      isDeviceConnected: true,
    }
  },

  mounted() {
    // handle reply from the backend
    //This is remounted every single time mainPage re-renders.
    //This acts as a subscription, so you can accidentally attach multiple listeners if page re-renders.
    // window.ipc.send('MCU_CONNECTION_CHECK')

    window.ipc.on('MCU_CONNECTION_CHECK', (payload) => {
      this.isDeviceConnected = payload.connected
    })

    window.ipc.on('CALIBRATE_PRESSURE_DATA', () => {
      this.isDataCaptureProcessing = false //data capture is complete
    })

    window.ipc.on('CAPTURE_PRESSURE_DATA', (payload) => {
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

    // TODO: IMPLEMENT ME
    // window.ipc.on('INIT_PRESSURE_DATA', (payload) => {
    //
    // })

    window.ipc.send('OPEN_SELECTED_FILE', undefined) //call the function to load the CAD file
  },

  computed: {
    fileName() {
      return this.firstName || this.lastName
        ? this.firstName + '_' + this.lastName
        : ''
    },

    isDataCaptureUnavailable() {
      return !this.isDeviceConnected || this.isDataCaptureProcessing
    },

    filteredPressureData() {
      let frontLeftPressureData = []
      let backLeftPressureData = []
      let frontRightPressureData = []
      let backRightPressureData = []
      const VALUES_PER_ROW_TOTAL = 16
      const VALUES_PER_ROW = 8
      const PRESSURE_VALUES_PER_MAT = 256
      let row_index = 0

      /*
      Takes the 1x256 arrays of pressureData.leftMatData and pressureData.rightMatData and break up into
      their respective front and back arrays. The first 8 columns in the left mat go onto the chest of the torso.
      The next 8 go onto the back. The first 8 columns in the right mat go to the back and the next 8 go onto the chest.
      */
      if (this.pressureData) {
        for (let i = 0; i < PRESSURE_VALUES_PER_MAT; i++) {
          if (row_index < VALUES_PER_ROW) {
            frontLeftPressureData.push(this.pressureData.leftMatData[i])
            backRightPressureData.push(this.pressureData.rightMatData[i])
          } else {
            backLeftPressureData.push(this.pressureData.leftMatData[i])
            frontRightPressureData.push(this.pressureData.rightMatData[i])
          }

          row_index++
          row_index = row_index == VALUES_PER_ROW_TOTAL ? 0 : row_index
        }
      }

      return {
        frontLeftPressureData: frontLeftPressureData,
        backLeftPressureData: backLeftPressureData,
        frontRightPressureData: frontRightPressureData,
        backRightPressureData: backRightPressureData,
      }
    },
  },

  methods: {
    updateFirstName(value) {
      this.firstName = value
    },

    updateLastName(value) {
      this.lastName = value
    },

    calibrate(path, fileName) {
      const payload = { path, fileName }
      this.isDataCaptureProcessing = true
      window.ipc.send('CALIBRATE_PRESSURE_DATA', payload)
    },

    capture(path, fileName) {
      const payload = { path, fileName }
      this.isDataCaptureProcessing = true
      window.ipc.send('CAPTURE_PRESSURE_DATA', payload)
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
  align-items: center;
  flex-direction: column;
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

.buttonContainer {
  display: flex;
  align-items: center;
  justify-content: right;
  flex-direction: column;
  margin-top: 20px;
}

.legendTextContainer {
  display: flex;
  width: 400px;
  justify-content: right;
  flex-direction: row;
}

.legendLeftText {
  margin: 10px auto 0 0; /* top, right, bottom, left*/
  font-family: 'Source Sans Pro';
  font-size: 15px;
  color: #87949b;
}

.legendRightText {
  margin: 10px 0 0 auto;
  font-family: 'Source Sans Pro';
  font-size: 15px;
  color: #87949b;
}

.heatMapLegend {
  width: 400px;
  height: 30px;
  margin-top: 15px;
  background: linear-gradient(90deg, blue 30%, cyan, lime, yellow, red);
}
</style>
