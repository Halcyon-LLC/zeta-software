from functools import partial
from time import sleep

import click
import numpy as np
import pyfirmata2


class FSRSampler:

    def __init__(self, num_sensors, sample_size):
        self.PORT = pyfirmata2.Arduino.AUTODETECT
        self.num_sensors = num_sensors
        self.sample_size = sample_size
        self.sampling_rate = 1000  # 1kHz
        self.readings = np.zeros(self.num_sensors)
        self.data_size_counter = np.zeros(self.num_sensors)

    def __enter__(self):
        self.board = pyfirmata2.Board(self.PORT, layout=pyfirmata2.boards.BOARDS['arduino_mega'])
        return self

    def __exit__(self, exc_type, exc_value, tb):
        self.board.samplingOff()
        self.board.exit()
        print('Board connection successfully closed')

    def _record_value(self, data, sensor_id):
        if self.data_size_counter[sensor_id] < self.sample_size:
            self.readings[sensor_id] += data
            self.data_size_counter[sensor_id] += 1

    def _convert_to_pressure(self, readings: np.array) -> np.array:
        """Convert analog reading to pressure in pascal
            voltage: voltage readings expressed in mV. float: [0, 5000]
            mass: mass in kg derived from voltage reading mv
            force: force in N calculated from m and gravitational acceleration g = 9.80665 m/s^2
            area: FSR's active area in m^2 which is a circle with diameter of 12.7mm

        Args:
            readings (np.array): annalog innput readings, ranges float: [0, 1]

        Returns:
            pressure (np.array): pressure in pascal
        """
        voltage = readings * 5000  # mapping range [0, 1] to [0, 5000]
        mass = 10**((1250 / 809) * np.log10(195300 / (5000 - voltage))) / 1000
        force = mass * 9.80665
        area = np.pi * (12.7 / 2)**2 / 1000
        pressure = force / area

        return pressure

    def get_data(self) -> np.array:
        self.board.samplingOn(1000 / self.sampling_rate)

        for id in range(self.num_sensors):
            recorder = partial(self._record_value, sensor_id=id)
            self.board.analog[id].register_callback(recorder)
            self.board.analog[id].enable_reporting()

        while not np.all(self.data_size_counter >= self.sample_size):
            print(self.data_size_counter)
            sleep(0.1)

        return self._convert_to_pressure(self.readings / self.sample_size)


@click.command()
@click.option('--destination', '-d', type=str, required=True)
@click.option('--mats', '-m', type=int, default=1)
@click.option('--mat-resolution', '-mr', type=int, default=5)
@click.option('--sample-size', '-n', type=int, default=100)
def cli(destination, mats, mat_resolution, sample_size):
    open(destination, 'a').close()

    total_num_sensors = mats * mat_resolution
    with FSRSampler(num_sensors=total_num_sensors, sample_size=sample_size) as sampler:
        readings = sampler.get_data()

    # top left, top right, bottom left, bottom right, center
    coordinates = np.array([[76.623169, 56.330269, 14.545361], [62.036472, 55.910305, -29.455305],
                            [66.146713, 5.640682, -32.606579], [88.189301, 6.051844, 16.012398],
                            [66.687050, 27.577545, -7.667533]])

    out = np.concatenate((coordinates, readings.reshape(total_num_sensors, 1)), axis=1)
    np.savetxt(destination, out, fmt='%.5f', delimiter=',', header='x,y,z,pressure')


if __name__ == '__main__':
    cli()
