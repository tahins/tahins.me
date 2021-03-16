<template>
  <div class="profile section">
    <a class="internal-link" id="profile"></a>
    <h1 class="section-title">Profile</h1>
<div class="profile-container">
    <div class="profile-image"></div>
    <div class="profile-summary">
      <div class="profile-name"><span class="faded-text">I am </span><strong>E. M. Yeaseenur Rahman Tahin</strong></div>
      <div class="profile-position">Software Enginner <span class="faded-text">at 🥚 Chaldal Limited, Bangladesh</span></div>
      <div class="profile-description faded-text">
        <p>
          I begun my career as an Android Engineer. After that, I switched to App Designing 
          then Web Frontend Development and after that Product Management. Currently, I am 
          working with cognitive agents, chatbots and Natural Language Processing.
        </p>
        <p>
        I have experience in architecting and developing complex frontend applications and 
        building cognitive chatbots. I have successfully led several technical and product 
        teams working on varieties of software. I also love designing UI and UX for internet products. 
        </p>
        <p>
        I am super enthusiast about everything related to tech and web. I care very much about 
        user experience and performance. I believe, my diverse experience enables me to see things 
        from an unique perspective.
        </p>
      </div>
    </div>
</div>
  </div>
</template>

<script>
export default {
  name: 'Profile'
}
</script>

<style scoped>
.profile {}
.profile .profile-container {
  display: flex;
  flex-direction: row;
}
.profile .profile-image {
  margin: 40px;
  flex-basis: 50%;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  background-image: url('../../public/img/me.png');
}
.profile .profile-summary {
  flex-basis: 50%;
}
.profile .profile-name {
  font-size: 2rem;
}
.profile .profile-position {
  margin: 20px 0;
  font-size: 1.5rem;
}
.profile .profile-description {
  line-height: 1.75;
  font-size: 1.25rem;
}

/* Medium devices */
@media (max-width: 768px) { 
  .profile .profile-image {
    height: 250px;
    margin-right: 0;
    flex-basis: auto;
    margin-bottom: 40px;
  }

  .profile .profile-container {
    flex-direction: column;
  } 
}
</style>
