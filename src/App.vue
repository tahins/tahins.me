<template>
  <div id="app">
    <Home/>
  </div>
</template>

<script>
import Home from './pages/Home';

export default {
  name: 'App',
  components: {
    Home
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri&display=swap');

:root {
  --padding-horizontal: 70px;
  --padding-vertical: 60px;
  --padding-mobile: 20px;
}

* {
  box-sizing: border-box;
}

body, html {
  margin: 0;
  padding: 0;
  color: #fff;
  font-size: 14px;
  background-color: #000;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  font-family: Consolas,Menlo,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New,monospace,'Hind Siliguri',serif;
}

.faded-text {
  color: #a6a6a6;
}

.section-title {
  margin: 50px 0;
  padding-right: 10px;
  padding-bottom: 5px;
  display: inline-block;
  border-bottom: 5px solid #fff;
}

.separator {
    color: #000;
    font-size: 14px;
    display: inline-block;
    border-bottom: 4px solid #fff;
}

.internal-link {
    display: block;
}

/* Small devices */
@media (max-width: 576px) { 
  /* .quote {
    font-size: 1rem !important;
  }

  .summary .position {
    font-size: 1rem !important;
  }

  .summary .description {
    font-size: 1.3rem !important;
  } */
}

/* Medium devices */
@media (max-width: 768px) { 
  .home {
    padding: 20px !important;
  }  
  .above-fold {
    width: calc(100vw - 40px) !important;
    height: 100vh !important;
  } 

   .hello {
    flex-direction: column !important;
  } 
  .summary {
    max-width: 100% !important;
  } 
}
</style>
