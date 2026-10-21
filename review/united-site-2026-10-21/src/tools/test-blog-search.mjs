// Test the enhanced archive without network requests or a running preview server.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = await fs.readFile(path.join(root, 'blog/blog.js'), 'utf8');
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const fixture = `<section data-blog-featured>Destaque</section>
<section id="article-library" data-current-page="3" data-blog-base="../../">
<h2 data-results-heading tabindex="-1">Artigos</h2>
<form id="blog-search"><input name="q" type="search"><button>Buscar</button></form>
<div>${[['todos','Todos'],['aprendizado','Aprender inglês'],['united','Universo United'],['materiais','Materiais de estudo']].map(([key,label])=>`<button data-topic-filter="${key}">${label}</button>`).join('')}</div>
<p data-blog-status role="status" aria-live="polite">190 artigos para explorar.</p>
<button data-blog-clear hidden>Limpar filtros</button>
<div class="articles-grid">${Array.from({length:9},(_,i)=>`<article class="article-card" data-blog-card>Artigo estático ${i+1}</article>`).join('')}</div>
<div data-blog-empty hidden><button data-blog-reset>Ver todos os artigos</button></div>
<nav data-blog-pagination><a data-blog-prev href="../2/">Anterior</a><span data-blog-page>Página 3 de 22</span><a data-blog-next href="../4/">Próxima</a></nav></section>
<button data-copy-link data-url="https://unitedidiomas.com/blog/artigo-190/">Copiar</button><p data-share-status></p><input data-share-fallback hidden>`;
const articles = Array.from({length:190},(_,i)=>({
  id:i+1,slug:`artigo-${i+1}`,title:i===189?'Antigo <img onerror="alert(1)"> título':`Artigo ${i+1}`,
  excerpt:'Uma leitura para você.', topic:i>=180?'materiais':i>=170?'united':'aprendizado',
  date:'2020-01-01T10:00:00', dateLabel:'1 de janeiro de 2020',reading:4,
  search:i===189?'conversação ótima, vocabulário de aeroporto':'aprender inglês no dia a dia',
  localImage:{large:`assets/artigo-${i+1}.webp`,thumb:`assets/artigo-${i+1}-640.webp`,width:1200,height:675,thumbWidth:640},imageAlt:'Foto ilustrativa'
}));
const payload={articles,pageSize:9};
async function browser({url='http://127.0.0.1:8790/blog/pagina/3/?v=28',fetcher=async()=>({ok:true,json:async()=>payload})}={}){
 const dom=new JSDOM(fixture,{url,runScripts:'outside-only'});
 const {window}=dom;const requests=[];
 window.fetch=(url,options)=>{requests.push({url,options});return fetcher(url,options);};
 window.Element.prototype.scrollIntoView=function(){};
 Object.defineProperty(window.document,'currentScript',{configurable:true,value:{src:'http://127.0.0.1:8790/blog/blog.js?v=28'}});
 window.eval(code);await flush();
 return {dom,window,doc:window.document,requests};
}
function submit(env,text){env.doc.querySelector('input[name=q]').value=text;env.doc.querySelector('form').dispatchEvent(new env.window.Event('submit',{bubbles:true,cancelable:true}));}
function click(env,selector){env.doc.querySelector(selector).dispatchEvent(new env.window.MouseEvent('click',{bubbles:true,cancelable:true,button:0}));}
const env=await browser();
assert.equal(env.requests.length,0,'Untouched paginated archive must not fetch its full search index.');
assert.equal(env.doc.querySelectorAll('[data-blog-card]').length,9);
assert.equal(env.doc.querySelector('[data-blog-next]').getAttribute('href'),'../4/');
submit(env,'conversacao otima');await flush();await flush();
assert.equal(env.requests.length,1);
assert.equal(env.requests[0].url,'http://127.0.0.1:8790/blog/search-index.json','Resolve index from script URL, including nested archive pages.');
assert.equal(env.doc.querySelectorAll('[data-blog-card]').length,1,'Full text search reaches old archive records beyond the static page.');
assert.match(env.doc.querySelector('h3').textContent,/<img onerror=/,'Title stays readable text.');
assert.equal(env.doc.querySelector('h3 img'),null,'Search data never becomes executable HTML.');
assert.equal(env.doc.querySelector('.card-image').href,'http://127.0.0.1:8790/blog/artigo-190/');
assert.equal(env.doc.querySelector('.card-image img').src,'http://127.0.0.1:8790/blog/assets/artigo-190.webp');
assert.equal(env.doc.querySelector('[data-blog-featured]').hidden,true);
assert.equal(env.doc.querySelector('[data-blog-prev]').getAttribute('aria-disabled'),'true');
assert.equal(env.doc.querySelector('#article-library').hasAttribute('aria-busy'),false);
assert.equal(new URL(env.window.location.href).pathname,'/blog/');
assert.equal(new URL(env.window.location.href).searchParams.get('q'),'conversacao otima');
click(env,'[data-blog-clear]');await flush();
assert.equal(env.requests.length,1,'Subsequent filters reuse the index.');
assert.equal(env.doc.querySelectorAll('[data-blog-card]').length,9);
assert.equal(env.doc.querySelector('[data-blog-page]').textContent,'Página 1 de 22');
assert.equal(env.doc.querySelector('[data-blog-next]').href,'http://127.0.0.1:8790/blog/?v=28&pagina=2#article-library');
click(env,'[data-blog-next]');await flush();
assert.equal(env.doc.querySelector('h3').textContent,'Artigo 10');
assert.equal(env.doc.querySelector('[data-blog-page]').textContent,'Página 2 de 22');
click(env,'[data-topic-filter="materiais"]');await flush();
assert.equal(env.doc.querySelector('[data-blog-status]').textContent,'10 artigos encontrados. Página 1 de 2.');
click(env,'[data-blog-next]');await flush();
assert.equal(env.doc.querySelectorAll('[data-blog-card]').length,1);
assert.equal(env.doc.querySelector('[data-blog-next]').hasAttribute('href'),false);
submit(env,'inexistente xyz');await flush();
assert.equal(env.doc.querySelectorAll('[data-blog-card]').length,0);
assert.equal(env.doc.querySelector('[data-blog-empty]').hidden,false);
click(env,'[data-blog-reset]');await flush();
assert.equal(env.doc.querySelector('[data-blog-empty]').hidden,true);
let clipboardValue;
Object.defineProperty(env.window.navigator,'clipboard',{value:{writeText:async value=>{clipboardValue=value;}}});
click(env,'[data-copy-link]');await flush();
assert.equal(clipboardValue,'https://unitedidiomas.com/blog/artigo-190/');
assert.equal(env.doc.querySelector('[data-share-status]').textContent,'Link copiado.');
env.dom.window.close();

