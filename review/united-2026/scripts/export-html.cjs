const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('/tmp/united-seo-tools/node_modules/jsdom');
const root=path.resolve(__dirname,'../dist');
const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'));
const d=dom.window.document;
const types={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2','.ico':'image/x-icon'};
const cache=new Map();
function embed(value,base=root){
 if(!value||/^(?:data:|https?:|#|mailto:|tel:)/.test(value))return value;
 const file=path.resolve(base,value.split('?')[0].split('#')[0]);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file))throw new Error('Missing local resource: '+file);
 if(!cache.has(file))cache.set(file,'data:'+(types[path.extname(file).toLowerCase()]||'application/octet-stream')+';base64,'+fs.readFileSync(file).toString('base64'));
 return cache.get(file);
}
d.querySelectorAll('link[rel=stylesheet]').forEach(link=>{
 const file=path.join(root,link.getAttribute('href').split('?')[0]);
 const style=d.createElement('style');
 style.textContent=fs.readFileSync(file,'utf8').replace(/url\(\s*(["']?)([^)"']+)\1\s*\)/g,(all,quote,url)=>'url("'+embed(url.trim(),path.dirname(file))+'")');
 link.replaceWith(style);
});
d.querySelectorAll('[src],[poster],image[href],image[xlink\\:href],link[rel=icon]').forEach(node=>{
 for(const attr of ['src','poster','href','xlink:href']){
  if(node.tagName==='SCRIPT'||!node.hasAttribute(attr))continue;
  node.setAttribute(attr,embed(node.getAttribute(attr)));
 }
});
d.querySelectorAll('script[src]').forEach(script=>{
 const file=path.join(root,script.getAttribute('src').split('?')[0]);
 script.removeAttribute('src');script.textContent=fs.readFileSync(file,'utf8').replace(/<\/script/gi,'<\\/script');
});
const destination=path.resolve(__dirname,'../../entregas-preview/United-Preview-3-Banners.html');
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,dom.serialize());
console.log(JSON.stringify({file:destination,bytes:fs.statSync(destination).size,embeddedAssets:cache.size}));
