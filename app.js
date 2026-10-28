'use strict';
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduceMotion.matches;
let activePage=0;
const hero=document.querySelector('.hero-scroll');
const backgrounds=[...document.querySelectorAll('[data-background]')];
const pageButtons=[...document.querySelectorAll('[data-page]')];
const pageNames=['Real dex','Real humanoid','Sim dex','Sim humanoid'];
const pauseButton=document.querySelector('#pause-videos');
const visibleVideos=new Set();
const header=document.querySelector('.site-header');
const revealElements=[header,document.querySelector('.hero-copy'),document.querySelector('.hero-category')];
const carouselDelay=7000;
let carouselTimer=null;
function heroVisible(){const rect=hero.getBoundingClientRect();return rect.bottom>0&&rect.top<innerHeight;}
function syncCarousel(reset=false){
  if(reset||paused||document.hidden||!heroVisible()){
    clearTimeout(carouselTimer);carouselTimer=null;
  }
  if(carouselTimer===null&&!paused&&!document.hidden&&heroVisible()){
    carouselTimer=setTimeout(()=>{carouselTimer=null;selectPage((activePage+1)%backgrounds.length);syncCarousel();},carouselDelay);
  }
}
function loadVideo(video){if(video.dataset.src&&!video.src){video.src=video.dataset.src;video.load();}}
function play(video){loadVideo(video);video.muted=true;if(!paused){const promise=video.play();if(promise)promise.catch(()=>{});}}
function updatePauseButton(){pauseButton.innerHTML=paused?'<span aria-hidden="true">▶</span> Play videos':'<span aria-hidden="true">Ⅱ</span> Pause videos';pauseButton.setAttribute('aria-pressed',String(paused));}
function updateHeroVideo(){backgrounds.forEach((bg,i)=>{const video=bg.querySelector('video');if(!video)return;if(i===activePage&&hero.getBoundingClientRect().bottom>0&&!paused&&!document.hidden)play(video);else video.pause();});}
function selectPage(index){const previous=activePage;activePage=index;document.querySelectorAll('.site-header nav a').forEach((a,i)=>{a.classList.toggle('active',i===index);if(i===index)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});backgrounds.forEach((bg,i)=>{bg.classList.toggle('previous',i===previous&&previous!==index);bg.classList.toggle('active',i===index);});pageButtons.forEach((button,i)=>{button.classList.toggle('active',i===index);button.setAttribute('aria-pressed',String(i===index));});document.querySelector('#hero-count').textContent=`0${index+1} / 04`;document.querySelector('#hero-category').textContent=pageNames[index];document.querySelector('#hero-speed').textContent=index<2?'2× speed':'';updateHeroVideo();}
let scrollQueued=false;
function onScroll(){
  if(scrollQueued)return;
  scrollQueued=true;
  requestAnimationFrame(()=>{
    const rect=hero.getBoundingClientRect();
    const progress=Math.min(1,Math.max(0,-rect.top/(innerHeight*.55)));
    document.documentElement.style.setProperty('--hero-reveal',progress);
    document.body.classList.toggle('is-introduced',progress>0);
    document.querySelector('#scroll-label').textContent=progress<1?'Scroll to reveal':'Scroll to explore';
    revealElements.forEach(element=>{element.inert=progress===0;});
    header.classList.toggle('is-light',rect.bottom<90);
    updateHeroVideo();syncCarousel();scrollQueued=false;
  });
}
window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);
pageButtons.forEach(button=>button.addEventListener('click',()=>{
  selectPage(Number(button.dataset.page));syncCarousel(true);
}));
pauseButton.addEventListener('click',()=>{
  paused=!paused;updatePauseButton();
  if(paused)document.querySelectorAll('video').forEach(v=>v.pause());
  else{updateHeroVideo();visibleVideos.forEach(play);}
  syncCarousel();
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());
  else if(!paused){updateHeroVideo();visibleVideos.forEach(play);}
  syncCarousel();
});
const videoObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{const video=entry.target;if(entry.isIntersecting){visibleVideos.add(video);play(video);}else{visibleVideos.delete(video);video.pause();}});},{rootMargin:'100px 0px',threshold:.05});
const navLinks=[...document.querySelectorAll('.site-header nav a')];
const sectionObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)navLinks.forEach(a=>{const active=a.hash===`#${entry.target.id}`;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});});},{rootMargin:'-10% 0px -65% 0px'});
document.querySelectorAll('.demo-section').forEach(section=>sectionObserver.observe(section));
// Simulation clips form a 4 x 4 wall that links to the full OakInk2 visualization.
function addSimTile(clip){const tile=document.createElement('div');tile.className='sim-tile';const video=document.createElement('video');video.dataset.src=clip.src;video.poster=clip.poster;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='none';video.setAttribute('aria-hidden','true');video.setAttribute('disablepictureinpicture','');tile.append(video);if(clip.speed>1){const badge=document.createElement('span');badge.className='speed-badge';badge.textContent=`${clip.speed}×`;tile.append(badge);}tile.title=clip.title;document.querySelector(`#${clip.group}-gallery`).append(tile);videoObserver.observe(video);}
fetch('media.json').then(response=>{if(!response.ok)throw new Error('Could not load media');return response.json();}).then(clips=>{const counters={dex:0,humanoid:0};clips.forEach(clip=>{if(clip.group==='sim-dex'){addSimTile(clip);return;}const number=++counters[clip.group];const figure=document.createElement('figure');figure.className='video-card';const shell=document.createElement('div');shell.className='video-shell';const video=document.createElement('video');video.dataset.src=clip.src;video.poster=clip.poster;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.controls=window.matchMedia('(pointer: coarse)').matches;video.preload='none';video.tabIndex=0;video.addEventListener('pointerenter',()=>{video.controls=true;});video.addEventListener('pointerleave',()=>{if(!window.matchMedia('(pointer: coarse)').matches&&document.activeElement!==video)video.controls=false;});video.addEventListener('focus',()=>{video.controls=true;});video.addEventListener('blur',()=>{if(!window.matchMedia('(pointer: coarse)').matches)video.controls=false;});video.setAttribute('aria-label',`${clip.title}, real-world demonstration at two times speed`);video.setAttribute('disablepictureinpicture','');const badge=document.createElement('span');badge.className='speed-badge';badge.textContent='2×';shell.append(video,badge);const caption=document.createElement('figcaption');const title=document.createElement('span');title.textContent=clip.title;const count=document.createElement('span');count.className='clip-number';count.textContent=String(number).padStart(2,'0');caption.append(title,count);figure.append(shell,caption);document.querySelector(`#${clip.group}-gallery`).append(figure);videoObserver.observe(video);});}).catch(()=>{document.querySelector('#dex-gallery').innerHTML='<p>Video gallery unavailable. Please refresh to try again.</p>';});
if(paused)document.querySelectorAll('video').forEach(v=>v.pause());
revealElements.forEach(element=>{element.inert=true;});
updatePauseButton();onScroll();
