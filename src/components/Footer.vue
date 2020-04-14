<template>
  <div class="footer">Copyright @tahins / {{currentFullYear}}</div>
</template>

<script>
export default {
  name: 'Footer',
  computed: {
    currentFullYear: function () {
      return new Date().getFullYear();
    }
  }
}
</script>

<style scoped>
.footer {
  text-align: center;
}
</style>
