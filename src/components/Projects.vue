<template>
  <div class="projects section">
    <a class="internal-link" id="projects"></a>
    <h1 class="section-title">Projects</h1>
    <ul class="project-list">
      <li v-for="(project, index) in projects" :key="index" :style="{backgroundImage: `url(${project.imageUrl})`}">
        <div class="project-info">
            <h4 class="project-title">{{project.title}}</h4>
            <div class="project-details">  
              <div class="project-description">{{project.description}}</div>
              <br/>
              <div class="project-technology"><strong>Technology:</strong> {{project.technology}}</div> 
              <br/>
              <a :href="project.url" target="_blank">
                <i class="fab fa-chrome"></i> Browse
              </a>
              <br/>
              <a v-if="project.githubUrl" :href="project.githubUrl" target="_blank">
                <i class="fab fa-github"></i> View code
              </a>
            </div>
          </div>   
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'Projects',
  data: () => ({
    projects: [
      {
        title: "Guided Verses",
        description: "An immersive Quran experience for web and mobile.",
        technology: "AngularJS, PWA",
        url: "https://app.guidedverses.com",
        imageUrl: '../../img/projects/gdvs.jpg'
      },
      {
        title: "Prayer Time",
        description: "A beautiful way to the know the prayer times in your city.",
        technology: "React, Typescript, PWA",
        url: "https://prayer-time.netlify.app",
        githubUrl: "https://www.github.com/tahins/prayer-time-ts",
        imageUrl: '../../img/projects/prayer-time.png'
      },
      {
        title: "Refactoring Color",
        description: "A scientific way to find the color palette for your next project.",
        technology: "Hyperapp",
        url: "https://refactoring-color.netlify.app",
        githubUrl: "https://www.github.com/tahins/refactoring-color",
        imageUrl: '../../img/projects/refactoring-color.jpg'
      },
      {
        title: "Readly",
        description: "Read awesomely.",
        technology: "Vue",
        url: "https://readly.netlify.app",
        githubUrl: "https://www.github.com/tahins/readly",
        imageUrl: '../../img/projects/refactoring-color.jpg'
      },
      {
        title: "Islam Porichiti",
        description: "An immersive Quran experience for web and mobile.",
        technology: "AngularJS",
        url: "https://www.islamporichiti.com",
        imageUrl: '../../img/projects/islam-porichiti.jpg'
      },
      {
        title: "Tahin Weds Opi",
        description: "Completing the half of our deen.",
        technology: "CSS3 animation",
        url: "#",
        imageUrl: '../../img/projects/wedding.jpg'
      },
      {
        title: "My Village",
        description: "A 360° experience of my home at Chitholia, Feni.",
        technology: "React VR",
        url: "https://www.islamporichiti.com",
        imageUrl: '../../img/projects/islam-porichiti.jpg'
      },
      {
        title: "angular-ganrad",
        description: "An immersive Quran experience for web and mobile.",
        technology: "AngularJS",
        url: "https://www.islamporichiti.com",
        imageUrl: '../../img/projects/islam-porichiti.jpg'
      },
      {
        title: "rongdhonu",
        description: "An immersive Quran experience for web and mobile.",
        technology: "LESS",
        url: "https://www.islamporichiti.com",
        imageUrl: '../../img/projects/islam-porichiti.jpg'
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
  margin-bottom: 5px;
  display: inline-block;
  text-decoration: none;
}

.project-list li {
  flex-basis: calc(100% - 20px);
  margin-bottom: 30px;
}

.project-list li {
  width: 100%;
    height: 100%;
    color: #000;
    outline: none;
    text-decoration: none;
    display: inline-block;
    background-size: contain;
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
    -webkit-filter: none;
    filter: none;
}

/* .project-list li:hover .project-info {
  opacity: 0;
} */

.project-info {
width: 50%;
    height: 300px;
    padding: 10px 20px;
    background: #fff;
    -webkit-transition-duration: .5s;
    transition-duration: .5s;
}

.project-title {
font-size: 150%;
}

.project-details {

}

.project-description {

}

.project-technology {

}

/* Small devices */
@media (min-width: 576px) { 
  .project-list li {
    flex-basis: calc(100% - 20px);
    margin-bottom: 30px;
  }  
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
