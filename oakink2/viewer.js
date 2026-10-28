'use strict';
// OakInk2 visualizer: filterable, paginated wall of every successful GRASP trajectory.
const PAGE_SIZE=48;
const TOP_MOTIONS=14;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=id=>document.getElementById(id);
const grid=$('grid'),more=$('more'),empty=$('empty'),count=$('count'),motionList=$('motions'),search=$('search'),sort=$('sort');
const viewer=$('viewer'),viewerVideo=$('viewer-video');
let clips=[],topMotions=[],filtered=[],shown=0,current=-1;
const selected=new Set();
const fmt=n=>n.toLocaleString('en-US');
const media=(id,kind)=>`../media/oakink2/${kind==='poster'?'posters':'videos'}/${id}.${kind==='poster'?'jpg':'mp4'}`;
const motionKey=clip=>topMotions.includes(clip.motion)?clip.motion:'other';
const label=motion=>motion==='other'?'Other':motion[0].toUpperCase()+motion.slice(1);

// Clips only download and play while they are on screen.
const videoObserver=new IntersectionObserver(entries=>{entries.forEach(({target:video,isIntersecting})=>{
  if(isIntersecting){if(!video.src)video.src=video.dataset.src;if(!reduceMotion&&!document.hidden)video.play().catch(()=>{});}
  else video.pause();
});},{rootMargin:'150px 0px',threshold:.05});
const moreObserver=new IntersectionObserver(entries=>{if(entries[0].isIntersecting)renderPage();},{rootMargin:'400px 0px'});

function matchesQuery(clip){const q=search.value.trim().toLowerCase();return !q||clip.title.toLowerCase().includes(q)||clip.id.includes(q);}
function shuffle(){clips.forEach(clip=>{clip.rank=Math.random();});}
function sorted(list){
  const by={shuffle:(a,b)=>a.rank-b.rank,id:(a,b)=>a.id.localeCompare(b.id,'en',{numeric:true}),error:(a,b)=>a.error_cm-b.error_cm};
  return list.sort(by[sort.value]||by.shuffle);
}

function renderMotions(){
  const counts={};
  clips.filter(matchesQuery).forEach(clip=>{const key=motionKey(clip);counts[key]=(counts[key]||0)+1;});
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  motionList.replaceChildren(...[['all',total],...[...topMotions,'other'].map(m=>[m,counts[m]||0])].map(([motion,n])=>{
    const li=document.createElement('li');const box=document.createElement('input');box.type='checkbox';
    const isOn=motion==='all'?selected.size===0:selected.has(motion);box.checked=isOn;li.classList.toggle('selected',isOn);
    const name=document.createElement('span');name.textContent=motion==='all'?'All':label(motion);
    const num=document.createElement('span');num.className='count';num.textContent=fmt(n);
    li.append(box,name,num);
    li.addEventListener('click',()=>{if(motion==='all')selected.clear();else if(!selected.delete(motion))selected.add(motion);update();});
    return li;
  }));
}

function card(clip,index){
  const figure=document.createElement('figure');figure.className='card';
  const tile=document.createElement('button');tile.type='button';tile.className='tile';tile.setAttribute('aria-label',`Open ${clip.title}, ${clip.id}`);
  const video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='none';
  video.poster=media(clip.id,'poster');video.dataset.src=media(clip.id,'video');video.setAttribute('aria-hidden','true');video.setAttribute('disablepictureinpicture','');
  tile.append(video);
  if(clip.speed>1){const badge=document.createElement('span');badge.className='speed-badge';badge.textContent=`${clip.speed}×`;tile.append(badge);}
  tile.addEventListener('click',()=>openViewer(index));
  const caption=document.createElement('figcaption');
  const name=document.createElement('span');name.className='name';name.textContent=clip.title;
  const id=document.createElement('span');id.className='id';id.textContent=clip.id;name.append(id);
  const error=document.createElement('span');error.className='error';error.textContent=`${clip.error_cm.toFixed(1)} cm · ${clip.error_rad.toFixed(2)} rad`;
  caption.append(name,error);figure.append(tile,caption);
  videoObserver.observe(video);
  return figure;
}

