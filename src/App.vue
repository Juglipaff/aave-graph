<template>
  <div id="app">
    <div id="nav">
      <router-link to="/">Gotchi prices</router-link>
      <router-link to="/closed-portals">Closed Portals</router-link>
      <router-link to="/opened-portals">Open Portals</router-link>
      <router-link to="/wearables">Wearables</router-link>
      <router-link to="/consumables">Consumables</router-link>
      <router-link to="/tickets">Tickets</router-link>
      <span id="priceGHST"> GHST price: <span id="price-display">{{currentPrice}}$ </span></span>
    </div>
    <vue-progress-bar></vue-progress-bar>
    <router-view :key="$route.fullPath"/>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState({
      currentPrice: 'CurrentGHSTprice'
    })
  }
}
</script>

<style>
*{  margin:0;}
.container{
  margin-top:110px;
}
#price-display{
  color: rgb(255, 255, 255);
}
#priceGHST{
  color: rgb(173, 218, 255);
position: absolute;
right:100px;
}
#app {
  height:100vh;
  background-color:rgb(255, 255, 255);
  overflow: hidden;
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
.container3{
 position: relative;
 top:calc(50% - 90px);
}
.MetamaskLogin{
  transition:0.15s;
  position:relative;
  width:180px;
  height:60px;
  top:-40px;
  color:white;
  font-size:17px;
  background-color:#0088cc;
  border-radius: 7px;
  border: 0px;
  outline:0;
}
.MetamaskLogin:active{
  background-color:#006fa7;
}
.links-wrapper{
  padding-top:30px;
  padding-bottom:30px;
  position:absolute;
 margin:0px;
  top:80px;
  height:calc(100vh - 140px);
  overflow-y:scroll;
   width:320px;
  right:0;
  color:white;

   background: rgb(41, 41, 41);
}
.links-wrapper::-webkit-scrollbar {
  width: 10px;
}

.links-wrapper::-webkit-scrollbar-track {
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
}

.links-wrapper::-webkit-scrollbar-thumb {
  background-color: darkgrey;

}
.externalLink{
  z-index:0;
  margin-top:6px;
  position: absolute;
  right:21px;
}
.link-text{
  margin-left:-60px;
}
.link{
  padding-top:10px;
  height:40px;
  display: inline-block;
  color:white;
  text-decoration: none;
  width:calc(100% - 88px);
  text-align:left;
  margin-left:88px;
  border-bottom: 1px dashed rgb(175, 175, 175);
  line-height: 2;
}
.links-wrapper a:visited{
  color:rgb(175, 175, 175);
}
.container2{
 position: relative;
 top:calc(50% - 120px);
}
.message{
   color:white;
  top:-20px;
  margin:40px;
  font-size:20px;
  position: relative;
}
.lock{
   color:white;
  position: relative;
  font-size:70px;
}
.placeholder{
  position:absolute;
  top:80px;
  right:0;
  height:calc(100vh - 80px);
  width:320px;
  background: rgb(41, 41, 41);
  box-shadow: 0 0px 32px 0 rgba( 31, 38, 135, 0.07 );
  border-radius: 0px;
}
</style>
