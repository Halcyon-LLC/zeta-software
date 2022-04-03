var five = require('johnny-five')
var board = new five.Board()

function read_sensor() {
  board.on('ready', function () {
    var sensor = new five.Sensor('A14')

    // Scale the sensor's data from 0-1023 to 0-10 and log changes
    sensor.on('change', function () {
      console.log(this)
    })
  })
}
