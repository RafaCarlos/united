const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('/tmp/united-seo-tools/node_modules/jsdom');
const root=path.resolve(__dirname,'../dist');
async function check(query,mobile,expected,viewport={width:1440,height:700}){
 const errors=[];
 const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://preview.example/'+query,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
 const w=dom.window,d=w.document;
 w.innerWidth=viewport.width;w.innerHeight=viewport.height;
 w.matchMedia=q=>({matches:q.includes('768px')?mobile:false,addListener(){},removeListener(){},addEventListener(){}});
 w.HTMLElement.prototype.scrollIntoView=function(){};w.scrollTo=function(){};
 w.HTMLMediaElement.prototype.load=function(){};w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.play=function(){return Promise.resolve();};
 w.XMLHttpRequest=function(){throw new Error('Unexpected network request');};
 const hero=d.querySelector('.united-preview-hero');Object.defineProperties(hero,{clientWidth:{value:1272},clientHeight:{value:916}});
 w.eval(fs.readFileSync(path.join(root,'assets/js/dist/scripts.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(root,'preview.js'),'utf8'));
 await new Promise(r=>setTimeout(r,100));
 assert.equal(d.querySelectorAll('.edge-extension,.top-extension').length,0);
 if(!mobile){
  function assertFit(){
   const style=d.documentElement.style;
   const width=parseFloat(style.getPropertyValue('--preview-hero-width'));
   const art=parseFloat(style.getPropertyValue('--preview-art-width'));
   const top=parseFloat(style.getPropertyValue('--preview-art-top'));
   assert.ok(Math.abs(width-(w.innerWidth-76))<.01,'Use the full original hero width, not a height-limited width');
   assert.ok(Math.abs(top+art*1402/1122+20-w.innerHeight)<.01,'Entire native image and expanded backdrop must fit the viewport');
   assert.ok(Math.abs(parseFloat(style.getPropertyValue('--preview-hero-height'))+20-w.innerHeight)<.01);
  }
  assertFit();
  w.innerHeight-=80;w.dispatchEvent(new w.Event('resize'));assertFit();
  w.innerHeight=viewport.height;w.dispatchEvent(new w.Event('resize'));assertFit();
 }
 assert.equal(d.querySelector('.preview-panel.active').id,'banner-'+['institucional','liveclass','jimmy'][expected]);
 assert.equal(hero.querySelectorAll('img.full-art').length,3);
 assert.equal(hero.querySelectorAll('img.scenery-wide').length,3);
 for(const img of hero.querySelectorAll('img.scenery-wide'))assert.ok(fs.existsSync(path.join(root,img.getAttribute('src').split('?')[0])));
 assert.equal(hero.querySelectorAll('.banner-open,.banner-copy,.banner-scene').length,0);
 assert.equal(d.querySelector('#banner-institucional .teaser-title'),null);
 for(const [i,tab]of [...hero.querySelectorAll('[role=tab]')].entries()){
  tab.click();assert.equal(d.querySelectorAll('.preview-panel.active').length,1);
  assert.equal(tab.getAttribute('aria-selected'),'true');
  assert.equal(d.querySelector('.preview-panel.active').id,'banner-'+['institucional','liveclass','jimmy'][i]);
  if(!mobile){
   const actual=[...hero.querySelectorAll('.preview-panel')].map(p=>parseFloat(p.style.getPropertyValue('--panel-width')));
   assert.deepEqual(actual,[[60,20,20],[16,64,20],[16,20,64]][i],'Keep the original site expansion proportions');
  }
 }
 for(const form of d.querySelectorAll('form')){
  const event=new w.Event('submit',{bubbles:true,cancelable:true});
  assert.equal(form.dispatchEvent(event),false);assert.match(form.textContent,/Nenhum dado foi enviado/);
 }
 assert.ok(d.querySelector('footer'));assert.ok(d.querySelectorAll('section').length>5);
 for(const a of d.querySelectorAll('.art-cta'))assert.ok(d.querySelector(a.getAttribute('href')));
 assert.equal(d.querySelectorAll('iframe,script[src^="http"]').length,0);
 assert.equal(errors.length,0,errors.join('\n'));
 w.close();
}
(async()=>{
 for(const [width,height]of [[1366,600],[1440,700],[1512,773],[1920,880]])await check('',false,0,{width,height});
 await check('?banner=2',false,1);await check('?banner=3',true,2,{width:390,height:844});
 console.log('PASS: encaixe em quatro janelas de notebook/desktop, resize, três banners, navegação e formulários.');
})().catch(e=>{console.error(e);process.exit(1);});
