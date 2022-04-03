module.exports = {
  "env" : {"browser" : true, "commonjs" : true, "es2021" : true, "node" : true},
  "extends" : "plugin:vue/essential",
  "parserOptions" : {"ecmaVersion" : "2017"},
  "plugins" : [ "vue" ],
  "rules" : {},
  "globals" : {
    "__static" : 'readonly',
  },
}
