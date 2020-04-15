<template>
  <div class="projects section">
    <a class="internal-link" id="projects"></a>
    <h1 class="section-title">Projects</h1>
    <ul class="project-list">
      <li v-for="(project, index) in projects" :key="index" :style="{
        backgroundImage: `url(${project.imageUrl})`,
        backgroundSize: project.bgSize
      }">
        <div class="project-bg"></div>  
        <div class="project-info">
            <h4 class="project-title">{{project.title}}</h4>
            <div class="project-details">  
              <div class="project-description">{{project.description}}</div>
              <br/>
              <div class="project-technology"><strong>Built with:</strong> {{project.technology}}</div> 
              <br/>
              <a v-if="project.url" :href="project.url" target="_blank">
                <strong><i class="fab fa-chrome"></i> Browse</strong>
              </a>
              <br/>
              <a v-if="project.githubUrl" :href="project.githubUrl" target="_blank">
                <strong><i class="fab fa-github"></i> View code</strong>                
              </a>
            </div>
          </div>   
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "Projects",
  data: () => ({
    projects: [
      {
        title: "Guided Verses",
        description: "An immersive Quran experience for web and mobile.",
        technology: "AngularJS, PWA",
        url: "https://app.guidedverses.com",
        imageUrl: "../../img/projects/gdvs.png",
        bgSize: "200px"
      },
      {
        title: "Prayer Time",
        description: "A beautiful way to the know the prayer times in your city.",
        technology: "React, Typescript, PWA",
        url: "https://prayer-time.netlify.app",
        githubUrl: "https://www.github.com/tahins/prayer-time-ts",
        imageUrl: "../../img/projects/prayer-time.png",
        bgSize: "200px"
      },
      {
        title: "Refactoring Color",
        description: "A scientific way to generate the color palette for your next project.",
        technology: "Hyperapp",
        url: "https://refactoring-color.netlify.app",
        githubUrl: "https://www.github.com/tahins/refactoring-color",
        imageUrl: "../../img/projects/refactoring-color.jpg",
        bgSize: "cover"
      },
      {
        title: "Readly",
        description: "Read the breaking news, awesomely.",
        technology: "Vue",
        url: "https://readly.netlify.app",
        githubUrl: "https://www.github.com/tahins/readly",
        imageUrl: "../../img/projects/readly.jpg",
        bgSize: "cover"
      },
      {
        title: "Islam Porichiti",
        description: "A video based Islamic QA website.",
        technology: "AngularJS",
        url: "http://www.islamporichiti.com",
        imageUrl: "../../img/projects/islam-porichiti.png",
        bgSize: "200px"
      },
      {
        title: "Tahin Weds Opi",
        description: "Completing the half of our deen.",
        technology: "CSS3 animation",
        url: "https://tahins-wedding.netlify.com",
        githubUrl: "https://www.github.com/tahins/wedding",
        imageUrl: "../../img/projects/wedding.jpg",
        bgSize: "cover"
      },
      {
        title: "My Village",
        description: "A 360° experience of my home at Chitholia, Feni.",
        technology: "React VR",
        url: "https://chitholia.netlify.com",
        githubUrl: "https://www.github.com/tahins/village",
        imageUrl: "../../img/projects/village.jpg",
        bgSize: "cover"
      },
      {
        title: "আবহাওয়া",
        description: "A simple and minimal weather app.",
        technology: "LESS",
        url: "https://abohawa.netlify.com",
        githubUrl: "https://www.github.com/tahins/abohawa",
        imageUrl: "../../img/projects/abohawa.png",
        bgSize: "200px"
      },
      {
        title: "angular-gnrad",
        description: "Easily integrate G&R ads in your AngularJS applications.",
        technology: "AngularJS",
        url: "https://www.npmjs.com/package/angular-gnrad",
        githubUrl: "https://www.github.com/tahins/angular-gnrad",
        imageUrl: "../../img/projects/angular-gnrad.jpg",
        bgSize: "cover"
      },
      {
        title: "Dark Knight",
        description: "Because, he is Batman.",
        technology: "AngularJS",
        url: "https://the-dark-knight.netlify.com",
        githubUrl: "https://www.github.com/tahins/dark-knight",
        imageUrl: "../../img/projects/dark-knight.jpg",
        bgSize: "cover"
      },
      {
        title: "Man Goes Mobile Website",
        description: "The legendary company website for Man Goes Mobile.",
        technology: "AngularJS",
        url: "https://mangoesmobile.netlify.com",
        githubUrl: "https://www.github.com/tahins/mangoesmobile",
        imageUrl: "../../img/projects/mangoesmobile.jpg",
        bgSize: "cover"
      },
      {
        title: "rongdhonu",
        description: "A Twitter Bootstrap fork with G&R Brand Guideline.",
        technology: "LESS",
        githubUrl: "https://www.github.com/tahins/rongdhonu",
        imageUrl: "../../img/projects/rongdhonu.jpg",
        bgSize: "cover" 
      },
      {
        title: "G&R Loader",
        description: "A loading animation with G&R Logo.",
        technology: "CSS3 animaiton",
        url: "http://codepen.io/tahins/full/lzdmc",
        imageUrl: "../../img/projects/gandr-loading.jpg"
      }
    ]
  })
}
</script>

<style scoped>
.project-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
      list-style: none;
    margin: 0;
    padding: 0;

}

.project-list li a {
  color: inherit;
  margin-bottom: 10px;
  display: inline-block;
  /* text-decoration: none; */
}

.project-list li {
  flex-basis: 100%;
  margin-bottom: 30px;
}

.project-list li {
  width: 100%;
    height: 100%;
    color: #000;
    outline: none;
    text-decoration: none;
    display: inline-block;
    /* background-size: contain; */
    background-position: 50%;
    background-color: #f8f8f8;
    background-repeat: no-repeat;
    -webkit-transition-duration: .5s;
    transition-duration: .5s;
    -webkit-filter: grayscale(100%);
    filter: gray;
}

.project-list li:hover {
  text-decoration: none;
    filter: none;
}

.project-list li:hover .project-info {
  opacity: 0.8;
}

.project-info {
width: 50%;
    height: 300px;
    padding: 10px 20px;
    background: #fff;
    -webkit-transition-duration: .5s;
    transition-duration: .5s;
}

.project-title {
  margin: 10px 0 20px 0;
font-size: 150%;
}

/* Medium devices */
@media (min-width: 768px) { 
  .project-list li {
    flex-basis: calc(50% - 20px);
    margin-bottom: 30px;
  }  
}

/* Large devices */
@media (min-width: 1080px) { 
  .project-list li {
    flex-basis: calc(33.33% - 20px);
    margin-bottom: 30px;
  }  
}

/* Extra large devices */
@media (min-width: 1400px) { 
  .project-list li {
    flex-basis: calc(25% - 20px);
    margin-bottom: 30px;
  }  
}
</style>