const direct=await browser({url:'http://127.0.0.1:8790/blog/?tema=materiais&pagina=999'});await flush();
assert.equal(direct.requests.length,1,'A shared search URL hydrates its search result.');
assert.equal(direct.doc.querySelector('[data-blog-page]').textContent,'Página 2 de 2','Clamp arbitrary requested page.');
assert.equal(direct.doc.querySelectorAll('[data-blog-card]').length,1);
direct.dom.window.close();

let attempts=0;
const failed=await browser({fetcher:async()=>{if(++attempts===1)throw new Error('Offline');return {ok:true,json:async()=>payload};}});
submit(failed,'aeroporto');await flush();await flush();
assert.equal(failed.doc.querySelectorAll('[data-blog-card]').length,9,'Failed search preserves existing articles.');
assert.equal(failed.doc.querySelector('[data-blog-status]').textContent,'Não foi possível carregar a busca. Tente novamente.');
assert.equal(failed.doc.querySelector('#article-library').hasAttribute('aria-busy'),false);
assert.equal(failed.doc.querySelector('[data-blog-next]').getAttribute('href'),'../4/');
submit(failed,'aeroporto');await flush();await flush();
assert.equal(attempts,2,'Search can retry after a transient network failure.');
assert.equal(failed.doc.querySelectorAll('[data-blog-card]').length,1);
failed.dom.window.close();

