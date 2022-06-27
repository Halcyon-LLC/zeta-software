const { contextBridge, ipcRenderer } = require('electron')

const validChannels = [
  'MCU_CONNECTION_CHECK',
  'CAPTURE_DATA',
  'WRITE_FILE',
  'GET_FILE_LOCATION',
  'OPEN_SELECTED_FILE',
  'LOAD_PRESSURE_DATA',
]
contextBridge.exposeInMainWorld('ipc', {
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  on: (channel, func) => {
    if (validChannels.includes(channel)) {
      // Strip event as it includes `sender` and is a security risk
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
  },
})
