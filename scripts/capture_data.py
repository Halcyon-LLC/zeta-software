import click
import numpy as np
from serial import Serial
from serial.tools import list_ports


def autodetect_port():
    ports = list_ports.comports()
    if not ports:
        raise LookupError('No ports detected')

    arduino_port = None
    for port in ports:
        name = port.__str__().lower()
        if port.vid is not None or 'acm' in name or 'usbserial' in name or 'arduino' in name:
            arduino_port = port.device

    if arduino_port is None:
        raise LookupError('Arduino not detected')
    else:
        return arduino_port


class VelostatMat():

    def __init__(self, serial_port: Serial, num_pwr: int, num_gnd: int):
        self.serial_port = serial_port
        self.num_pwr = num_pwr
        self.num_gnd = num_gnd

    def get_readings(self):
        """Parse string sent from MCU.
            MCU sends data from all pressure points in one line.
            The parsed data will be reshaped later to proper size.

        Returns:
            NDArray: 1 x N matrix where N is the number of pressure points
        """
        while True:
            try:
                self.serial_port.write(b'\xFF')

                vin_M1, vin_M2, *vouts = self.serial_port.readline().decode()[:-1].split(',')

                self.vin = (int(vin_M1) + int(vin_M2)) / 2

                length = len(vouts)
                vouts_M1 = [int(vouts[i]) for i in range(0, length, 2)]
                vouts_M2 = [int(vouts[i]) for i in range(1, length, 2)]
                vouts = np.asarray([
                    vouts_M1[(row * 16):((row + 1) * 16)] + vouts_M2[(row * 16):((row + 1) * 16)][::-1]
                    for row in range(16)
                ])

                if vouts.shape == (16, 32):
                    return vouts

            except (ValueError, TypeError) as e:
                print(e)
                continue

    def average_voltage_readings(self):
        samples = 3
        vouts = np.zeros((16, 32))

        for _ in range(samples):
            vouts += self.get_readings()

        return vouts / samples

    def capture(self):
        vout = self.average_voltage_readings()
        resistance_velostat = 1000 * (self.vin / vout - 1)
        mass = 10**(np.log10((resistance_velostat - 90.87) / 10240) / -1.423)
        force = mass * 9.80665
        pressure = force / 36

        return np.flip(np.flip(pressure), axis=1)


@click.command()
@click.option('--destination', '-d', type=str, required=True)
@click.option('--init', '-i', type=int, required=True)
def cli(destination, init):
    if init == 1:
        destination += '_calibration.csv'
    else:
        destination += '.csv'

    open(destination, 'a').close()

    with Serial(autodetect_port(), 115200, timeout=1) as serial_port:
        mat = VelostatMat(serial_port, 16, 16)
        np.savetxt(destination, mat.capture()*100, fmt='%.5f', delimiter=',')


if __name__ == '__main__':
    cli()