function renderPage(){
  if(shown>=filtered.length)return;
  const end=Math.min(shown+PAGE_SIZE,filtered.length);
  grid.append(...filtered.slice(shown,end).map((clip,i)=>card(clip,shown+i)));
  shown=end;
  const left=filtered.length-shown;
  more.hidden=left===0;more.textContent=`Show ${fmt(Math.min(left,PAGE_SIZE))} more · ${fmt(left)} left`;
  // Re-observing reports the button's current position, so a tall screen keeps filling.
  moreObserver.unobserve(more);moreObserver.observe(more);
}

function update(){
  filtered=sorted(clips.filter(clip=>matchesQuery(clip)&&(selected.size===0||selected.has(motionKey(clip)))));
  videoObserver.disconnect();
  grid.querySelectorAll('video').forEach(video=>{video.pause();video.removeAttribute('src');video.load();});
  grid.replaceChildren();shown=0;
  empty.hidden=filtered.length>0;count.textContent=`${fmt(filtered.length)} of ${fmt(clips.length)} trajectories`;
  renderMotions();renderPage();
  const params=new URLSearchParams();
  if(selected.size)params.set('motion',[...selected].join(','));
  if(search.value.trim())params.set('q',search.value.trim());
  if(sort.value!=='shuffle')params.set('sort',sort.value);
  const query=params.toString();
  history.replaceState(null,'',query?`?${query}`:location.pathname);
}

function openViewer(index){
  current=(index+filtered.length)%filtered.length;
  const clip=filtered[current];
  viewerVideo.poster=media(clip.id,'poster');viewerVideo.src=media(clip.id,'video');
  if(!reduceMotion)viewerVideo.play().catch(()=>{});
  $('viewer-title').textContent=clip.title;
  $('viewer-meta').textContent=`${clip.id} · ${clip.seconds.toFixed(1)} s clip, ${clip.speed>1?`${clip.speed}× speed`:'real time'} · object error ${clip.error_cm.toFixed(1)} cm · ${clip.error_rad.toFixed(2)} rad`;
  if(!viewer.open)viewer.showModal();
}
// Unload the clip as soon as the dialog closes; the close event also covers the Escape key.
function closeViewer(){if(viewer.open)viewer.close();viewerVideo.pause();viewerVideo.removeAttribute('src');viewerVideo.load();}
viewer.addEventListener('close',closeViewer);
viewer.addEventListener('click',event=>{if(event.target===viewer)closeViewer();});
viewer.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')openViewer(current-1);if(event.key==='ArrowRight')openViewer(current+1);});
$('viewer-prev').addEventListener('click',()=>openViewer(current-1));
$('viewer-next').addEventListener('click',()=>openViewer(current+1));
$('viewer-close').addEventListener('click',closeViewer);

let searchTimer=null;
search.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(update,150);});
sort.addEventListener('change',update);
$('shuffle').addEventListener('click',()=>{shuffle();sort.value='shuffle';update();});
more.addEventListener('click',renderPage);
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());});

// Versioned like media.json on the main page: bump it whenever clips.json is rebuilt.
fetch('clips.json?v=1').then(response=>{if(!response.ok)throw new Error('Could not load clips');return response.json();}).then(data=>{
  clips=data;shuffle();
  const counts={};clips.forEach(clip=>{counts[clip.motion]=(counts[clip.motion]||0)+1;});
  topMotions=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,TOP_MOTIONS).map(([motion])=>motion);
  const params=new URLSearchParams(location.search);
  (params.get('motion')||'').split(',').filter(m=>m==='other'||topMotions.includes(m)).forEach(m=>selected.add(m));
  search.value=params.get('q')||'';
  if(['id','error'].includes(params.get('sort')))sort.value=params.get('sort');
  update();
}).catch(()=>{empty.hidden=false;empty.textContent='The trajectory list could not be loaded. Please refresh to try again.';});
