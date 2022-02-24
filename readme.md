# Project Zeta software

## Initial setup for developers

1. Install vscode extensions

    I believe you don't have to install any of the recommended extensions, but you will most likely want to have the
    python extension. Everything else is just nice to have.

2. Install pyenv

    For windows users
    1. [Install and enable Linux subsystem](https://ubuntu.com/wsl)
    2. Ensure you have the pyenv [dependencies installed](https://github.com/pyenv/pyenv/wiki#suggested-build-environment) on your Windows  Subsystem for Linux
    3. In your Linux terminal, execute `curl https://pyenv.run | bash`
    4. Add the following to your .bashrc

        ```bash
        export PATH="$HOME/.pyenv/bin:$PATH"
        eval "$(pyenv init --path)"
        eval "$(pyenv virtualenv-init -)"
        ```

    4. Restart your shell

    For mac users
    1. Ensure you have the pyenv [dependencies installed](https://github.com/pyenv/pyenv/wiki#suggested-build-environment)
    2. `brew install pyenv`
    3. Add the following to your .zshrc( or .bashrc)

        ```bash
        export PATH="$HOME/.pyenv/bin:$PATH"
        eval "$(pyenv init --path)"
        eval "$(pyenv virtualenv-init -)"
        ```

    3. Restart your shell or execute `source .zshrc`

3. Install poetry

    For windows users
    1. Install and enable Linux subsystem
    2. In your Linux terminal, execute `curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python`
    3. Add the following to your .bashrc

        ```bash
        export PATH="$HOME/.poetry/bin:$PATH"
        ```

    4. Restart your shell

    For mac users
    1. `brew install poetry`
    2. Done

4. Install pre-commit and configure it using `.pre-commit-condig.yaml`

    ### All together now

    ```bash
    cd <path_to_zeta_software_repository>
    pyenv install 3.8.12
    python -m venv .venv
    poetry install && poetry shell
    pre-commit install
    ```

    You have to choose what python version management tool and dependency management tool use, but **pyenv** and
    **poetry** are recommended. This instruction is going to assume you are using pyenv and poetry.\
    Once you have pyenv, install python version **3.8.12** by `pyenv install 3.8.12`.\
    Then create a python virtual environment by `python -m venv .venv`.
    Make sure your virtual environment is using python 3.8.12 and your file structure should look like the following.

    ```file structure
    .
    ├── .gitignore
    ├── .pre-commit-condig.yaml
    ├── .python-version
    ├── poetry.lock
    ├── pyproject.toml
    ├── readme.md
    ├── .venv <-------------------- You just created this.
    │   └── pyvenv.cfg <----------- Make sure this says "version = 3.8.12" somewhere.
    ├── .vscode
    ├── tests
    │   ├── __init__.py
    │   ├── __pycache__
    │   └── test_zeta.py
    └── zeta
        ├── __init__.py
        └── __pycache__
    ```

    After that we will use poetry to install python packages, using the command `poetry install && poetry shell`.
    Now if there are no errors, you should be in the python virtual environment that was created earlier.\
    Finally, install configure pre-commit by `pre-commit install`.

## Contributors

Roy Ataya, Aidan Cook, Hamza Kamal, Kirill Melnikov, Paige Rattenberry, and Aki Zhou
