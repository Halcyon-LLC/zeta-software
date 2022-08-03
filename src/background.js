'use strict'

import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

const path = require('path')
const fs = require('fs')
const { ipcMain } = require('electron')
const electron = require('electron')
const firmwareInterface = require('./firmwareInterface.js')

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1280,
    height: 960,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See
      // nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration
      // for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      enableRemoteModule: false,
      // __static is set by webpack and will point to the public directory
      preload: path.resolve(__static, 'preload.js'),
    },
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

ipcMain.on('MCU_CONNECTION_CHECK', async (event) => {
  while (true) {
    try {
      console.log('Waiting for MCU connection')
      await firmwareInterface.isMCU(firmwareInterface.MCUStatus.connected)
      event.reply('MCU_CONNECTION_CHECK', { connected: true })

      console.log('Watching for MCU disconnection')
      await firmwareInterface.isMCU(firmwareInterface.MCUStatus.disconnected)
      event.reply('MCU_CONNECTION_CHECK', { connected: false })
    } catch (err) {
      console.error(err)
    }
  }
})

ipcMain.on('CAPTURE_PRESSURE_DATA', async (event, payload) => {
  let message = ''
  try {
    var start = performance.now()
    message = await firmwareInterface.captureData(payload)
    var end = performance.now()
    console.log(`${end - start} milliseconds`)
  } catch (err) {
    // TODO: alert('Data capture failed')
    message = err
  }
  event.reply('CAPTURE_PRESSUE_DATA', { content: message })
})

ipcMain.on('GET_FILE_LOCATION', async (event) => {
  let selectedPath = ''

  const { canceled, filePaths } = await electron.dialog.showOpenDialog({
    properties: ['openDirectory'],
  })

  if (!canceled) {
    selectedPath = filePaths[0]
  }

  event.reply('GET_FILE_LOCATION', { content: selectedPath })
})

ipcMain.on('OPEN_SELECTED_FILE', async (event) => {
  let selectedPath = path.join(__static, './CADFiles', 'MaleKidTorso.obj')
  console.log(`CAD model loaded from ${selectedPath}`)

  const fileContent = fs.readFileSync(selectedPath).toString()
  event.reply('OPEN_SELECTED_FILE', { content: fileContent })
})

ipcMain.on('LOAD_PRESSURE_DATA', async (event) => {
  let selectedPath = ''
  const parse = require('csv-parser')

  const { canceled, filePaths } = await electron.dialog.showOpenDialog({
    properties: ['openFile'],
  })

  if (!canceled) {
    selectedPath = filePaths[0]
  }

  if (!selectedPath) return

  let rightPressureMat = []
  let leftPressureMat = []
  let backPressureMat = []
  let pressureData = {}
  const COL_END_LEFT_MAT = 16
  let lineNum = 0

  fs.createReadStream(selectedPath)
    .pipe(parse({ headers: false, delimiter: ',' }))
    .on('data', function (row) {
      for (var key in row) {
        //get left mat, 16x16(row, col) in size
        if (key < COL_END_LEFT_MAT) {
          leftPressureMat.push(row[key])
        } else {
          //on same row line, get right mat, 16x16 in size
          rightPressureMat.push(row[key])
        }
      }
      lineNum++
    })
    .on('end', function () {
      console.log('Finished loading pressure values')
      pressureData = {
        rightMatData: rightPressureMat,
        leftMatData: leftPressureMat,
        backMatData: backPressureMat,
      }
      console.log(pressureData)
      console.log(
        'Right Left Back Length: ',
        rightPressureMat.length,
        leftPressureMat.length,
        backPressureMat.length
      )
      event.reply('LOAD_PRESSURE_DATA', { content: pressureData })
    })
    .on('error', function (error) {
      console.error(error.message)
    })
})

// TODO: IMPLEMENT ME
// ipcMain.on('INIT_PRESSURE_DATA', async (event) => {

//   event.reply('INIT_PRESSURE_DATA', { content:  })
// })

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
