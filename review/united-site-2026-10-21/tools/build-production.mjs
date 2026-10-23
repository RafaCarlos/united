// Generates a production candidate locally. Does not publish or run Git.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const { minify } = require('html-minifier-terser');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await fs.readFile(path.join(root, 'release.config.json'), 'utf8'));
const origin = new URL(config.origin).origin;
if (!/^https:\/\/(?:www\.)?unitedidiomas\.com$/.test(origin)) throw new Error('Production origin must be the configured HTTPS United domain.');
const preview = path.join(root, 'preview');
const output = path.join(root, 'dist');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'reports/preview-build.json'), 'utf8'));
const files = new Set(manifest.files.map(f => f.name));
const entries = new Set(manifest.entries);
const routes = new Map([...entries].map(file => [file, config.routes[file] || '/' + file.replace(/index\.html$/, '')]));
if (new Set(routes.values()).size !== routes.size) throw new Error('Duplicate production routes');
for (const route of routes.values()) if (!route.startsWith('/') || !route.endsWith('/') || /[?#\\]|\.\./.test(route)) throw new Error(`Invalid production route: ${route}`);
// A future article must not become public merely because it was previewed.
// These explicit approvals affect this local candidate only; no deploy occurs.
const editorial = JSON.parse(await fs.readFile(path.join(root, 'src/blog/editorial/articles.json'), 'utf8'));
const release = JSON.parse(await fs.readFile(path.join(root, 'src/tools/united-release.json'), 'utf8'));
const approvals = new Set(config.approvedEditorialSlugs || []);
const includedEditorial = [release, ...editorial].filter(article => entries.has(`blog/${article.slug}/index.html`));
for (const article of includedEditorial) if (article.status !== 'published' && !approvals.has(article.slug)) throw new Error(`Editorial preview requires explicit release approval: ${article.slug}`);
const mapped = file => routes.has(file) ? routes.get(file) + 'index.html' : file;
const publicURL = file => routes.has(file) ? routes.get(file) : '/' + file;
const sameHost = url => /^(www\.)?unitedidiomas\.com$/i.test(url.hostname);
function normalizeExternal(value) {
  try { const url = new URL(value); if (sameHost(url)) return origin + url.pathname + url.search + url.hash; } catch {}
  return value;
}
function localURL(owner, value) {
  if (!value || /^(#|data:|mailto:|tel:|javascript:)/i.test(value)) return value;
  if (/^(https?:)?\/\//i.test(value)) return normalizeExternal(value);
  const url = new URL(value, 'https://preview.invalid/' + owner);
  let file = decodeURIComponent(url.pathname).slice(1);
  if (!files.has(file) && files.has(file + 'index.html')) file += 'index.html';
  if (!files.has(file) && files.has(file + '/index.html')) file += '/index.html';
  if (!files.has(file)) throw new Error(`Missing reference: ${owner} -> ${value}`);
  return publicURL(file) + url.search + url.hash;
}
function cssURLs(owner, text) {
  return text.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (_, quote, url) => `url("${localURL(owner, url)}")`);
}
function normalizeJSON(value) {
  if (typeof value === 'string') return normalizeExternal(value);
  if (Array.isArray(value)) return value.map(normalizeJSON);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,normalizeJSON(v)]));
  return value;
}
let previousFiles = [];
try {
  const marker = JSON.parse(await fs.readFile(path.join(output, '.united-release.json'), 'utf8'));
  if (marker.type !== 'united-production-candidate') throw new Error('Output is not a generated release');
  previousFiles = marker.files || [];
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  // Do not overwrite an unrelated existing folder without our release marker.
  try { if ((await fs.readdir(output)).length) throw new Error('Output exists without a generated release marker.'); } catch (readError) { if (readError.code !== 'ENOENT') throw readError; }
}
await fs.mkdir(output, {recursive:true});
async function atomicWrite(destination, data) {
  await fs.mkdir(path.dirname(destination), {recursive:true});
  const temporary = destination + `.tmp-${process.pid}`;
  await fs.writeFile(temporary, data);
  await fs.rename(temporary, destination);
}
const inventory = [];
const prepared = [];
for (const file of files) {
  // Keep the preview crawler block out of production; integration instructions
  // preserve the existing server's robots policy and existing sitemap index.
  if (file === 'robots.txt' || file === 'sitemap.xml') continue;
  let data = await fs.readFile(path.join(preview, file));
  if (file.endsWith('.html')) {
    const dom = new JSDOM(data.toString());
    const doc = dom.window.document;
    for (const el of doc.querySelectorAll('[href],[src],[poster],[data-src]')) {
      for (const attr of ['href','src','poster','data-src']) if (el.hasAttribute(attr)) el.setAttribute(attr,localURL(file,el.getAttribute(attr)));
    }
    for (const el of doc.querySelectorAll('[srcset],[imagesrcset]')) {
      for (const attr of ['srcset','imagesrcset']) if(el.hasAttribute(attr)) el.setAttribute(attr,el.getAttribute(attr).split(',').map(part => {
        const [url,...descriptor] = part.trim().split(/\s+/); return [localURL(file,url),...descriptor].join(' ');
      }).join(', '));
    }
    for (const el of doc.querySelectorAll('[style]')) el.setAttribute('style',cssURLs(file,el.getAttribute('style')));
    for (const el of doc.querySelectorAll('style')) el.textContent = cssURLs(file,el.textContent);
    for (const el of doc.querySelectorAll('[data-url]')) el.setAttribute('data-url',normalizeExternal(el.getAttribute('data-url')));
    if (entries.has(file)) {
      const canonical = origin + routes.get(file);
      doc.querySelector('link[rel="canonical"]').href = canonical;
      doc.querySelector('meta[property="og:url"]').content = canonical;
      doc.querySelector('meta[name="robots"]').content = 'index,follow,max-image-preview:large';
      const cover = doc.querySelector('.article-cover img, .featured-media img');
      // Archive pages without a featured figure retain the approved blog image.
      const social = cover ? new URL(cover.getAttribute('src'), origin).href : normalizeExternal(doc.querySelector('meta[property="og:image"]').content);
      for (const el of doc.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]')) el.content = social;
      if (cover) for (const dimension of ['width', 'height']) {
        const node = doc.querySelector(`meta[property="og:image:${dimension}"]`);
        if (node) node.content = cover.getAttribute(dimension);
      }
      for (const el of doc.querySelectorAll('script[type="application/ld+json"]')) {
        const schema = normalizeJSON(JSON.parse(el.textContent));
        const update = node => {
          if (!node || typeof node !== 'object') return;
          if (node['@type'] === 'BlogPosting') node.image = social;
          Object.values(node).forEach(v => { if(Array.isArray(v)) v.forEach(update); else if (v && typeof v === 'object') update(v); });
        };
        update(schema); el.textContent = JSON.stringify(schema).replace(/</g,'\\u003c');
      }
    }
    data = Buffer.from(await minify(dom.serialize(),{collapseWhitespace:true,conservativeCollapse:true,removeComments:true,minifyCSS:false,minifyJS:false}));
    dom.window.close();
  } else if (file === 'site-navigation.js') {
    // A production build must never redirect a user to a developer's localhost.
    data = Buffer.from(data.toString().replace(/if\(window\.location\.protocol===["']file:["']\)\{.*?(?=const courses=)/s,''));
    if(data.includes('127.0.0.1')) throw new Error('Local preview redirect still present');
  }
  const destination = path.join(output, mapped(file));
  prepared.push({destination,data,html:file.endsWith('.html')});
  inventory.push({file:path.relative(output,destination),bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
}
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + [...routes.values()].map(route=>`  <url><loc>${origin}${route}</loc></url>`).join('\n') + '\n</urlset>\n';
// Complete transformation/reference checks before touching any previous candidate.
// Assets precede HTML so a local review server does not see missing new resources.
for (const item of prepared.sort((a,b)=>Number(a.html)-Number(b.html))) await atomicWrite(item.destination,item.data);
await atomicWrite(path.join(output,'sitemap-united-pages.xml'),xml);
const currentFiles = [...inventory.map(record=>record.file),'sitemap-united-pages.xml'];
// Remove only files recorded by a previous generated candidate, never the folder.
for (const stale of previousFiles) if (!currentFiles.includes(stale)) {
  const destination=path.resolve(output,stale);
  if (!destination.startsWith(output+path.sep)) throw new Error('Invalid previous release file path');
  await fs.rm(destination,{force:true});
}
await atomicWrite(path.join(output,'.united-release.json'),JSON.stringify({type:'united-production-candidate',version:2,files:currentFiles})+'\n');
await atomicWrite(path.join(root,'reports/production-build.json'),JSON.stringify({origin,pages:routes.size,files:inventory.length,bytes:inventory.reduce((s,f)=>s+f.bytes,0),editorialApproval:includedEditorial.map(article=>({slug:article.slug,status:article.status,explicitlyApproved:approvals.has(article.slug)})),routes:Object.fromEntries(routes),inventory},null,2)+'\n');
console.log(JSON.stringify({output,pages:routes.size,files:inventory.length,bytes:inventory.reduce((s,f)=>s+f.bytes,0)}));
