/* Interaction contracts for the real hero script; no requests or lead submissions. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require(path.join(process.env.UNITED_CODE_TOOLS || '/private/tmp/united-code-tools', 'node_modules/jsdom'));
const readRuntimeSource = require('./read-runtime-source.cjs');
const root = path.resolve(__dirname, '..');
const source = readRuntimeSource('preview.js');

function fixture({width=1440, height=900, reduced=false}={}) {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8'), {
    url:'https://www.unitedidiomas.com/', runScripts:'outside-only', pretendToBeVisual:true,
  });
  const w=dom.window, d=w.document, frames=new Map(), timers=new Map(), viewportListeners=[];
  let reads=0, sequence=0, visualHeight=height, hidden=false;
  Object.defineProperty(d.documentElement, 'clientWidth', {get(){ reads++; return width; }});
  Object.defineProperty(w, 'innerWidth', {get(){ return width; }});
  Object.defineProperty(w, 'innerHeight', {get(){ return height; }});
  Object.defineProperty(d, 'hidden', {get(){return hidden;}});
  Object.defineProperty(w, 'visualViewport', {value:{get height(){return visualHeight;}, addEventListener(type, callback){viewportListeners.push(callback);}}});
  w.matchMedia = query => ({get matches(){return query.includes('reduced-motion') ? reduced : width<=768;}, addEventListener(){}, addListener(){}});
  w.requestAnimationFrame = callback => {const id=++sequence; frames.set(id,callback); return id;};
  w.cancelAnimationFrame = id => frames.delete(id);
  w.setTimeout = (callback, delay) => {const id=++sequence; timers.set(id,{callback,delay}); return id;};
  w.clearTimeout = id => timers.delete(id);
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.eval(source);
  const panels=[...d.querySelectorAll('.preview-panel')];
  return {
    w,d,panels,frames,timers,
    get reads(){return reads;},
    active(){return panels.findIndex(panel => panel.classList.contains('active'));},
    hover(index){const e=new w.Event('pointerenter'); Object.defineProperty(e,'pointerType',{value:'mouse'}); panels[index].dispatchEvent(e);},
    key(index,key){panels[index].dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));},
    resize(nextWidth,nextHeight){width=nextWidth;height=nextHeight;visualHeight=height;w.dispatchEvent(new w.Event('resize'));viewportListeners.forEach(callback=>callback());},
    visualResize(nextHeight){visualHeight=nextHeight;viewportListeners.forEach(callback=>callback());},
    setViewportSilently(nextWidth,nextHeight){width=nextWidth;height=nextHeight;visualHeight=height;},
    setHidden(value){hidden=value;d.dispatchEvent(new w.Event('visibilitychange'));},
    pageshow(){w.dispatchEvent(new w.PageTransitionEvent('pageshow',{persisted:true}));},
    paint(){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(callback=>callback());},
    nextSlide(){const [id,timer]=[...timers.entries()][0];assert.equal(timer.delay,6000);timers.delete(id);timer.callback();},
    close(){w.close();},
  };
}

test('desktop pointer movement leaves the composition stable; click and keyboard still select banners',()=>{
  const f=fixture();
  try {
    f.hover(1);f.hover(2);assert.equal(f.active(),0);
    f.panels[1].click();assert.equal(f.active(),1);
    assert.deepEqual(f.panels.map(panel=>panel.style.getPropertyValue('--panel-width')),['16%','64%','20%']);
    f.key(1,'ArrowRight');assert.equal(f.active(),2);
    f.key(0,'Enter');assert.equal(f.active(),0);
    assert.equal(f.d.querySelectorAll('.preview-panel.active').length,1);
  } finally {f.close();}
});

test('selecting artwork reuses viewport measurements instead of reading layout after DOM changes',()=>{
  const f=fixture();
  try {
    const initial=f.reads;
    for(const panel of f.panels) panel.click();
    f.key(2,'ArrowLeft');
    assert.equal(f.reads,initial);
    assert.equal(f.frames.size,0);
  } finally {f.close();}
});

test('window and visual viewport resize events share one measurement per animation frame',()=>{
  const f=fixture({width:1024,height:900});
  try {
    const original=f.reads;
    f.resize(1366,768);f.resize(1280,720);
    assert.equal(f.frames.size,1);
    assert.equal(f.reads,original);
    f.paint();
    assert.equal(f.reads,original+1);
    const style=f.d.documentElement.style;
    const width=parseFloat(style.getPropertyValue('--preview-art-width'));
    const top=parseFloat(style.getPropertyValue('--preview-art-top'));
    assert.equal(style.getPropertyValue('--preview-hero-width'),'1204px');
    assert.equal(style.getPropertyValue('--preview-hero-height'),'700px');
    assert.ok(Math.abs(top+width*1402/1122-700)<0.001,'art still meets the approved bottom edge');
  } finally {f.close();}
});

test('desktop has no automatic transitions; mobile retains autoplay and pauses after explicit choice',()=>{
  const desktop=fixture(), mobile=fixture({width:390,height:844});
  try {
    assert.equal(desktop.timers.size,0);
    mobile.nextSlide();assert.equal(mobile.active(),1);
    mobile.nextSlide();assert.equal(mobile.active(),2);
    mobile.panels[0].click();assert.equal(mobile.active(),0);
    assert.equal(mobile.timers.size,0);
  } finally {desktop.close();mobile.close();}
});

test('reduced motion retains manual keyboard access without automatic transitions',()=>{
  const f=fixture({width:390,height:844,reduced:true});
  try {
    assert.equal(f.timers.size,0);
    assert.equal(f.d.querySelector('.preview-playback').disabled,true);
    f.key(0,'ArrowRight');assert.equal(f.active(),1);
    assert.equal(f.panels[1].getAttribute('aria-expanded'),'true');
  } finally {f.close();}
});

test('visual viewport zoom or keyboard changes do not resize the desktop hero composition',()=>{
  const f=fixture({width:844,height:390});
  try {
    const before=f.d.documentElement.style.cssText;
    f.visualResize(180);f.paint();
    assert.equal(f.d.documentElement.style.cssText,before);
    assert.equal(f.d.documentElement.style.getPropertyValue('--preview-hero-height'),'370px');
  } finally {f.close();}
});

test('Safari app return recovers orientation and autoplay without a resize event',()=>{
  const f=fixture({width:390,height:844});
  try {
    f.visualResize(350);assert.equal(f.frames.size,1);
    f.setHidden(true);
    assert.equal(f.frames.size,0,'a suspended frame does not block future viewport measurements');
    assert.equal(f.timers.size,0);
    f.setViewportSilently(844,390);
    f.setHidden(false);f.pageshow();
    assert.equal(f.frames.size,1);
    f.paint();
    assert.equal(f.d.documentElement.style.getPropertyValue('--preview-hero-width'),'768px');
    assert.equal(f.d.documentElement.style.getPropertyValue('--preview-hero-height'),'370px');
    assert.equal(f.timers.size,0,'landscape desktop mode does not restart mobile autoplay');
    f.setHidden(true);f.setViewportSilently(390,844);f.setHidden(false);f.pageshow();f.paint();
    assert.equal(f.d.body.classList.contains('preview-compact-header'),false);
    assert.equal(f.timers.size,1,'portrait returns to a single mobile autoplay timer');
    f.nextSlide();assert.equal(f.active(),1);
  } finally {f.close();}
});

test('bfcache pageshow replaces a lost animation-frame ticket even without a visibility event',()=>{
  const f=fixture({width:1024,height:768});
  try {
    f.resize(1280,720);assert.equal(f.frames.size,1);
    f.frames.clear();
    f.setViewportSilently(1440,900);f.pageshow();f.paint();
    assert.equal(f.d.documentElement.style.getPropertyValue('--preview-hero-width'),'1364px');
    assert.equal(f.d.documentElement.style.getPropertyValue('--preview-hero-height'),'880px');
  } finally {f.close();}
});