let release;
const racing=await browser({fetcher:()=>new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>payload});})});
submit(racing,'aeroporto');
submit(racing,'inglês');
assert.equal(racing.requests.length,1,'Simultaneous intentions share one request.');
release();await flush();await flush();
assert.equal(racing.doc.querySelector('[data-blog-status]').textContent,'189 artigos encontrados. Página 1 de 21.','Only latest query renders after index fetch.');
assert.equal(new URL(racing.window.location.href).searchParams.get('q'),'inglês');
racing.dom.window.close();
const rankingArticles = Array.from({length:15}, (_, index) => ({
  ...articles[index],
  title: index === 14 ? 'É possível aprender inglês depois de adulto?' : `Novo artigo ${index + 1}`,
  excerpt: 'Ideias para aprender inglês.',
  search: 'É possível aprender inglês depois de adulto? Esta expressão faz parte do texto do artigo.',
}));
const ranked = await browser({fetcher: async () => ({ok: true, json: async () => ({articles: rankingArticles, pageSize: 9})})});
submit(ranked, 'depois de adulto'); await flush(); await flush();
assert.equal(ranked.doc.querySelector('h3').textContent, 'É possível aprender inglês depois de adulto?', 'Older article with a matching title must precede recent body-only matches.');
assert.equal(ranked.doc.querySelector('[data-blog-status]').textContent, '15 artigos encontrados. Página 1 de 2.', 'Ranking must preserve matches found only in the full body.');
assert.equal(ranked.doc.querySelectorAll('h3')[1].textContent, 'Novo artigo 1', 'Equal ranks retain chronological order.');
click(ranked, '[data-blog-clear]'); await flush();
assert.equal(ranked.doc.querySelector('h3').textContent, 'Novo artigo 1', 'Clearing search restores chronological order.');
ranked.dom.window.close();

const withFeatured = { ...payload, featuredSlug: articles[0].slug };
const deduped = await browser({url:'http://127.0.0.1:8790/blog/?pagina=1',fetcher:async()=>({ok:true,json:async()=>withFeatured})});
await flush(); await flush();
assert.equal(deduped.doc.querySelector('h3').textContent,'Artigo 2','The default library starts after its featured article.');
assert.equal(deduped.doc.querySelector('[data-blog-status]').textContent,'189 artigos para explorar. Página 1 de 21.','Default pagination counts only the library cards.');
assert.equal(deduped.doc.querySelector('[data-blog-featured]').hidden,false);
click(deduped,'[data-blog-next]');await flush();
assert.equal(deduped.doc.querySelector('h3').textContent,'Artigo 11','Removing the featured card must not skip an article between pages.');
assert.equal(deduped.doc.querySelector('[data-blog-featured]').hidden,true,'The featured article belongs only on the first unfiltered page.');
click(deduped,'[data-topic-filter="aprendizado"]');await flush();
assert.equal(deduped.doc.querySelector('h3').textContent,'Artigo 1','A topic filter includes the featured article.');
assert.equal(deduped.doc.querySelector('[data-blog-status]').textContent,'170 artigos encontrados. Página 1 de 19.');
submit(deduped,'Artigo 1');await flush();
assert.equal(deduped.doc.querySelector('h3').textContent,'Artigo 1','Searching can still find the featured article.');
assert.equal(deduped.doc.querySelector('[data-blog-featured]').hidden,true);
click(deduped,'[data-blog-clear]');await flush();
assert.equal(deduped.doc.querySelector('h3').textContent,'Artigo 2','Clearing a search restores the deduplicated archive.');
assert.equal(deduped.doc.querySelector('[data-blog-featured]').hidden,false);
assert.equal(deduped.doc.querySelector('[data-blog-page]').textContent,'Página 1 de 21');
deduped.dom.window.close();

console.log('Blog search passed: full-text search, URL state, topics, pagination, safe text, sharing, network retry, request races, title ranking and featured article deduplication.');
