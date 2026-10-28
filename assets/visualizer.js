'use strict';
// Dataset visualizer shared by oakink2/ and humanoid/. Each page's clips.json supplies the media folder,
// the filter facets, and per-clip text, so the pages differ only in their HTML copy.
const PAGE_SIZE=48;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=id=>document.getElementById(id);
const grid=$('grid'),more=$('more'),empty=$('empty'),count=$('count'),facetBox=$('facets'),search=$('search'),sort=$('sort');
const viewer=$('viewer'),viewerVideo=$('viewer-video');
let data={media:'',facets:[]},clips=[],filtered=[],shown=0,current=-1;
const selected={},named={},hasOther={};
const fmt=n=>n.toLocaleString('en-US');
const media=(clip,kind)=>`${data.media}${kind==='poster'?'posters':'videos'}/${clip.id}.${kind==='poster'?'jpg':'mp4'}`;
// Values beyond a facet's `top` most common share one "Other" entry.
const facetValue=(clip,facet)=>named[facet.key].includes(clip.facets[facet.key])?clip.facets[facet.key]:'Other';

// Clips only download and play while they are on screen.
const videoObserver=new IntersectionObserver(entries=>{entries.forEach(({target:video,isIntersecting})=>{
  if(isIntersecting){if(!video.src)video.src=video.dataset.src;if(!reduceMotion&&!document.hidden)video.play().catch(()=>{});}
  else video.pause();
});},{rootMargin:'150px 0px',threshold:.05});
const moreObserver=new IntersectionObserver(entries=>{if(entries[0].isIntersecting)renderPage();},{rootMargin:'400px 0px'});

function matchesQuery(clip){const q=search.value.trim().toLowerCase();return !q||[clip.title,clip.id,clip.subtitle||''].some(s=>s.toLowerCase().includes(q));}
// `skip` leaves one facet out, so each facet's counts reflect the other facets' selections.
function matches(clip,skip){return matchesQuery(clip)&&data.facets.every(f=>f.key===skip||selected[f.key].size===0||selected[f.key].has(facetValue(clip,f)));}
function shuffle(){clips.forEach(clip=>{clip.rank=Math.random();});}
function sorted(list){
  const by={shuffle:(a,b)=>a.rank-b.rank,id:(a,b)=>a.id.localeCompare(b.id,'en',{numeric:true}),error:(a,b)=>(a.error??Infinity)-(b.error??Infinity)};
  return list.sort(by[sort.value]||by.shuffle);
}

function renderFacets(){
  facetBox.replaceChildren(...data.facets.map(facet=>{
    const counts={};
    clips.filter(clip=>matches(clip,facet.key)).forEach(clip=>{const v=facetValue(clip,facet);counts[v]=(counts[v]||0)+1;});
    const total=Object.values(counts).reduce((a,b)=>a+b,0);
    const values=[...named[facet.key],...(hasOther[facet.key]?['Other']:[])];
    const list=document.createElement('ul');list.className='filter-list';
    list.append(...[['All',total],...values.map(v=>[v,counts[v]||0])].map(([value,n],i)=>{
      const li=document.createElement('li');const box=document.createElement('input');box.type='checkbox';
      const isOn=i===0?selected[facet.key].size===0:selected[facet.key].has(value);box.checked=isOn;li.classList.toggle('selected',isOn);
      const name=document.createElement('span');name.textContent=value;
      const num=document.createElement('span');num.className='count';num.textContent=fmt(n);
      li.append(box,name,num);
      li.addEventListener('click',()=>{const set=selected[facet.key];if(i===0)set.clear();else if(!set.delete(value))set.add(value);update();});
      return li;
    }));
    const section=document.createElement('section');section.className='filter-group';
    const title=document.createElement('h2');title.textContent=facet.title;
    section.append(title,list);
    return section;
  }));
}

function card(clip,index){
  const figure=document.createElement('figure');figure.className='card';
  const tile=document.createElement('button');tile.type='button';tile.className='tile';tile.setAttribute('aria-label',`Open ${clip.title}, ${clip.subtitle||clip.id}`);
  const video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='none';
  video.poster=media(clip,'poster');video.dataset.src=media(clip,'video');video.setAttribute('aria-hidden','true');video.setAttribute('disablepictureinpicture','');
  tile.append(video);
  if(clip.speed>1){const badge=document.createElement('span');badge.className='speed-badge';badge.textContent=`${clip.speed}×`;tile.append(badge);}
  tile.addEventListener('click',()=>openViewer(index));
  const caption=document.createElement('figcaption');
  const name=document.createElement('span');name.className='name';name.textContent=clip.title;
  const id=document.createElement('span');id.className='id';id.textContent=clip.subtitle||clip.id;name.append(id);
  const stat=document.createElement('span');stat.className='error';stat.textContent=clip.stat;
  caption.append(name,stat);figure.append(tile,caption);
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
  filtered=sorted(clips.filter(clip=>matches(clip)));
  videoObserver.disconnect();
  grid.querySelectorAll('video').forEach(video=>{video.pause();video.removeAttribute('src');video.load();});
  grid.replaceChildren();shown=0;
  empty.hidden=filtered.length>0;count.textContent=`${fmt(filtered.length)} of ${fmt(clips.length)} trajectories`;
  renderFacets();renderPage();
  const params=new URLSearchParams();
  data.facets.forEach(f=>{if(selected[f.key].size)params.set(f.key,[...selected[f.key]].join(','));});
  if(search.value.trim())params.set('q',search.value.trim());
  if(sort.value!=='shuffle')params.set('sort',sort.value);
  const query=params.toString();
  history.replaceState(null,'',query?`?${query}`:location.pathname);
}

function openViewer(index){
  current=(index+filtered.length)%filtered.length;
  const clip=filtered[current];
  viewerVideo.poster=media(clip,'poster');viewerVideo.src=media(clip,'video');
  if(!reduceMotion)viewerVideo.play().catch(()=>{});
  $('viewer-title').textContent=clip.title;
  $('viewer-meta').textContent=`${clip.subtitle||clip.id} · ${clip.seconds.toFixed(1)} s clip, ${clip.speed>1?`${clip.speed}× speed`:'real time'} · ${clip.detail}`;
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

// The page names its manifest (with a version to bump on every rebuild) in data-clips on <body>.
fetch(document.body.dataset.clips).then(response=>{if(!response.ok)throw new Error('Could not load clips');return response.json();}).then(manifest=>{
  data=manifest;clips=manifest.clips;shuffle();
  const params=new URLSearchParams(location.search);
  data.facets.forEach(facet=>{
    const counts={};clips.forEach(clip=>{const v=clip.facets[facet.key];counts[v]=(counts[v]||0)+1;});
    const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([v])=>v);
    named[facet.key]=facet.top?ranked.slice(0,facet.top):ranked;
    hasOther[facet.key]=ranked.length>named[facet.key].length;
    selected[facet.key]=new Set((params.get(facet.key)||'').split(',').filter(v=>named[facet.key].includes(v)||(v==='Other'&&hasOther[facet.key])));
  });
  search.value=params.get('q')||'';
  if(['id','error'].includes(params.get('sort')))sort.value=params.get('sort');
  update();
}).catch(()=>{empty.hidden=false;empty.textContent='The trajectory list could not be loaded. Please refresh to try again.';});
