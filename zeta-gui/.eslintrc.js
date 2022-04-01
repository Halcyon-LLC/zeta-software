module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true,
        "node": true
    },
    "extends": "plugin:vue/essential",
    "parserOptions": {
        "ecmaVersion": "2015"
    },
    "plugins": [
        "vue"
    ],
    "rules": {
    },
    "globals": {
        "__static": 'readonly',
    },
}
