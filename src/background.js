'use strict'

import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

const path = require('path')
const fs = require('fs')
const { ipcMain } = require('electron')
const electron = require('electron')
const firmataClient = require('./firmataClient.js')

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

ipcMain.on('CONNECT_MCU', async (event) => {
  let connected = false
  try {
    await firmataClient.connectToMCU()
    connected = true
  } catch (err) {
    console.error(err)
  }

  event.reply('DETECT_MCU', { content: connected })
})

ipcMain.on('CAPTURE_DATA', async (event, payload) => {
  let message = ''
  try {
    var start = performance.now()
    message = await firmataClient.captureData(payload)
    var end = performance.now()
    console.log(`${end - start} milliseconds`)
  } catch (err) {
    // TODO: alert('Data capture failed')
    message = err
  }
  event.reply('CAPTURE_DATA', { content: message })
})

ipcMain.on('GET_FILE_LOCATION', async (event, payload) => {
  let selectedPath = ''

  const { canceled, filePaths } = await electron.dialog.showOpenDialog({
    properties: ['openDirectory'],
  })

  if (!canceled) {
    selectedPath = filePaths[0]
  }

  event.reply('GET_FILE_LOCATION', { content: selectedPath })
})

ipcMain.on('OPEN_SELECTED_FILE', async (event, payload) => {
  let selectedPath = path.join(__static, './CADFiles', 'MaleKidTorso.obj')
  console.log(selectedPath)

  const fileContent = fs.readFileSync(selectedPath).toString()
  event.reply('OPEN_SELECTED_FILE', { content: fileContent })
})

ipcMain.on('LOAD_PRESSURE_DATA', async (event, payload) => {
  let selectedPath = ''
  const parse = require('csv-parser')

  const { canceled, filePaths } = await electron.dialog.showOpenDialog({
    properties: ['openFile'],
  })

  if (!canceled) {
    selectedPath = filePaths[0]
  }

  if (!selectedPath) return

  let pressureArray = []

  fs.createReadStream(selectedPath)
    .pipe(parse({ delimiter: ',', from_line: 2 }))
    .on('data', function (row) {
      pressureArray.push(row)
    })
    .on('end', function () {
      console.log('finished')
      console.log(pressureArray)
      event.reply('LOAD_PRESSURE_DATA', { content: pressureArray })
    })
    .on('error', function (error) {
      console.log(error.message)
    })
})

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
