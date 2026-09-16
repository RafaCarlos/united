(function(){
 'use strict';
 const hero=document.querySelector('.united-preview-hero');
 if(hero){
 const panels=Array.from(hero.querySelectorAll('.preview-panel'));
 const tabs=Array.from(hero.querySelectorAll('[role=tab]'));
 const titles=['United','Live Class','Jimmy 24/7'];
 let active=0;
 const playback=hero.querySelector('.preview-playback');
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let automaticTimer=null,autoPaused=new URLSearchParams(location.search).get('compare')==='1',heroVisible=true;
 function updateAutomatic(){
  window.clearTimeout(automaticTimer);automaticTimer=null;
  const paused=autoPaused||reducedMotion.matches;
  if(playback){playback.disabled=reducedMotion.matches;playback.textContent=paused?'▶':'Ⅱ';playback.setAttribute('aria-label',reducedMotion.matches?'Troca automática desativada pela preferência de movimento reduzido':paused?'Retomar troca automática dos banners':'Pausar troca automática dos banners');}
  if(window.matchMedia('(max-width:768px)').matches&&!paused&&!document.hidden&&heroVisible){
   automaticTimer=window.setTimeout(function(){select(active+1);},6000);
  }
 }
 function choose(index){autoPaused=true;select(index);}
 function fit(){
  if(window.matchMedia('(max-width:768px)').matches){document.body.classList.remove('preview-compact-header');return;}
  const viewportWidth=document.documentElement.clientWidth||window.innerWidth;
  const viewportHeight=window.visualViewport?window.visualViewport.height:window.innerHeight;
  const availableHeight=Math.max(0,viewportHeight-20);
  const top=Math.min(60,Math.max(44,viewportHeight*.075),availableHeight*.3);
  // The original site uses the full viewport width and a 60% / 64% opening.
  // Extended scenery fills the sides; the approved center stays proportional.
  const width=viewportWidth-76;
  const proportions=active===0?[60,20,20]:active===1?[16,64,20]:[16,20,64];
  const artWidth=Math.min((availableHeight-top)*1122/1402,width*proportions[active]/100);
  const artTop=availableHeight-artWidth*1402/1122;
  const style=document.documentElement.style;
  style.setProperty('--preview-hero-width',width+'px');
  style.setProperty('--preview-hero-height',availableHeight+'px');
  style.setProperty('--preview-art-top',artTop+'px');
  style.setProperty('--preview-art-width',artWidth+'px');
  panels.forEach((panel,i)=>panel.style.setProperty('--panel-width',proportions[i]+'%'));
  document.body.classList.toggle('preview-compact-header',width<1120);
 }
 function select(index){
  active=(index+panels.length)%panels.length;
  panels.forEach((panel,i)=>{
   const selected=i===active;
   panel.classList.toggle('active',selected);
   panel.setAttribute('aria-expanded',String(selected));
   panel.querySelector('.art-cta').tabIndex=selected?0:-1;
   tabs[i].setAttribute('aria-selected',String(selected));
   tabs[i].tabIndex=selected?0:-1;
  });
  hero.querySelector('.preview-announcement').textContent='Banner '+titles[active]+' aberto';
  fit();
  updateAutomatic();
 }
 panels.forEach((panel,i)=>{
  panel.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&!window.matchMedia('(max-width:768px)').matches)select(i);});
  panel.addEventListener('click',e=>{if(!e.target.closest('a'))select(i);});
  panel.addEventListener('keydown',e=>{
   if(e.target.closest('a'))return;
   if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(i);}
   if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();choose(active+(e.key==='ArrowRight'?1:-1));panels[active].focus();}
  });
  tabs[i].addEventListener('click',()=>choose(i));
  tabs[i].addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();choose(active+(e.key==='ArrowRight'?1:-1));tabs[active].focus();}});
 });
 let start=null;
 hero.addEventListener('touchstart',e=>{start={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};},{passive:true});
 hero.addEventListener('touchend',e=>{
  if(!start||!window.matchMedia('(max-width:768px)').matches)return;
  const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)choose(active+(dx<0?1:-1));
  start=null;
 },{passive:true});
 if('ResizeObserver'in window)new ResizeObserver(fit).observe(hero);
 window.addEventListener('resize',fit);
 window.addEventListener('resize',updateAutomatic);
 document.addEventListener('visibilitychange',updateAutomatic);
 if(playback)playback.addEventListener('click',function(){autoPaused=!autoPaused;updateAutomatic();});
 if(reducedMotion.addEventListener)reducedMotion.addEventListener('change',updateAutomatic);else reducedMotion.addListener(updateAutomatic);
 if('IntersectionObserver'in window)new IntersectionObserver(function(entries){heroVisible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.25;updateAutomatic();},{threshold:[0,.25]}).observe(hero);
 if(window.visualViewport)window.visualViewport.addEventListener('resize',fit);
 const requested=Number(new URLSearchParams(location.search).get('banner'));
 select(Number.isInteger(requested)&&requested>=1&&requested<=3?requested-1:0);
 }
 document.addEventListener('click',e=>{
  if(e.defaultPrevented)return;
  const link=e.target.closest('a');if(!link)return;
  const href=link.getAttribute('href');
  if(href&&href.charAt(0)==='#'){
   let target;try{target=document.getElementById(decodeURIComponent(href.slice(1)));}catch(error){return;}
   if(target){e.preventDefault();target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});}
  }
 });
})();
