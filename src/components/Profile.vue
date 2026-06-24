<template>
  <div class="profile section">
    <a class="internal-link" id="profile"></a>
    <h1 class="section-title">Profile</h1>
<div class="profile-container">
    <div class="profile-image" role="img" aria-label="Photo of E. M. Yeaseenur Rahman Tahin"></div>
    <div class="profile-summary">
      <div class="profile-name"><span class="faded-text">I am </span><strong>E. M. Yeaseenur Rahman Tahin</strong></div>
      <div class="profile-position">Full-Stack Engineer & Engineering Manager <span class="faded-text">at 🥚 Chaldal PLC, Bangladesh</span></div>
      <div class="profile-description faded-text">
        <p>
          I began my career as an Android Engineer, then moved through App Design, Web Frontend,
          and Product Management before settling into full-stack engineering and engineering
          management. Along the way I've led teams, architected event-driven systems, and built
          production AI/GenAI platforms.
        </p>
        <p>
          Today I manage engineering delivery across seven platforms at Chaldal, spanning
          e-commerce, logistics, and food-tech. I built our order reconciliation system for
          ledger-grade accuracy, led our PCI-DSS compliance work with Bangladesh Bank, and now
          drive my team's adoption of AI agents for real operations.
        </p>
        <p>
          I'm a full-stack engineer who grew into engineering management, and I'm increasingly
          focused on using the latest AI capabilities to make software genuinely better for the
          people who use it — not AI for its own sake.
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
