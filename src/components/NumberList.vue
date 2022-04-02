<template>
    <div class="ListClass">
        <div v-for="item in FullNameList" :key="item"> {{ item }} </div>
    </div>
</template>

<script>
export default {
  name: "NumberList",

  props: {
    msg: String,
  },

    data() {
        return {
            listValuesTemp : [
            "Wow",
            "LOL",
            "awesome",
            "great" ],
            UserList : [
                {firstName: "John", lastName: "Walker"},
                {firstName: "Blake", lastName: "Breaker"}
            ]
        }
    },

    computed: {
        ListValues() {
            return this.listValuesTemp.map(value => {
                return value + "123"
            })
        },

        FullNameList() {
            return this.UserList.map(user => {
                return user.firstName + " " + user.lastName
            })
        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

.ListClass {
    margin-top: 15px;
}
</style>
