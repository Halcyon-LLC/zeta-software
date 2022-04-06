import click


class FSRSampler:

    # # TODO: handle connection failure
    # PORT = pyfirmata2.Arduino.AUTODETECT
    # board = pyfirmata2.Arduino(PORT)

    def __init__(self, num_sensors, sample_size):
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, tb):
        print('exits')

    def get_data(self):
        return [1, 2, 3]


@click.command()
@click.option('--destination', '-d', type=str, required=True)
@click.option('--mats', '-m', type=int, default=1)
@click.option('--mat-resolution', '-mr', type=int, default=5)
@click.option('--sample-size', '-n', type=int, default=10)
def cli(destination, mats, mat_resolution, sample_size):
    try:
        total_num_sensors = mats * mat_resolution
        with FSRSampler(num_sensors=total_num_sensors, sample_size=sample_size) as sampler:
            readings = sampler.get_data()

        with open(destination, 'w') as outfile:
            outfile.writelines('%s\n' % value for value in readings)
    except Exception as e:
        print(e)


if __name__ == '__main__':
    cli()
