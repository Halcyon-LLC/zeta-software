const { SerialPort } = require('serialport')

function getMCUPort(ports) {
  for (let port of ports) {
    let manufacturer = port.manufacturer

    if (
      typeof manufacturer !== 'undefined' &&
      manufacturer.includes('arduino')
    ) {
      return new SerialPort({ path: port.path, baudRate: 9600 })
    }
  }
}

async function connectToMCU() {
  const { waitFor } = require('wait-for-event')
  let connected = false

  while (!connected) {
    let ports = await SerialPort.list()
    let MCUPort = getMCUPort(ports)

    if (MCUPort) {
      let portConnectionEmitter = MCUPort.on('open', () => {
        console.log('MCU connected')
      })

      connected = await waitFor(portConnectionEmitter)
    }
  }
}

function captureData(payload) {
  return new Promise((resolve, reject) => {
    const { PythonShell } = require('python-shell')

    let pythonPath =
      process.platform !== 'win32'
        ? '.venv/bin/python3'
        : '.venv/Scripts/python.exe'

    let destination = getDestination(payload)

    let options = {
      mode: 'text',
      pythonPath: pythonPath,
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: './scripts/',
      args: ['-d', destination],
    }

    PythonShell.run('capture_data.py', options, function (err, results) {
      if (err) {
        reject('Data capture failed for the following reason.\n' + err)
      } else {
        console.log('results: ', results)
        resolve('Data captured')
      }
    })
  })
}

function getDestination(payload) {
  const path = require('path')
  const os = require('os')

  let defaultPath = path.join(os.homedir(), 'Downloads')
  let destination = payload.path == '' ? defaultPath : payload.path

  let now = new Date()
  now = now.toISOString().slice(0, -5).replaceAll(':', '-')

  let fileName = payload.fileName == '' ? now : payload.fileName
  fileName += '.csv'

  return path.join(destination, fileName)
}

module.exports = { connectToMCU, captureData }
