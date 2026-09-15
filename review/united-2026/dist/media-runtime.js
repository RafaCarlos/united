/* Silent inline scenes with an accessible, discreet control instead of native video chrome. */
(function () {
  'use strict';
  const videos=Array.from(document.querySelectorAll('video[data-managed-video]'));
  if (!videos.length) return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection=navigator.connection;
  const manualOnly=()=>motion.matches || Boolean(connection&&connection.saveData);
  const states=videos.map((video,index)=>{
    const frame=document.createElement('div');
    frame.className='united-motion-frame';
    video.before(frame);frame.append(video);
    const button=document.createElement('button');
    button.type='button';button.className='united-motion-toggle';
    video.id=video.id||'united-scene-'+(index+1);
    button.setAttribute('aria-controls',video.id);
    frame.append(button);
    const name=video.getAttribute('aria-label')||'cena do curso';
    const state={video,frame,button,name,visible:false,userPaused:false,pending:false,failed:false};
    function paint(){
      const paused=video.paused;
      button.innerHTML=paused?'<span aria-hidden="true">▶</span>':'<span aria-hidden="true">Ⅱ</span>';
      const label=(paused?'Reproduzir vídeo: ':'Pausar vídeo: ')+name;
      button.setAttribute('aria-label',label);button.title=label;
      frame.classList.toggle('is-paused',paused);
      if(state.failed){button.setAttribute('aria-label','Tentar reproduzir vídeo: '+name);button.title='Tentar novamente';}
    }
    state.paint=paint;
    video.controls=false;video.muted=true;video.defaultMuted=true;
    video.playsInline=true;video.removeAttribute('autoplay');
    video.disablePictureInPicture=true;
    video.setAttribute('controlslist','nodownload nofullscreen noremoteplayback');
    video.setAttribute('disableRemotePlayback','');
    video.addEventListener('play',()=>{state.failed=false;paint();});
    video.addEventListener('pause',paint);
    video.addEventListener('error',()=>{state.failed=true;paint();});
    button.addEventListener('click',()=>{
      if(!video.paused){state.userPaused=true;video.pause();}
      else {state.userPaused=false;attempt(state,true);}
    });
    paint();return state;
  });
  function attempt(state,manual){
    if(state.pending||!state.video.paused)return;
    if(!manual&&(!state.visible||document.hidden||manualOnly()||state.userPaused))return;
    state.pending=true;
    if(state.failed){state.video.load();state.failed=false;}
    const result=state.video.play();
    Promise.resolve(result).then(()=>{
      state.pending=false;
      if(document.hidden||(!manual&&!state.visible))state.video.pause();
      state.paint();
    }).catch(()=>{state.pending=false;state.paint();});
  }
  function refresh(){states.forEach(state=>{
    if(document.hidden||!state.visible||manualOnly())state.video.pause();
    else attempt(state,false);
  });}
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      const state=states.find(s=>s.video===entry.target);
      state.visible=entry.isIntersecting&&entry.intersectionRatio>=.15;
      if(state.visible)attempt(state,false);else state.video.pause();
    }),{threshold:[0,.15]});
    states.forEach(state=>observer.observe(state.video));
  }
  document.addEventListener('visibilitychange',refresh);
  if(motion.addEventListener)motion.addEventListener('change',refresh);else motion.addListener(refresh);
  if(connection&&connection.addEventListener)connection.addEventListener('change',refresh);
})();
