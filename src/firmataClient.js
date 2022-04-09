function captureData(payload) {
  return new Promise((resolve, reject) => {
    const { PythonShell } = require('python-shell')

    // TODO: parse payload and pass them to python
    let options = {
      mode: 'text',
      pythonPath: '.venv/bin/python3',
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: './scripts/',
      args: ['Tim Cook'],
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
