<template>
  <div class="hello">
      <div class="quote">
        <a href="#" class="silent-link">
          speak a good word or remain silent.
        </a>
      </div>
      <div class="summary">
        <div class="position">Frontend Engineer - Product Manager</div>
        <div class="description">
          <span class="love">❤</span> to code in Javascript.
          <br/>
          Passionate about Webapp Performance, Optimization, UI and UX.
          <br/>
          Give life to beautiful designs.
        </div>
        <div class="separator">Spiderman ;)</div>
      </div>
    </div>
</template>

<script>
export default {
  name: 'Hello'
}
</script>

<style scoped>
.hello {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.quote {
  font-size: 1.25rem;
  position: relative;
  margin: 10vw 0;
  text-transform: uppercase;
}

.quote:before {
  top: -30px;
  font-size: 57px;
  content: '\201C';
  position: absolute;
  font-family: cursive;
}

.quote:after {
    content: '\201D';
    font-family: cursive;
}

.double-quote-sign:first-child {
  font-size: 40px;
}

.silent-link {
  margin-left: 30px;
  color: inherit;
  text-decoration: inherit;
}

.summary {
  width: 100%;
  max-width: 50%;
  text-align: right;
  padding-left: 20px;
}

.summary .position {
  font-size: 1.25rem;
}

.summary .description {
  margin: 30px 0 20px 0;
  font-size: 2.25rem;
}

.love { color: tomato; }

</style>
