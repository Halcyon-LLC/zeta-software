function detectMCU() {
  const { SerialPort } = require('serialport')

  let path = ''
  let MCUPort = ''
  SerialPort.list().then((ports) => {
    let done = false
    let count = 0
    let allports = ports.length
    ports.forEach(function (port) {
      count = count + 1
      pm = port.manufacturer

      if (typeof pm !== 'undefined' && pm.includes('arduino')) {
        path = port.path
        MCUPort = new SerialPort(path, { baudRate: 115200 })
        MCUPort.on('open', function () {
          console.log(`connected! arduino is now connected at port ${path}`)
        })
        done = true
      }

      if (count === allports && done === false) {
        console.log(`can't find any arduino`)
      }
    })
  })
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

module.exports = { detectMCU, captureData }

detectMCU()
