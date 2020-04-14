<template>
  <div class="navbar">
      <div class="left">
        <a href="/" class="brand">@tahins</a>
      </div>
      <div class="right">
        <ul class="nav-links">
          <li v-for="(navLink, index) in navLinks" :key="index">
            <a :href="navLink.url">{{navLink.text}}</a>
          </li>
        </ul>
      </div>
    </div>
</template>

<script>
export default {
  name: 'Navbar',
  data: () => ({
    navLinks: [
      {
        text: "projects",
        url: "#projects"
      }, {
        text: "profile",
        url: "#profile"
      }, {
        text: "contact",
        url: "#contact"
      }, {
        text: "blog",
        url: "https://www.medium.com/@tahins"
      }
    ]
  })
}
</script>

<style scoped>
.navbar {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

  .navbar .brand,
  .navbar .nav-links a {
    color: #fff;
    cursor: pointer;
    padding-right: 5px;
    padding-bottom: 4px;
    text-decoration: none;
  }

  .navbar .brand,
  .navbar .nav-links a:hover {
    border-bottom: 4px solid #fff;
  }

  .navbar .nav-links {
    margin: 0;
    padding: 0;
    float: right;
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    flex-direction: row;
    justify-content: flex-end;
    text-transform: uppercase;
  }

  .navbar .nav-links li {
    padding: 0 0 20px 60px;
  }

</style>
