# Project Zeta software

## Initial setup for developers

1. Install vscode extensions

    I believe you don't have to install any of the recommended extensions, but you will most likely want to have the
    python extension. Everything else is just nice to have.

2. Install pre-commit and configure it using `.pre-commit-condig.yaml`

    **TLDR**

    ```shell
    cd <path_to_zeta_software_repository>
    pyenv install 3.8.12
    pip install pre-commit
    pre-commit install
    ```

    You have to choose what python version management tool to use, but **pyenv** is recommended.
    This instruction is going to assume you are using pyenv and pip.\
    Once you have pyenv, install python version **3.8.12** by `pyenv install 3.8.12`.\
    Then install **pre-commit** by `pip install pre-commit`, and configure it by `pre-commit install`.

## Commands

### Project setup, install npm packages based on package-lock.json

```shell
npm ci
```

### Compiles Vue without Electron and hot-reloads for development

```shell
npm run serve
```

### Customize Vue configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

## Contributors
