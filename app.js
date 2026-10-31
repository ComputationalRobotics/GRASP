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
function selectPage(index){const previous=activePage;activePage=index;backgrounds.forEach((bg,i)=>{bg.classList.toggle('previous',i===previous&&previous!==index);bg.classList.toggle('active',i===index);});pageButtons.forEach((button,i)=>{button.classList.toggle('active',i===index);button.setAttribute('aria-pressed',String(i===index));});document.querySelector('#hero-count').textContent=`0${index+1} / 04`;document.querySelector('#hero-category').textContent=pageNames[index];document.querySelector('#hero-speed').textContent=index<2?'2× speed':'';updateHeroVideo();}
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
    updateHeroVideo();syncCarousel();updateSectionNavigation();scrollQueued=false;
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
document.querySelectorAll('.policy-video-slot video').forEach(video=>videoObserver.observe(video));
const navLinks=[...document.querySelectorAll('.site-header nav a')];
const navSections=[...document.querySelectorAll('[data-nav-section]')];
function updateSectionNavigation(){
  const line=header.getBoundingClientRect().bottom+Math.min(200,innerHeight*.25);
  let current=hero.getBoundingClientRect().bottom>line?'overview':navSections[0].id;
  navSections.forEach(section=>{if(section.getBoundingClientRect().top<=line)current=section.id;});
  if(Math.ceil(scrollY+innerHeight)>=document.documentElement.scrollHeight-2)current=navSections[navSections.length-1].id;
  navLinks.forEach(link=>{const active=link.hash===`#${current}`;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
}
// Keep section links accurate after the asynchronously inserted galleries change page height.
new ResizeObserver(onScroll).observe(document.querySelector('main'));
// Simulation clips form 4 x 4 walls that link to the full visualizations; each clip goes to its hand's or robot's wall.
function addSimTile(clip){const tile=document.createElement('div');tile.className='sim-tile';const video=document.createElement('video');video.dataset.src=clip.src;video.poster=clip.poster;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='none';video.setAttribute('aria-hidden','true');video.setAttribute('disablepictureinpicture','');tile.append(video);if(clip.speed>1){const badge=document.createElement('span');badge.className='speed-badge';badge.textContent=`${clip.speed}×`;tile.append(badge);}tile.title=clip.title;document.querySelector(`#${clip.group}${clip.robot?`-${clip.robot}`:''}-gallery`).append(tile);videoObserver.observe(video);}
// Each tab list swaps the visible wall of its own section; the hidden walls leave the viewport observer, which pauses them.
document.querySelectorAll('.robot-tabs').forEach(list=>{const tabs=[...list.querySelectorAll('[role="tab"]')];const select=tab=>tabs.forEach(t=>{const on=t===tab;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!on;});tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(tab));tab.addEventListener('keydown',event=>{const step={ArrowRight:1,ArrowLeft:-1}[event.key];if(!step)return;const next=tabs[(i+step+tabs.length)%tabs.length];select(next);next.focus();});});});
// Bump the manifest version whenever media.json changes, so neither the CDN nor the browser serves a stale list.
fetch('media.json?v=5').then(response=>{if(!response.ok)throw new Error('Could not load media');return response.json();}).then(clips=>{clips.forEach(clip=>{if(clip.group.startsWith('sim-')){addSimTile(clip);return;}const figure=document.createElement('figure');figure.className='video-card';const shell=document.createElement('div');shell.className='video-shell';const video=document.createElement('video');video.dataset.src=clip.src;video.poster=clip.poster;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.controls=window.matchMedia('(pointer: coarse)').matches;video.preload='none';video.tabIndex=0;video.addEventListener('pointerenter',()=>{video.controls=true;});video.addEventListener('pointerleave',()=>{if(!window.matchMedia('(pointer: coarse)').matches&&document.activeElement!==video)video.controls=false;});video.addEventListener('focus',()=>{video.controls=true;});video.addEventListener('blur',()=>{if(!window.matchMedia('(pointer: coarse)').matches)video.controls=false;});video.setAttribute('aria-label',`${clip.title}, real-world demonstration at ${clip.speed===1?'original speed':clip.speed+' times speed'}`);video.setAttribute('disablepictureinpicture','');shell.append(video);if(clip.speed>1){const badge=document.createElement('span');badge.className='speed-badge';badge.textContent=`${clip.speed}×`;shell.append(badge);}figure.append(shell);document.querySelector(`#${clip.group}-gallery`).append(figure);videoObserver.observe(video);});}).catch(()=>{document.querySelector('#dex-gallery').innerHTML='<p>Video gallery unavailable. Please refresh to try again.</p>';});
if(paused)document.querySelectorAll('video').forEach(v=>v.pause());
revealElements.forEach(element=>{element.inert=true;});
updatePauseButton();onScroll();

// Independent result tabs: preserve all existing video and robot-tab behavior.
const resultTabs=[...document.querySelectorAll('.results-tabs [role="tab"]')];
function selectResult(tab){resultTabs.forEach(item=>{const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!selected;});}
resultTabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectResult(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%resultTabs.length;else if(event.key==='ArrowLeft')next=(index+resultTabs.length-1)%resultTabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=resultTabs.length-1;else return;event.preventDefault();selectResult(resultTabs[next]);resultTabs[next].focus();});});

const copyCitation=document.querySelector('#copy-citation');
copyCitation.addEventListener('click',async()=>{
  const status=document.querySelector('#citation-status');
  try{await navigator.clipboard.writeText(document.querySelector('#citation-text').textContent.trim());status.textContent='BibTeX copied.';}
  catch{status.textContent='Select the citation below and copy it.';document.querySelector('.citation-code').focus();}
});
