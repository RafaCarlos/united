'use strict';
const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('#mobile-menu');
menuButton.addEventListener('click',()=>{
  if(mobileMenu.open){mobileMenu.close();return;}
  mobileMenu.showModal();
  menuButton.setAttribute('aria-expanded','true');
  document.body.classList.add('modal-open');
  mobileMenu.querySelector('.dialog-close').focus();
});
mobileMenu.querySelector('.dialog-close').addEventListener('click',()=>mobileMenu.close());
mobileMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>mobileMenu.close()));
mobileMenu.addEventListener('close',()=>{
  menuButton.setAttribute('aria-expanded','false');
  document.body.classList.remove('modal-open');
  menuButton.focus({preventScroll:true});
});
mobileMenu.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const controls=[...mobileMenu.querySelectorAll('a[href],button:not([disabled])')];
  const first=controls[0],last=controls[controls.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
matchMedia('(min-width:1024px)').addEventListener('change',event=>{if(event.matches&&mobileMenu.open)mobileMenu.close();});
// Explore professional contexts, then continue into the relevant course area.
const contextTabs=[...document.querySelectorAll('.business-context-tabs [role=tab]')];
contextTabs.forEach(button=>button.addEventListener('click',()=>{
  contextTabs.forEach(tab=>{
    const selected=tab===button;
    tab.setAttribute('aria-selected',String(selected));
    tab.tabIndex=selected?0:-1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected;
  });
}));
document.querySelectorAll('.business-translation-toggle').forEach(button=>button.addEventListener('click',()=>{
  const translation=document.getElementById(button.getAttribute('aria-controls'));
  const expanded=button.getAttribute('aria-expanded')==='true';
  translation.hidden=expanded;
  button.setAttribute('aria-expanded',String(!expanded));
  button.textContent=expanded?'Ver tradução':'Ocultar tradução';
}));
document.querySelectorAll('[data-related-area]').forEach(link=>link.addEventListener('click',event=>{
  const tab=document.getElementById(link.dataset.relatedArea);
  if(!tab)return;
  event.preventDefault();
  tab.click();
  tab.focus({preventScroll:true});
  tab.scrollIntoView({block:'center',inline:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}));
const businessProgram=document.querySelector('#programa');
const programTabs=[...businessProgram.querySelectorAll('.program-tabs button')];
programTabs.forEach(button=>button.addEventListener('click',()=>{
  programTabs.forEach(tab=>{
    const selected=tab===button;
    tab.setAttribute('aria-selected',String(selected));
    tab.tabIndex=selected?0:-1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected;
  });
  businessProgram.dataset.programTone=button.dataset.programTone;
  const areaIndex=programTabs.indexOf(button);
  const status=businessProgram.querySelector('.program-current-status');
  status.querySelector('span').textContent=`Área ${areaIndex+1} de ${programTabs.length}`;
  const first=String(areaIndex*4+1).padStart(2,'0');
  const last=String(areaIndex*4+4).padStart(2,'0');
  status.querySelector('strong').textContent=`${button.querySelector('.program-tab-label').textContent} · temas ${first}–${last}`;
}));
document.querySelectorAll('[role=tablist]').forEach(list=>list.addEventListener('keydown',event=>{
  if(!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  const tabs=[...list.querySelectorAll('[role=tab]')];const index=tabs.indexOf(document.activeElement);if(index<0)return;
  event.preventDefault();let next;
  if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else next=(index+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)+tabs.length)%tabs.length;
  tabs[next].focus();tabs[next].click();
}));
