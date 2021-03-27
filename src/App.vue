<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Gotchi prices</router-link>
      <router-link to="/closed-portals">Closed Portals</router-link>
      <router-link to="/opened-portals">Open Portals</router-link>
      <router-link to="/wearables">Wearables</router-link>
      <router-link to="/consumables">Consumables</router-link>
      <router-link to="/tickets">Tickets</router-link>
    </div>
    <vue-progress-bar></vue-progress-bar>
    <router-view :key="$route.fullPath"/>
  </div>
</template>

<style>
*{  margin:0;}
.container{
  margin-top:110px;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  z-index:999;
  position:fixed;
  text-align: left;
  background-color:#0088cc;
  padding: 30px;
  padding-left: 57px;
  top:0px;
  width:100%;
}

#nav > * {
margin-right:25px
}

#nav a {
font-size:17px;
  color: white;
  text-decoration: none;
}

#nav a.router-link-exact-active {
  padding-bottom:7px;
border-bottom: 1px solid white

}
#chart{
  width:98%
}
</style>
