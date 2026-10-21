#!/usr/bin/env node
// Read-only HTTP checks after integration. Never deploys or changes the server.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(await fs.readFile(path.join(root,'release.config.json'),'utf8'));
const build=JSON.parse(await fs.readFile(path.join(root,'reports/production-build.json'),'utf8'));
let origin=config.origin,all=false;
for(let i=2;i<process.argv.length;i++){
 if(process.argv[i]==='--all')all=true;
 else if(process.argv[i]==='--origin'&&process.argv[i+1])origin=new URL(process.argv[++i]).origin;
 else throw new Error(`Unsupported option ${process.argv[i]}`);
}
if(!/^https:\/\/(www\.)?unitedidiomas\.com$/.test(origin))throw new Error('This checker is limited to the official HTTPS United domain.');
const expectedOrigin=new URL(config.origin).origin;
const errors=[],warnings=[],pages=[];
const routes=Object.values(build.routes);
const sample=['/','/cursos/live-class/','/cursos/business/','/cursos/full/','/quem-somos/','/faq/','/blog/','/blog/pagina/2/','/blog/united-valor-o-globo-live-class-2/'];
const chosen=all?routes:sample.filter(route=>routes.includes(route));
async function read(url){
 const chain=[];
 for(let i=0;i<6;i++){
  const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'User-Agent':'United-Release-Check/1.0 (read-only QA)'}});
  chain.push({url,status:response.status});
  if([301,302,303,307,308].includes(response.status)){
   const location=response.headers.get('location');
   if(!location)throw new Error('Redirect without Location');
   await response.body?.cancel();
   url=new URL(location,url).href;continue;
  }
  return {chain,url,status:response.status,headers:Object.fromEntries(response.headers),text:await response.text()};
 }
 throw new Error('Redirect chain exceeds five redirects');
}
for(const route of chosen){
 try{
  const result=await read(origin+route);
  const dom=new JSDOM(result.text),d=dom.window.document;
  const canonical=d.querySelector('link[rel=canonical]')?.href;
  const robots=d.querySelector('meta[name=robots]')?.content||'';
  if(result.status!==200)errors.push({route,check:'status',actual:result.status});
  if(result.url!==expectedOrigin+route)errors.push({route,check:'final-url',actual:result.url,expected:expectedOrigin+route});
  if(canonical!==expectedOrigin+route)errors.push({route,check:'canonical',actual:canonical});
  if(/noindex/i.test(robots+' '+(result.headers['x-robots-tag']||'')))errors.push({route,check:'noindex',actual:{meta:robots,header:result.headers['x-robots-tag']}});
  if(result.chain.length>2)warnings.push({route,check:'redirect-chain',chain:result.chain});
  pages.push({route,status:result.status,finalURL:result.url,canonical,robots,xRobotsTag:result.headers['x-robots-tag']||null,chain:result.chain});
  dom.window.close();
 }catch(error){errors.push({route,check:'request',message:String(error)});}
}
const resources={};
for(const route of ['/robots.txt','/sitemap-united-pages.xml']){
 try{
  const result=await read(origin+route);resources[route]={status:result.status,finalURL:result.url,chain:result.chain};
  if(result.status!==200)errors.push({route,check:'status',actual:result.status});
  if(route==='/robots.txt'){
   // A global rule inside a training-only bot group can be intentional; do not
   // mistake it for a site-wide block without inspecting the applicable group.
   if(/^Disallow:\s*\/$/mi.test(result.text))warnings.push({route,check:'disallow-group-review',message:'A Disallow / rule exists; inspect the applicable user-agent group and Allow exceptions.'});
   if(!result.text.includes(expectedOrigin+'/sitemap-united-pages.xml'))warnings.push({route,check:'sitemap-reference',message:'Candidate sitemap not referenced; verify whether included in an existing sitemap index.'});
  }else{
   const dom=new JSDOM(result.text,{contentType:'text/xml'}),doc=dom.window.document;
   const urls=[...doc.querySelectorAll('url > loc')].map(n=>n.textContent);
   const expected=new Set(routes.map(route=>expectedOrigin+route));
   if(urls.length!==expected.size||urls.some(url=>!expected.has(url)))errors.push({route,check:'sitemap-coverage',actual:urls.length,expected:expected.size});
   resources[route].urls=urls.length;
   dom.window.close();
  }
 }catch(error){errors.push({route,check:'request',message:String(error)});}
}
const report={checkedAt:new Date().toISOString(),origin,scope:all?'all candidate pages':'representative sample',passed:errors.length===0,pages,resources,errors,warnings,notes:['This checker uses a normal QA user agent, not a spoofed search bot. Validate verified crawler access separately in Search Console/Bing and server logs.','No form was submitted. No remote state changed.']};
await fs.mkdir(path.join(root,'reports'),{recursive:true});await fs.writeFile(path.join(root,'reports/publication-http.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,pages:pages.length,errors,warnings},null,2));
if(errors.length)process.exitCode=1;
