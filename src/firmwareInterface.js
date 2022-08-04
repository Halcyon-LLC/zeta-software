const MCUStatus = {
  connected: true,
  disconnected: false,
}

function isMCUInPorts(ports) {
  if (ports.length === 0) {
    throw ReferenceError('Serial port list is empty')
  }

  for (let port of ports) {
    let manufacturer = port.manufacturer

    if (
      typeof manufacturer !== 'undefined' &&
      manufacturer.includes('arduino')
    ) {
      return true
    }
  }
  return false
}

function isMCU(status) {
  const { SerialPort } = require('serialport')

  return new Promise(async (resolve, reject) => {
    while (true) {
      try {
        let ports = await SerialPort.list()
        if (isMCUInPorts(ports) === status) {
          break
        }
      } catch (e) {
        reject(e)
      }
    }

    resolve()
  })
}

function captureData(payload, isInit) {
  const { PythonShell } = require('python-shell')

  return new Promise((resolve, reject) => {
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
      args: ['-d', destination, '-i', isInit],
    }

    PythonShell.run('capture_data.py', options, (err, results) => {
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

  return path.join(destination, fileName)
}

module.exports = {
  MCUStatus,
  isMCU,
  captureData,
}
