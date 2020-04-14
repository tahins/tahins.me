<template>
  <div class="contacts">
    <a class="internal-link" id="contact"></a>
    <ul class="contact-items">
      <li v-for="(contact, index) in contacts" :key="index" :title="contact.text">
          <a :href="contact.url" target="_blank">
            <i :class="contact.iconClassName"></i>
          </a>
        </li>
    </ul>
    
  </div>
</template>

<script>
export default {
  name: 'Contacts',
  data: () => ({
    contacts: [
      {
        text: "Email",
        iconClassName: "fas fa-envelope-square 7x",
        url: "mailto:tahin.36@gmail.com"
      },
      {
        text: "Medium",
        iconClassName: "fab fa-medium",
        url: "https://www.medium.com/@tahins"
      },
      {
        text: "Linkedin",
        iconClassName: "fab fa-linkedin",
        url: "https://www.linkedin.com/in/tahins"
      },
      {
        text: "Twitter",
        iconClassName: "fab fa-twitter-square",
        url: "https://www.twitter.com/tahins"
      },
      {
        text: "Instagram",
        iconClassName: "fab fa-instagram-square",
        url: "https://www.instagram.com/tahins"
      },
      {
        text: "Facebook",
        iconClassName: "fab fa-facebook-square",
        url: "https://www.facebook.com/tahins"
      }
    ]
  })
}
</script>

<style scoped>
.contacts {
padding: 150px 0;
}
.contact-items {
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  justify-content: center;
}
.contact-items li a {
  margin: 10px 20px;
  color: white;
  font-size: 8rem;
  display: inline-block;
}
</style>
