#!/usr/bin/env node
// Creates a local review artifact only. It never invokes Git, deploys, or serves files.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
function dependency(name) { return require(name); }
const { JSDOM } = dependency('jsdom');
const { minify: minifyHTML } = dependency('html-minifier-terser');
const { minify: minifyJS } = dependency('terser');
const CleanCSS = dependency('clean-css');
const parent = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const options = {};
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--replace') options.replace = true;
  else if (['--source', '--output', '--report'].includes(arg) && process.argv[i + 1]) options[arg.slice(2)] = process.argv[++i];
  else throw new Error(`Unsupported argument: ${arg}`);
}
const source = path.resolve(options.source || path.join(parent, 'live-class-2026-10-09'));
const output = path.resolve(options.output || path.join(parent, 'live-class-2026-10-09-otimizado'));
if (source === output || source.startsWith(output + path.sep) || output.startsWith(source + path.sep)) throw new Error('Source and output must be separate directories.');
const replace = options.replace === true;
const CONFIG = JSON.parse(await fs.readFile(path.join(source, 'navigation.json'), 'utf8'));
if (!Array.isArray(CONFIG.pages) || !CONFIG.pages.length) throw new Error('navigation.json must define a non-empty pages array.');
const entries = CONFIG.pages.map((page, index) => {
  const entry = page?.file;
  if (typeof entry !== 'string' || !entry || entry !== entry.trim()
    || !entry.endsWith('.html') || /[\\?#\0]/.test(entry)
    || /^[a-z][a-z\d+.-]*:/i.test(entry) || path.posix.isAbsolute(entry)
    || path.posix.normalize(entry) !== entry
    || entry.split('/').some(part => ['..', 'evidence', 'node_modules', '.git'].includes(part))) {
    throw new Error(`Invalid local HTML entry at navigation.json pages[${index}].file`);
  }
  return entry;
});
if (new Set(entries).size !== entries.length) throw new Error('navigation.json contains duplicate page files.');
const allowedExtensions = new Set(['.html', '.css', '.js', '.json', '.webp', '.jpg', '.jpeg', '.png', '.svg', '.gif', '.avif', '.mp4', '.woff', '.woff2', '.ico', '.txt', '.xml', '.webmanifest']);
const pending = [...entries];
const files = new Map();
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const posix = name => name.split(path.sep).join('/');

// External URLs, data URLs and document fragments remain unchanged.
function localReference(owner, raw) {
  const value = raw.trim();
  if (!value || value.startsWith('#') || value.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(value)) return null;
  const pathname = decodeURIComponent(value.split(/[?#]/, 1)[0]);
  if (!pathname) return null;
  const relative = pathname.startsWith('/') ? pathname.slice(1) : path.posix.join(path.posix.dirname(owner), pathname);
  const normalized = path.posix.normalize(relative);
  if (normalized === '..' || normalized.startsWith('../') || path.posix.isAbsolute(normalized)) throw new Error(`Reference escapes source: ${owner} -> ${raw}`);
  if (normalized.split('/').some(part => ['evidence', 'node_modules', '.git'].includes(part))) throw new Error(`Non-public reference: ${owner} -> ${raw}`);
  return normalized;
}
function enqueue(owner, raw) {
  const relative = localReference(owner, raw);
  if (relative !== null) pending.push(relative);
}
function srcsetReferences(owner, value) {
  for (const item of value.split(',')) enqueue(owner, item.trim().split(/\s+/)[0]);
}
function htmlReferences(owner, text) {
  const dom = new JSDOM(text);
  const document = dom.window.document;
  for (const element of document.querySelectorAll('img[src],script[src],video[src],audio[src],source[src],iframe[src],embed[src]')) enqueue(owner, element.getAttribute('src'));
  for (const element of document.querySelectorAll('[srcset]')) srcsetReferences(owner, element.getAttribute('srcset'));
  for (const element of document.querySelectorAll('video[poster]')) enqueue(owner, element.getAttribute('poster'));
  for (const element of document.querySelectorAll('object[data]')) enqueue(owner, element.getAttribute('data'));
  // Linked local files (for example, testimonial records) are active resources.
  // Do not crawl in-page fragments or directory/navigation links.
  for (const element of document.querySelectorAll('a[href]')) {
    const relative = localReference(owner, element.getAttribute('href'));
    if (relative && allowedExtensions.has(path.posix.extname(relative).toLowerCase())) pending.push(relative);
  }
  for (const element of document.querySelectorAll('link[href]')) {
    const rel = element.getAttribute('rel') || '';
    if (/^(stylesheet|preload|icon|shortcut icon|apple-touch-icon|manifest)$/i.test(rel)) enqueue(owner, element.getAttribute('href'));
    if (element.hasAttribute('imagesrcset')) srcsetReferences(owner, element.getAttribute('imagesrcset'));
  }
  for (const element of document.querySelectorAll('meta[property="og:image"][content],meta[name="twitter:image"][content]')) enqueue(owner, element.getAttribute('content'));
  for (const element of document.querySelectorAll('style')) cssReferences(owner, element.textContent);
  for (const element of document.querySelectorAll('[style]')) cssReferences(owner, element.getAttribute('style'));
  dom.window.close();
}
function cssReferences(owner, text) {
  for (const match of text.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)) enqueue(owner, match[2]);
  for (const match of text.matchAll(/@import\s+['"]([^'"]+)['"]/g)) enqueue(owner, match[1]);
}
async function jsReferences(owner, text) {
  // This allowlist is derived only from literal filenames in active scripts.
  // app.js stores tab images as basenames and prepends assets/ when selected.
  for (const match of text.matchAll(/(['"`])([^\s'"`<>]+\.(?:webp|png|jpe?g|svg|gif|avif|mp4|woff2?|html|css|js|json)(?:[?#][^\s'"`<>]*)?)\1/g)) {
    const raw = match[2];
    // Tag Manager's initialization event is a dataLayer value, not a local file.
    if (owner === 'rdstation-account.js' && raw === 'gtm.js') continue;
    // An interpolated template is not a literal filename. Its literal source
    // dependencies are discovered separately; never interpret ${...} as a path.
    if (match[1] === '`' && raw.includes('${')) continue;
    let relative = localReference(owner, raw);
    if (relative === null) continue;
    if (owner === 'app.js' && !raw.includes('/')) relative = `assets/${raw.split(/[?#]/, 1)[0]}`;
    pending.push(relative);
  }
}
for (const extra of ['robots.txt', 'sitemap.xml', 'assets/brand/united-share-1200x630.png', 'assets/brand/united-logo-512.png']) {
  try { await fs.access(path.join(source, extra)); pending.push(extra); } catch { /* Optional source files. */ }
}
while (pending.length) {
  const relative = pending.shift();
  if (files.has(relative)) continue;
  if (!allowedExtensions.has(path.extname(relative).toLowerCase())) throw new Error(`Unsupported active resource: ${relative}`);
  const absolute = path.join(source, relative);
  const stat = await fs.lstat(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Active resource is not a regular file: ${relative}`);
  const data = await fs.readFile(absolute);
  files.set(relative, { original: data });
  const text = data.toString('utf8');
  if (relative.endsWith('.html')) htmlReferences(relative, text);
  else if (relative.endsWith('.css')) cssReferences(relative, text);
  else if (relative.endsWith('.js')) await jsReferences(relative, text);
}

// Minify conservatively. Keep selectors, identifiers/properties, all SEO metadata,
// routes, external integrations and deferred/on-demand loading semantics intact.
for (const [relative, record] of files) {
  let result = record.original;
  if (relative.endsWith('.css')) {
    const min = new CleanCSS({ level: 1, rebase: false }).minify(result.toString());
    if (min.errors.length) throw new Error(`${relative}: ${min.errors.join('; ')}`);
    result = Buffer.from(min.styles);
  } else if (relative.endsWith('.js')) {
    const min = await minifyJS(result.toString(), { ecma: 2020, compress: false, mangle: false, format: { comments: false } });
    result = Buffer.from(min.code);
  }
  record.result = result;
  record.hash = sha(result);
}
function versioned(owner, raw) {
  const relative = localReference(owner, raw);
  if (!relative || !/\.(css|js)$/.test(relative)) return raw;
  const dependency = files.get(relative);
  if (!dependency) throw new Error(`Cannot version missing dependency: ${owner} -> ${raw}`);
  const hashIndex = raw.indexOf('#');
  const fragment = hashIndex < 0 ? '' : raw.slice(hashIndex);
  const beforeHash = hashIndex < 0 ? raw : raw.slice(0, hashIndex);
  const queryIndex = beforeHash.indexOf('?');
  const pathname = queryIndex < 0 ? beforeHash : beforeHash.slice(0, queryIndex);
  const query = new URLSearchParams(queryIndex < 0 ? '' : beforeHash.slice(queryIndex + 1));
  query.set('v', dependency.hash.slice(0, 12));
  return `${pathname}?${query.toString()}${fragment}`;
}
function metadata(text) {
  const dom = new JSDOM(text), document = dom.window.document;
  const result = {
    meta: [...document.querySelectorAll('meta')].map(node => Object.fromEntries([...node.attributes].map(attribute => [attribute.name, attribute.value]))),
    robots: [...document.querySelectorAll('meta[name="robots"]')].map(node => node.content),
    canonical: [...document.querySelectorAll('link[rel="canonical"]')].map(node => node.getAttribute('href')),
    title: document.title,
    jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent))
  };
  dom.window.close();
  return result;
}
for (const [relative, record] of files) {
  if (!relative.endsWith('.html')) continue;
  const original = record.original.toString();
  const before = metadata(original);
  if (entries.includes(relative) && !before.robots.some(value => /\bnoindex\b/i.test(value))) throw new Error(`Local preview must remain noindex: ${relative}`);
  // Parse the whole HTML and patch only actual start tags at their source
  // offsets; tag-shaped strings inside scripts are never treated as markup.
  const versionDOM = new JSDOM(original, { includeNodeLocations: true });
  const replacements = [];
  for (const element of versionDOM.window.document.querySelectorAll('script[src],link[href]')) {
    const location = versionDOM.nodeLocation(element);
    const attribute = element.localName === 'script' ? 'src' : 'href';
    const attributeLocation = location?.attrs?.[attribute];
    if (!attributeLocation) continue;
    const url = element.getAttribute(attribute);
    const revisedURL = versioned(relative, url);
    if (url === revisedURL) continue;
    const escaped = revisedURL.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    replacements.push({ ...attributeLocation, updated: `${attribute}="${escaped}"` });
  }
  versionDOM.window.close();
  let versionedHTML = original;
  for (const edit of replacements.sort((left, right) => right.startOffset - left.startOffset)) {
    versionedHTML = versionedHTML.slice(0, edit.startOffset) + edit.updated + versionedHTML.slice(edit.endOffset);
  }
  const minified = await minifyHTML(versionedHTML, { collapseWhitespace: true, conservativeCollapse: true, removeComments: true, removeRedundantAttributes: false, minifyCSS: false, minifyJS: false, keepClosingSlash: true, ignoreCustomFragments: [/<meta\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi] });
  if (JSON.stringify(before) !== JSON.stringify(metadata(minified))) throw new Error(`Metadata changed unexpectedly: ${relative}`);
  record.result = Buffer.from(minified);
  record.hash = sha(record.result);
}
const manifest = {
  type: 'united-local-minified-build', source, output,
  scope: 'Local review only; no Git, deployment, automatic routes or canonical changes.',
  entries, files: [...files].map(([name, record]) => ({ name, sourceBytes: record.original.length, outputBytes: record.result.length, gzipBytes: gzipSync(record.result).length, sha256: record.hash })).sort((a, b) => a.name.localeCompare(b.name))
};
const temporary = `${output}.building-${process.pid}`;
await fs.mkdir(temporary, { recursive: false });
try {
  for (const [relative, record] of files) {
    const target = path.join(temporary, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, record.result);
  }
  const marker = { type: manifest.type, formatVersion: 3, source: path.basename(source), files: [...files.keys()] };
  await fs.writeFile(path.join(temporary, '.local-build-manifest.json'), `${JSON.stringify(marker, null, 2)}\n`);
  let outputExists = false;
  try { await fs.access(output); outputExists = true; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (outputExists) {
    if (!replace) throw new Error('Output already exists. Use --replace only to rebuild this generated local artifact.');
    const prior = JSON.parse(await fs.readFile(path.join(output, '.local-build-manifest.json'), 'utf8'));
    if (prior.type !== manifest.type || ![source, path.basename(source)].includes(prior.source)) throw new Error('Refusing to replace a directory not generated by this build.');
    const priorFiles = prior.files || [];
    if (!Array.isArray(priorFiles) || priorFiles.some(relative => typeof relative !== 'string' || !relative
      || path.isAbsolute(relative) || path.normalize(relative) !== relative
      || relative.split(path.sep).includes('..'))) throw new Error('Invalid generated file in the previous build marker.');
    // Keep the root stable for the running preview and synced folders. Publish
    // assets before HTML, replacing only changed files and never truncating one
    // that the preview server might currently be reading.
    const publishOrder = [...files].sort(([a], [b]) => Number(a.endsWith('.html')) - Number(b.endsWith('.html')));
    for (const [relative, record] of publishOrder) {
      const target = path.join(output, relative);
      let unchanged = false;
      try { unchanged = sha(await fs.readFile(target)) === record.hash; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (unchanged) continue;
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.rename(path.join(temporary, relative), target);
    }
    // Legacy markers did not enumerate files. Preserve unknown files and prune
    // only files recorded by a previous build, after publishing successfully.
    for (const relative of priorFiles) {
      if (!files.has(relative)) await fs.rm(path.join(output, relative), { force: true });
    }
    await fs.rename(path.join(temporary, '.local-build-manifest.json'), path.join(output, '.local-build-manifest.json'));
    await fs.rm(temporary, { recursive: true });
  } else {
    await fs.rename(temporary, output);
  }
} catch (error) {
  await fs.rm(temporary, { recursive: true, force: true });
  throw error;
}
const reportPath = path.resolve(options.report || path.join(parent, 'build-evidence/live-class-minified.json'));
const reportDirectory = path.dirname(reportPath);
await fs.mkdir(reportDirectory, { recursive: true });
await fs.writeFile(reportPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ output, files: files.size, sourceBytes: manifest.files.reduce((sum, file) => sum + file.sourceBytes, 0), outputBytes: manifest.files.reduce((sum, file) => sum + file.outputBytes, 0), report: reportPath }, null, 2));
