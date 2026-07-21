<template>
  <div class="profile section">
    <a class="internal-link" id="profile"></a>
    <h1 class="section-title">Profile</h1>
<div class="profile-container">
    <div class="profile-image"></div>
    <div class="profile-summary">
      <div class="profile-name"><span class="faded-text">I am </span><strong>E. M. Yeaseenur Rahman Tahin</strong></div>
      <div class="profile-position">Staff Software Engineer <span class="faded-text">at 🥚 Chaldal PLC, Dhaka, Bangladesh</span></div>
      <div class="profile-description faded-text">
        <p>
          Engineering leader with 13+ years building high-performing teams and delivering
          complex, mission-critical platforms — from early product work to leading delivery
          across multi-platform organizations.
        </p>
        <p>
          At Chaldal, I oversee technical delivery across seven business-critical platforms.
          My recent work sits where reliability meets regulation: ledger-grade order
          reconciliation, PCI-DSS and PSP compliance with Bangladesh Bank, event-driven
          systems at scale, and GenAI tools that ship in production.
        </p>
        <p>
          I believe correctness, traceability, and reliability must be engineered — not assumed.
          I lead organizations, but I stay hands-on on architecture, security, and the hard
          problems that don't fit on a slide.
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
  background-image: url('../../public/img/me.webp');
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
