#!/usr/bin/env node
// Read-only SEO audit; writes one local JSON report. No browser/network/deployment.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const packageRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const options={};
for(let i=2;i<process.argv.length;i++){
 const key=process.argv[i];
 if(!['--source','--target','--report','--mode','--config'].includes(key)||!process.argv[i+1])throw new Error(`Unsupported option ${key}`);
 options[key.slice(2)]=process.argv[++i];
}
const source=path.resolve(options.source||path.join(packageRoot,'src'));
const target=path.resolve(options.target||source);
const mode=options.mode||'preview';
if(!['preview','production'].includes(mode))throw new Error('mode must be preview or production');
const config=options.config?JSON.parse(await fs.readFile(path.resolve(options.config),'utf8')):{origin:'https://www.unitedidiomas.com',routes:{'home/index.html':'/','index.html':'/cursos/live-class/','business/index.html':'/cursos/business/','full/index.html':'/cursos/full/','quem-somos/index.html':'/quem-somos/','faq/index.html':'/faq/'}};
const origin=new URL(config.origin).origin;
const pages=JSON.parse(await fs.readFile(path.join(source,'navigation.json'),'utf8')).pages;
const errors=[],warnings=[],inventory=[],titleOwners=new Map(),descriptionOwners=new Map(),canonicalOwners=new Map();
const failure=(file,check,details)=>errors.push({file,check,details});
const warn=(file,check,details)=>warnings.push({file,check,details});
const plain=value=>String(value||'').replace(/\s+/g,' ').trim();
const blocks=new Set('P H1 H2 H3 H4 H5 H6 UL OL LI BLOCKQUOTE PRE FIGURE FIGCAPTION TABLE TR TD TH DL DT DD DIV SECTION ARTICLE HR BR'.split(' '));
function semanticText(node){
 if(!node)return '';
 if(node.nodeType===3)return node.nodeValue;
 const value=[...node.childNodes].map(semanticText).join('');
 return blocks.has(node.tagName)?' '+value+' ':value;
}
const routeFor=file=>config.routes[file]||'/'+file.replace(/index\.html$/,'');
const readFileFor=file=>mode==='production'?routeFor(file).slice(1)+'index.html':file;
const exists=async(file)=>{try{return(await fs.stat(file)).isFile()}catch{return false}};
function schemaNodes(value){
 if(Array.isArray(value))return value.flatMap(schemaNodes);
 if(!value||typeof value!=='object')return[];
 return [value,...Object.values(value).flatMap(schemaNodes)];
}
for(const {file:sourceFile}of pages){
 const file=readFileFor(sourceFile);
 const html=await fs.readFile(path.join(target,file),'utf8');
 const dom=new JSDOM(html),doc=dom.window.document;
 const one=(selector,check)=>{
  const nodes=doc.querySelectorAll(selector);
  if(nodes.length!==1)failure(file,check,`Expected one ${selector}; found ${nodes.length}`);
  return nodes[0];
 };
 const title=plain(one('title','title-count')?.textContent);
 const description=plain(one('meta[name="description"]','description-count')?.content);
 const canonical=one('link[rel="canonical"]','canonical-count')?.getAttribute('href');
 const expected=origin+routeFor(sourceFile);
 const robots=one('meta[name="robots"]','robots-count')?.content||'';
 const viewport=one('meta[name="viewport"]','viewport-count')?.content||'';
 one('h1','h1-count');
 if(!title)failure(file,'title-empty',null);
 if(!description)failure(file,'description-empty',null);
 if(doc.documentElement.lang!=='pt-BR')failure(file,'language',doc.documentElement.lang);
 if(!/width=device-width/.test(viewport))failure(file,'viewport',viewport);
 if(canonical!==expected)failure(file,'canonical-route',{expected,actual:canonical});
 if(/\bnoindex\b/i.test(robots)!==(mode==='preview'))failure(file,'robots-mode',{mode,robots});
 if(mode==='production'&&/nofollow/i.test(robots))failure(file,'robots-follow',robots);
 for(const [key,map,value]of[['title',titleOwners,title],['description',descriptionOwners,description],['canonical',canonicalOwners,canonical]]){
  if(map.has(value))failure(file,`duplicate-${key}`,map.get(value)); else map.set(value,file);
 }
 const social={'og:title':title,'og:description':description,'og:url':canonical,'og:locale':'pt_BR','og:site_name':'United Idiomas'};
 for(const[key,expectedValue]of Object.entries(social)){
  const actual=one(`meta[property="${key}"]`,`${key}-count`)?.content;
  if(actual!==expectedValue)failure(file,`${key}-parity`,{expected:expectedValue,actual});
 }
 if(one('meta[name="twitter:card"]','twitter-card-count')?.content!=='summary_large_image')failure(file,'twitter-card',null);
 const socialImage=one('meta[property="og:image"]','og-image-count')?.content;
 const twitterImage=one('meta[name="twitter:image"]','twitter-image-count')?.content;
 if(twitterImage!==socialImage)failure(file,'social-image-parity',{socialImage,twitterImage});
 if(!one('meta[property="og:image:alt"]','og-image-alt-count')?.content)failure(file,'social-image-alt',null);
 for(const key of ['width','height'])if(!(Number(one(`meta[property="og:image:${key}"]`,`og-image-${key}-count`)?.content)>0))failure(file,`og-image-${key}`,null);
 try{
  const url=new URL(socialImage);
  if(url.origin!==origin)failure(file,'social-image-host',url.origin);
  if(!await exists(path.join(target,decodeURIComponent(url.pathname))))failure(file,'social-image-file',url.pathname);
 }catch(error){failure(file,'social-image-url',String(error));}
 const nodes=[];
 for(const el of doc.querySelectorAll('script[type="application/ld+json"]')){
  try{nodes.push(...schemaNodes(JSON.parse(el.textContent)))}catch(error){failure(file,'json-ld',String(error))}
 }
 if(!nodes.length)failure(file,'schema-missing',null);
 for(const n of nodes){
  for(const key of ['url','@id'])if(typeof n[key]==='string'&&/^https?:\/\/(www\.)?unitedidiomas\.com\//.test(n[key])&&!n[key].startsWith(origin+'/'))failure(file,'schema-host',{key,value:n[key]});
 }
 const article=nodes.find(n=>n['@type']==='BlogPosting');
 if(article){
  for(const key of ['headline','datePublished','author','publisher','image'])if(!article[key])failure(file,'article-field',key);
  if(article.url!==canonical)failure(file,'article-url',article.url);
  if(article.image!==socialImage)failure(file,'article-image',article.image);
  if(plain(article.headline)!==plain(doc.querySelector('h1').textContent))failure(file,'article-headline',article.headline);
  if(article.dateModified&&Date.parse(article.dateModified)<Date.parse(article.datePublished))failure(file,'article-date-order',{published:article.datePublished,modified:article.dateModified});
 }
 const breadcrumb=nodes.find(n=>n['@type']==='BreadcrumbList');
 if(sourceFile!=='home/index.html'&&!breadcrumb)failure(file,'breadcrumb-schema',null);
 if(breadcrumb){
  const items=breadcrumb.itemListElement||[];
  if(items.some((item,i)=>item.position!==i+1||!item.name||!item.item))failure(file,'breadcrumb-items',items);
  if(items.at(-1)?.item!==canonical)failure(file,'breadcrumb-canonical',items.at(-1));
 }
 const faq=nodes.find(n=>n['@type']==='FAQPage');
 if(faq){
  const visible=plain(semanticText(doc.querySelector('main')));
  for(const q of faq.mainEntity||[])if(!visible.includes(plain(q.name))||!visible.includes(plain(q.acceptedAnswer?.text)))failure(file,'faq-visible-parity',q.name);
 }
 const ids=[...doc.querySelectorAll('[id]')].map(el=>el.id);
 if(new Set(ids).size!==ids.length)failure(file,'duplicate-id',ids.filter((id,i)=>ids.indexOf(id)!==i));
 if(mode==='production'&&/(?:127\.0\.0\.1|localhost|file:\/\/|\/Users\/eduardo)/.test(html))failure(file,'local-reference',null);
 // Editorial titles/excerpts are preserved; search engines may shorten them.
 if(title.length>75)warn(file,'long-editorial-title',title.length);
 if(description.length>220)warn(file,'long-editorial-description',description.length);
 inventory.push({file,sourceFile,canonical,title,description,robots,h1:plain(doc.querySelector('h1')?.textContent),schemaTypes:[...new Set(nodes.map(n=>n['@type']).filter(Boolean))],socialImage});
 dom.window.close();
}
if(mode==='preview'){
 const robots=await fs.readFile(path.join(target,'robots.txt'),'utf8');
 if(!/User-agent:\s*\*[\s\S]*Disallow:\s*\//i.test(robots))failure('robots.txt','preview-crawl-policy',robots);
}else{
 const sitemap=await fs.readFile(path.join(target,'sitemap-united-pages.xml'),'utf8');
 const dom=new JSDOM(sitemap,{contentType:'text/xml'});
 const urls=[...dom.window.document.querySelectorAll('url > loc')].map(n=>n.textContent);
 const expected=new Set(inventory.map(n=>n.canonical));
 if(urls.length!==expected.size||new Set(urls).size!==urls.length||urls.some(url=>!expected.has(url)))failure('sitemap-united-pages.xml','sitemap-coverage',{urls:urls.length,pages:expected.size});
 dom.window.close();
 if(await exists(path.join(target,'robots.txt'))){
  const robots=await fs.readFile(path.join(target,'robots.txt'),'utf8');
  if(/^Disallow:\s*\/$/mi.test(robots))failure('robots.txt','production-blocked',null);
 }
}
const result={auditedAt:new Date().toISOString(),mode,target,pages:inventory.length,passed:errors.length===0,errors,warnings,inventory,notes:['Long original editorial titles and excerpts are retained; they are warnings, not invalid SEO.','Preview remains noindex. Production URL inspection and existing-server robots policy must be verified after integration.','This audit validates source structure, not Google ranking or real-user Core Web Vitals.']};
const report=path.resolve(options.report||path.join(packageRoot,'reports',`seo-${mode}.json`));
await fs.mkdir(path.dirname(report),{recursive:true});await fs.writeFile(report,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({report,pages:result.pages,passed:result.passed,errors,warnings:warnings.length},null,2));
if(errors.length)process.exitCode=1;
