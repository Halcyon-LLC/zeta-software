function captureData(payload) {
  return new Promise((resolve, reject) => {
    const { PythonShell } = require('python-shell')

    const path = require('path')
    const os = require('os')

    let defaultPath = path.join(os.homedir(), 'Downloads')
    let destination = payload.path == '' ? defaultPath : payload.path

    let now = new Date()
    now = now.toISOString().slice(0, -5).replaceAll(':', '-')

    let fileName = payload.fileName == '' ? now : payload.fileName
    fileName += '.csv'

    let options = {
      mode: 'text',
      pythonPath: '.venv/bin/python3',
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: './scripts/',
      args: ['-d', path.join(destination, fileName)],
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

module.exports = { captureData }
