const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {JSDOM}=require('/tmp/united-seo-tools/node_modules/jsdom');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),workspace=path.dirname(root),site=path.join(workspace,'united-seo-release'),dist=path.join(root,'dist');
fs.mkdirSync(dist,{recursive:true});
function copy(source,target){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}
function assetUrl(file){return file+'?v='+createHash('sha256').update(fs.readFileSync(path.join(dist,file))).digest('hex').slice(0,12);}
const raw=execFileSync('/tmp/united-seo-tools/node_modules/.bin/php-wasm-cli',['-r',"$_COOKIE=array('unitedSite'=>'accepted');$_SERVER['SCRIPT_FILENAME']=getcwd().'/index.php';include 'index.php';"],{cwd:site,encoding:'utf8'});
const dom=new JSDOM(raw),d=dom.window.document;
const old=new JSDOM(fs.readFileSync(path.join(workspace,'previews-united/01-institucional-aberto-proporcao-correta.html'),'utf8'));
const names=['institucional','liveclass','jimmy'],labels=['United','Live Class','Jimmy 24/7'],targets=['#contato','#live-class','#jimmy-united-idiomas'];
const hero=d.createElement('section');hero.className='united-preview-hero';hero.id='inicio';hero.setAttribute('aria-label','Novos banners da United');
const tabs=d.createElement('div');tabs.className='preview-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Escolher banner');
names.forEach((name,i)=>{const b=d.createElement('button');b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-controls','banner-'+name);b.textContent=labels[i];tabs.appendChild(b);});
hero.appendChild(tabs);
const playback=d.createElement('button');playback.type='button';playback.className='preview-playback';playback.setAttribute('aria-label','Pausar troca automática dos banners');playback.textContent='Ⅱ';hero.appendChild(playback);
const panelBox=d.createElement('div');panelBox.className='preview-panels';
[...old.window.document.querySelectorAll('.preview-panel')].forEach((oldPanel,i)=>{
 const panel=d.importNode(oldPanel,true);panel.id='banner-'+names[i];panel.tabIndex=0;panel.setAttribute('role','group');panel.setAttribute('aria-label',labels[i]);
 panel.querySelector('.teaser-title').textContent=labels[i];
 if(i===0)panel.querySelector('.teaser-title').remove();
 panel.querySelectorAll('[src],[href]').forEach(node=>{for(const attr of ['src','href']){const value=node.getAttribute(attr);if(value&&value==='assets/'+names[i]+'.png')node.setAttribute(attr,'assets/banners/'+names[i]+'.png');}});
 panel.querySelectorAll('.edge-extension,.top-extension').forEach(node=>node.remove());
 const img=panel.querySelector('.full-art');img.alt=['Viva seus sonhos. Fale inglês. A nova geração das escolas de inglês.','Live Class: um universo de inglês, você no centro. Aulas ao vivo, storytelling, on demand, trilha educacional, conversação ilimitada e certificação internacional.','Jimmy 24/7: sua aula acaba. A conversa continua.'][i];img.width=1122;img.height=1402;img.setAttribute('decoding','async');
 const art=d.createElement('div');art.className='art-shell';img.replaceWith(art);art.appendChild(img);
 const scenery=d.createElement('img');scenery.className='scenery-wide';scenery.alt='';scenery.setAttribute('aria-hidden','true');scenery.setAttribute('decoding','async');scenery.src='assets/banners/'+names[i]+'-wide.png';panel.insertBefore(scenery,art);
 scenery.alt=img.alt;scenery.removeAttribute('aria-hidden');
 const a=d.createElement('a');a.className='art-cta';a.href=targets[i];a.setAttribute('aria-label',['Quero falar inglês','Conheça o Live Class','Conheça o Jimmy'][i]);art.appendChild(a);
 if(i===2){const note=d.createElement('p');note.className='jimmy-native-caption';note.textContent='Mantenha o inglês em movimento mesmo depois da aula.';art.appendChild(note);}
 panelBox.appendChild(panel);
 copy(path.join(workspace,'previews-united/assets/'+names[i]+'.png'),path.join(dist,'assets/banners/'+names[i]+'.png'));
 copy(path.join(root,'src/artwork/'+names[i]+'-wide.png'),path.join(dist,'assets/banners/'+names[i]+'-wide.png'));
 scenery.src=assetUrl('assets/banners/'+names[i]+'-wide.png');
});
hero.appendChild(panelBox);const announce=d.createElement('p');announce.className='preview-announcement';announce.setAttribute('aria-live','polite');hero.appendChild(announce);
d.querySelector('.vitrine').replaceWith(hero);d.querySelector('.vitrine-mobile').remove();
// Reuse the approved portrait exactly; CSS frames the character without its baked-in banner copy.
const jimmySection=d.querySelector('#jimmy-united-idiomas');
const jimmyImage=jimmySection.querySelector('figure img');
jimmyImage.src=assetUrl('assets/banners/jimmy.png');
jimmyImage.alt='Jimmy, parceiro de conversação em inglês da United';
jimmyImage.width=1122;jimmyImage.height=1402;
jimmySection.querySelector('h2').textContent='Jimmy 24/7';
jimmySection.querySelector('h3').innerHTML='Sua aula acaba.<br>A conversa continua.';
const jimmyIntro=d.createElement('p');jimmyIntro.className='jimmy-intro';
jimmyIntro.textContent='Mantenha o inglês em movimento mesmo depois da aula.';
jimmySection.querySelector('h3').after(jimmyIntro);
const jimmyDescription=jimmySection.querySelector('.text p:not(.jimmy-intro)');
jimmyDescription.textContent='Pratique conversação com o Jimmy, a inteligência artificial da United. Explore situações do dia a dia e ganhe confiança para se expressar em inglês, no seu ritmo. Disponível 24 horas por dia.';
jimmySection.querySelector('.button').textContent='Quero conhecer o Jimmy';
d.querySelectorAll('script,iframe,noscript,base,link[rel=canonical],meta[property^="og:"],meta[name^="twitter:"]').forEach(node=>node.remove());
d.title='United Idiomas — prévia dos três novos banners';
const robots=d.createElement('meta');robots.name='robots';robots.content='noindex,nofollow';d.head.appendChild(robots);
d.querySelectorAll('link[rel=stylesheet]').forEach(node=>node.remove());
// Apply the new palette to the preview only; preserve the original source and hero artwork.
const blueTokens={'#185BA9':'--united-blue-primary','#0D2463':'--united-blue-deep','#0C2E55':'--united-blue-secondary','#1A5191':'--united-blue-secondary','#012060':'--united-blue-primary','#0D4DFF':'--united-blue-accent'};
const css=fs.readFileSync(path.join(site,'assets/css/style.css'),'utf8')
 .replace(/#[\da-f]{6}\b/gi,color=>blueTokens[color.toUpperCase()]?'var('+blueTokens[color.toUpperCase()]+')':color)
 .replace(/rgba\(24,91,169,([\d.]+)\)/g,'rgba(var(--united-blue-primary-rgb),$1)');
const fontCss='';
fs.mkdirSync(path.join(dist,'assets/css'),{recursive:true});fs.writeFileSync(path.join(dist,'assets/css/style.css'),fontCss+css);
copy(path.join(site,'assets/css/contact-forms.css'),path.join(dist,'assets/css/contact-forms.css'));
for(const name of ['Manrope-Regular.ttf','Manrope-Bold.ttf'])copy(path.join(workspace,'previews-united/assets/'+name),path.join(dist,'assets/fonts/'+name));
copy(path.join(root,'src/theme.css'),path.join(dist,'theme.css'));
copy(path.join(root,'src/responsive-home.css'),path.join(dist,'responsive-home.css'));
copy(path.join(root,'src/responsive-home.js'),path.join(dist,'responsive-home.js'));
copy(path.join(root,'src/preview.css'),path.join(dist,'preview.css'));copy(path.join(root,'src/preview.js'),path.join(dist,'preview.js'));
for(const href of ['assets/css/style.css','assets/css/contact-forms.css','theme.css','preview.css','responsive-home.css']){const link=d.createElement('link');link.rel='stylesheet';link.href=assetUrl(href);d.head.appendChild(link);}
// Retain the original page content and local image assets. Videos stay on the official host.
d.querySelectorAll('[src],[poster]').forEach(node=>{for(const attr of ['src','poster']){const value=node.getAttribute(attr);if(!value||!value.startsWith('assets/')||value.startsWith('assets/banners/'))continue;
 if(value.startsWith('assets/videos/'))node.setAttribute(attr,'https://www.unitedidiomas.com/'+value);
 else if(fs.existsSync(path.join(site,value)))copy(path.join(site,value),path.join(dist,value));
}});
for(const match of css.matchAll(/url\((?:["'])?(\.\.\/[^)'"\s]+)(?:["'])?\)/g)){const relative=path.posix.normalize('assets/css/'+match[1]);if(fs.existsSync(path.join(site,relative)))copy(path.join(site,relative),path.join(dist,relative));}
d.querySelectorAll('a[href]').forEach(a=>{const value=a.getAttribute('href');if(!value)return;
 if(value.startsWith('assets/videos/'))a.href='https://www.unitedidiomas.com/'+value;
 else if(value==='./'||value==='/')a.href='#inicio';
 else if(value.startsWith('/#'))a.href=value.slice(1);
 else if(!value.startsWith('#')&&!/^(https?:|mailto:|tel:|javascript:)/.test(value)){a.href='https://www.unitedidiomas.com/'+value.replace(/^\//,'');a.target='_blank';a.rel='noopener';}
});
d.querySelectorAll('form').forEach(f=>{f.removeAttribute('action');f.setAttribute('data-preview-form','true');});
const pluginFiles=['jquery-3.1.1.min.js','jquery.mask.min.js','slick.js','wow.min.js','detect-mobile.js','media-loading.js'];
const previewBundle=pluginFiles.map(file=>fs.readFileSync(path.join(site,'assets/js/lib',file),'utf8')).join('\n;\n')+'\n;var contactLead={init:function(){}},contactForm={init:function(){}};\n'+fs.readFileSync(path.join(site,'assets/js/lib/structure.js'),'utf8');
fs.mkdirSync(path.join(dist,'assets/js/dist'),{recursive:true});fs.writeFileSync(path.join(dist,'assets/js/dist/scripts.js'),previewBundle);
for(const src of ['assets/js/dist/scripts.js','preview.js','responsive-home.js']){const script=d.createElement('script');script.src=assetUrl(src);d.body.appendChild(script);}
const mark=d.createElement('div');mark.className='preview-mark';mark.textContent='PRÉVIA · 3 BANNERS';d.body.appendChild(mark);
fs.writeFileSync(path.join(dist,'index.html'),dom.serialize());
fs.writeFileSync(path.join(dist,'robots.txt'),'User-agent: *\nDisallow: /\n');
require('./update-contact-preview.cjs');
console.log('Home HTML pronta com três banners interativos e conteúdo original abaixo.');
