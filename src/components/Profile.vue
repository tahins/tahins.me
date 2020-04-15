<template>
  <div class="profile section">
    <a class="internal-link" id="profile"></a>
    <h1 class="section-title">Profile</h1>
<div class="profile-container">
    <div class="profile-image"></div>
    <div class="profile-summary">
      <div class="profile-name"><span class="faded-text">I am </span><strong>E. M. Yeaseenur Rahman Tahin</strong></div>
      <div class="profile-position">Staff Software Enginner at Infolytx, Bangladesh</div>
      <div class="profile-description faded-text">
        <p>
        Tahin completed his graduation on Computer Science and Engineering from BRAC University. He started his career as an Android Engineer. After that, switched to App Designing then Web Frontend Engineering and then Product Management. Currently he is working on cognitive agents, chatbots and Natural Language Processing.
        </p>
        <p>
        He has experience in architechting and developing complex frontend applications and building cognitive chatbots. He has successfully led technical teams working on varities of softwares. Tahin also loves designing UI and UX for internet products and led product teams before.
        </p>
        <p>
        He is super enthusiast about everything related to tech and web. He cares very much about user experience and performance. He believes his versatile experience enables him to see everything from an unique perspective.
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
