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

    def get_data(self):
        self.board.samplingOn(1000 / self.sampling_rate)

        for id in range(self.num_sensors):
            recorder = partial(self._record_value, sensor_id=id)
            self.board.analog[id].register_callback(recorder)
            self.board.analog[id].enable_reporting()

        while not np.all(self.data_size_counter >= self.sample_size):
            print(self.data_size_counter)
            sleep(0.1)

        return self.readings / self.sample_size


@click.command()
@click.option('--destination', '-d', type=str, required=True)
@click.option('--mats', '-m', type=int, default=1)
@click.option('--mat-resolution', '-mr', type=int, default=5)
@click.option('--sample-size', '-n', type=int, default=100)
def cli(destination, mats, mat_resolution, sample_size):
    total_num_sensors = mats * mat_resolution
    with FSRSampler(num_sensors=total_num_sensors, sample_size=sample_size) as sampler:
        readings = sampler.get_data()

    open(destination, 'a').close()
    np.savetxt(destination, readings, fmt='%.5f', delimiter=',', header='pressure')


if __name__ == '__main__':
    cli()
