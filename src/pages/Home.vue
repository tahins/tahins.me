<template>
  <div class="home">
    <div class="above-fold">  
      <Navbar />
      <Hello /> 
    </div>
    <Projects />
    <Profile />    
    <Contacts />    
    <Footer />    
  </div>
</template>

<script>
import Navbar from "../components/Navbar";
import Hello from "../components/Hello";
import Projects from "../components/Projects";
import Profile from "../components/Profile";
import Contacts from "../components/Contacts";
import Footer from "../components/Footer";

export default {
  name: 'Home',
  components: {
    Navbar,
    Hello,
    Projects,
    Profile,
    Contacts,
    Footer
  }
}
</script>

<style scoped>
.home {
  padding: 60px 70px;
}
.above-fold {
  display: flex;
  padding-bottom: 50px;
  flex-direction: column;
  width: calc(100vw - 140px);
  height: calc(100vh - 60px);
}

</style>
