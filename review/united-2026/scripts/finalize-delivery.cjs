#!/usr/bin/env node
/* Finalize an isolated exported site; never the editable package or production PHP. */
'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {gzipSync} = require('node:zlib');
const parse5 = require('parse5');
const postcss = require('postcss');
const values = require('postcss-value-parser');
const parseSrcset = require('parse-srcset');
const {minify: minifyHTML} = require('html-minifier-terser');
let esbuild;
try { esbuild = require('united-esbuild'); }
catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND' || !error.message.includes("'united-esbuild'")) throw error;
  esbuild = require('esbuild');
}
const BUNDLE = /^(page-[a-z0-9-]+)-[a-f0-9]{12}\.css$/i;
const LOAD_LINKS = new Set(['stylesheet', 'preload', 'modulepreload', 'prefetch', 'icon', 'apple-touch-icon', 'apple-touch-icon-precomposed', 'mask-icon', 'manifest']);
const TARGETS = ['safari12', 'chrome80', 'firefox78'];
const PACKAGE = path.resolve(__dirname, '..');
const hash = value => createHash('sha256').update(value).digest('hex');
const within = (file, root) => file === root || file.startsWith(root + path.sep);
const external = value => /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value);
const cssEscape = value => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\n\r\f]/g, char => '\\' + char.codePointAt(0).toString(16) + ' ');
const cssDecode = value => value.replace(/\\(?:\r\n|[\n\r\f])/g, '').replace(/\\([\da-f]{1,6})(?:\r\n|[\t\n\f\r ])?|\\([^\n\r\f])/gi, (_, hex, char) => {
  if (!hex) return char;
  const number = parseInt(hex, 16);
  return String.fromCodePoint(number && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff) ? number : 0xfffd);
});

async function filesIn(root) {
  const files = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, {withFileTypes:true})) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Symlink refused: ' + file);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) files.push(file);
    }
  }
  await visit(root);
  return files.sort();
}

function versionQuery(value, version) {
  const fragmentAt = value.indexOf('#');
  const fragment = fragmentAt < 0 ? '' : value.slice(fragmentAt);
  const main = fragmentAt < 0 ? value : value.slice(0, fragmentAt);
  const queryAt = main.indexOf('?');
  const pathname = queryAt < 0 ? main : main.slice(0, queryAt);
  const parameters = queryAt < 0 ? [] : main.slice(queryAt + 1).split('&').filter(Boolean);
  let found = false;
  const next = parameters.flatMap(parameter => {
    let name;
    try { name = decodeURIComponent(parameter.split('=')[0].replace(/\+/g, ' ')); }
    catch { return [parameter]; }
    if (name !== 'v') return [parameter];
    if (found) return [];
    found = true;
    return ['v=' + encodeURIComponent(version)];
  });
  if (!found) next.push('v=' + encodeURIComponent(version));
  return pathname + '?' + next.join('&') + fragment;
}

function walkHTML(node, callback) {
  callback(node);
  for (const child of node.childNodes || []) walkHTML(child, callback);
  if (node.content) walkHTML(node.content, callback);
}

async function finalizeDelivery(site, {version='2'} = {}) {
  version = String(version);
  if (!/^[1-9][0-9]{0,8}$/.test(version)) throw new Error('Asset version must contain 1 to 9 digits and start above zero.');
  if (esbuild.version !== '0.25.12') throw new Error('Use the reviewed esbuild version 0.25.12.');
  site = path.resolve(site);
  for (let current = site; ; current = path.dirname(current)) {
    if ((await fs.lstat(current)).isSymbolicLink()) throw new Error('Symlink refused: ' + current);
    if (current === path.dirname(current)) break;
  }
  const root = await fs.realpath(site);
  let repository = PACKAGE;
  for (let current = PACKAGE; current !== path.dirname(current); current = path.dirname(current)) {
    try { await fs.lstat(path.join(current, '.git')); repository = current; break; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (within(root, repository) || within(repository, root)) throw new Error('Finalize only a copied export outside the source repository.');
  if (path.basename(root) !== 'site') throw new Error('Expected the exported site/ directory.');
  const files = await filesIn(root), inventory = new Set(files), original = new Map();
  for (const file of files) if (/\.(?:css|js|html)$/i.test(file)) original.set(file, await fs.readFile(file));
  const output = new Map(), renamed = new Map(), cssPending = new Set();
  let references = 0;

  function resolveLocal(value, owner) {
    value = value.trim();
    if (!value || external(value)) return null;
    const pathname = value.split(/[?#]/)[0];
    if (!pathname) return null;
    let decoded;
    try { decoded = decodeURIComponent(pathname); } catch { throw new Error('Invalid URL escape in ' + owner + ': ' + value); }
    if (decoded.includes('\\') || decoded.includes('\0')) throw new Error('Invalid local asset URL: ' + value);
    const target = path.resolve(decoded.startsWith('/') ? root : path.dirname(owner), decoded.startsWith('/') ? '.' + decoded : decoded);
    if (!within(target, root) || !inventory.has(target)) throw new Error('Missing or escaping local asset in ' + path.relative(root, owner) + ': ' + value);
    return target;
  }
  function rewriteURL(value, owner) {
    const target = resolveLocal(value, owner);
    if (!target) return value;
    if (BUNDLE.test(path.basename(target))) finishCSS(target);
    let next = value.trim();
    const replacement = renamed.get(target);
    if (replacement && replacement !== target) {
      const end = next.search(/[?#]/), pathname = end < 0 ? next : next.slice(0, end);
      next = pathname.slice(0, pathname.lastIndexOf('/') + 1) + path.basename(replacement) + (end < 0 ? '' : next.slice(end));
    }
    references++;
    return versionQuery(next, version);
  }
  function rewriteCSSValue(value, owner, isImport=false) {
    const tree = values(value);
    if (isImport) {
      const first = tree.nodes.find(node => !['space', 'comment'].includes(node.type));
      if (first?.type === 'string') {
        const decoded = cssDecode(first.value), next = rewriteURL(decoded, owner);
        if (next !== decoded) { first.value = cssEscape(next); first.quote = '"'; }
      }
    }
    tree.walk(node => {
      if (node.type !== 'function') return;
      const name = node.value.toLowerCase();
      if (name === 'url') {
        const parts = node.nodes.filter(part => !['space', 'comment'].includes(part.type));
        if (parts.length !== 1 || !['word', 'string'].includes(parts[0].type)) throw new Error('Unsupported CSS url() in ' + owner);
        const decoded = cssDecode(parts[0].value), next = rewriteURL(decoded, owner);
        if (next !== decoded) node.nodes = [{type:'string', quote:'"', value:cssEscape(next)}];
        return false;
      }
      if (name === 'image-set' || name === '-webkit-image-set') for (const part of node.nodes) {
        if (part.type !== 'string') continue;
        const decoded = cssDecode(part.value), next = rewriteURL(decoded, owner);
        if (next !== decoded) { part.value = cssEscape(next); part.quote = '"'; }
      }
    });
    return tree.toString();
  }
  function minCSS(text, owner, declaration=false) {
    const tree = postcss.parse(declaration ? 'x{' + text + '}' : text, {from:owner, map:false});
    tree.walkDecls(decl => { decl.value = rewriteCSSValue(decl.value, owner); });
    tree.walkAtRules(rule => { rule.params = rewriteCSSValue(rule.params, owner, rule.name.toLowerCase() === 'import'); });
    const result = esbuild.transformSync(tree.toString(), {loader:'css', minify:true, legalComments:'inline', target:TARGETS, logLevel:'silent'});
    if (result.warnings.length) throw new Error('CSS warnings in ' + owner + ': ' + result.warnings.map(w => w.text).join('; '));
    const css = result.code.trim();
    return declaration ? css.slice(css.indexOf('{') + 1, css.lastIndexOf('}')) : css + '\n';
  }
  function finishCSS(file) {
    if (output.has(file)) return;
    if (cssPending.has(file)) throw new Error('Cyclic hashed CSS dependency: ' + file);
    cssPending.add(file);
    const css = minCSS(original.get(file).toString('utf8'), file);
    const match = path.basename(file).match(BUNDLE);
    if (match) renamed.set(file, path.join(path.dirname(file), match[1] + '-' + hash(css).slice(0, 12) + '.css'));
    output.set(file, Buffer.from(css));
    cssPending.delete(file);
  }
  for (const file of original.keys()) if (/\.css$/i.test(file)) finishCSS(file);
  for (const [file, source] of original) if (/\.js$/i.test(file)) {
    // Whitespace-only minification preserves function/global names without
    // injecting keepNames helpers on every repeated finalization pass.
    const result = esbuild.transformSync(source.toString('utf8'), {loader:'js', minifyWhitespace:true, minifySyntax:false, minifyIdentifiers:false, legalComments:'inline', target:TARGETS, logLevel:'silent'});
    if (result.warnings.length) throw new Error('JS warnings in ' + file + ': ' + result.warnings.map(w => w.text).join('; '));
    output.set(file, Buffer.from(result.code));
  }
  function rewriteSrcset(value, file) {
    const candidates = parseSrcset(value);
    if (!candidates.length && value.trim()) throw new Error('Invalid srcset in ' + file);
    return candidates.map(candidate => rewriteURL(candidate.url, file) +
      (candidate.w !== undefined ? ' ' + candidate.w + 'w' : '') +
      (candidate.h !== undefined ? ' ' + candidate.h + 'h' : '') +
      (candidate.d !== undefined ? ' ' + candidate.d + 'x' : '')).join(', ');
  }
  for (const [file, buffer] of original) if (/\.html$/i.test(file)) {
    const text = buffer.toString('utf8'), patches = [], document = parse5.parse(text, {sourceCodeLocationInfo:true, scriptingEnabled:false});
    const base = file;
    walkHTML(document, node => {
      if (node.tagName === 'base' && node.attrs.some(attr => attr.name === 'href')) throw new Error('Unsupported base href in exported HTML: ' + file);
      if (!node.attrs) return;
      const attributes = Object.fromEntries(node.attrs.map(attr => [attr.name, attr.value]));
      const rel = new Set((attributes.rel || '').toLowerCase().split(/\s+/));
      for (const attr of node.attrs) {
        const name = attr.prefix ? attr.prefix + ':' + attr.name : attr.name;
        let next = attr.value;
        if (attr.name === 'style') next = minCSS(attr.value, base, true);
        else if (['srcset', 'imagesrcset'].includes(attr.name)) next = rewriteSrcset(attr.value, base);
        else if (['src', 'poster'].includes(attr.name) || (attr.name === 'data' && node.tagName === 'object') ||
          (attr.name === 'href' && ((node.tagName === 'link' && [...rel].some(value => LOAD_LINKS.has(value))) ||
            ['image', 'use', 'feImage'].includes(node.tagName)))) {
          if (attributes.integrity && resolveLocal(attr.value, base)) throw new Error('Local integrity attribute needs explicit hash review before minification: ' + file);
          next = rewriteURL(attr.value, base);
        }
        if (next !== attr.value) {
          const location = node.sourceCodeLocation?.attrs?.[name];
          if (!location) throw new Error('Missing HTML attribute location: ' + file);
          patches.push({start:location.startOffset, end:location.endOffset, text:name + '="' + next.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"'});
        }
      }
      if (node.tagName === 'style' && node.sourceCodeLocation?.startTag && node.sourceCodeLocation?.endTag) {
        const start = node.sourceCodeLocation.startTag.endOffset, end = node.sourceCodeLocation.endTag.startOffset;
        patches.push({start, end, text:minCSS(text.slice(start, end), base).trim()});
      }
    });
    patches.sort((a,b) => b.start - a.start);
    let html = text, boundary = text.length;
    for (const patch of patches) {
      if (patch.end > boundary) throw new Error('Overlapping HTML transformations: ' + file);
      html = html.slice(0, patch.start) + patch.text + html.slice(patch.end);
      boundary = patch.start;
    }
    html = await minifyHTML(html, {
      collapseWhitespace:true, conservativeCollapse:true, collapseInlineTagWhitespace:false,
      removeComments:true, removeAttributeQuotes:false, removeOptionalTags:false,
      removeEmptyAttributes:false, removeRedundantAttributes:false, removeScriptTypeAttributes:false,
      removeStyleLinkTypeAttributes:false, sortAttributes:false, sortClassName:false,
      keepClosingSlash:true, minifyJS:false, minifyCSS:false, decodeEntities:false,
      ignoreCustomFragments:[/<svg\b[\s\S]*?<\/svg\s*>/gi, /<script\b[\s\S]*?<\/script\s*>/gi, /<pre\b[\s\S]*?<\/pre\s*>/gi, /<textarea\b[\s\S]*?<\/textarea\s*>/gi],
    });
    output.set(file, Buffer.from(html.trim() + '\n'));
  }
  // Finish all parsing and validate destination names before modifying the export.
  const targets = new Set();
  for (const file of output.keys()) {
    const target = renamed.get(file) || file;
    if (targets.has(target) || (target !== file && inventory.has(target))) throw new Error('CSS output collision: ' + target);
    targets.add(target);
  }
  const report = {format:'united-delivery-optimization-v1', assetVersion:version, assetReferences:references,
    minifiers:{esbuild:esbuild.version, htmlMinifierTerser:'7.2.0', postcss:'8.5.28'},
    types:{html:{files:0, bytesBefore:0, bytesAfter:0, gzipBefore:0, gzipAfter:0}, css:{files:0, bytesBefore:0, bytesAfter:0, gzipBefore:0, gzipAfter:0}, js:{files:0, bytesBefore:0, bytesAfter:0, gzipBefore:0, gzipAfter:0}}, files:[], renamed:[]};
  for (const [file, after] of output) {
    const before = original.get(file), target = renamed.get(file) || file, type = path.extname(file).slice(1).toLowerCase();
    const entry = {pathBefore:path.relative(root, file).split(path.sep).join('/'), pathAfter:path.relative(root, target).split(path.sep).join('/'), type,
      bytesBefore:before.length, bytesAfter:after.length, gzipBefore:gzipSync(before, {level:9}).length, gzipAfter:gzipSync(after, {level:9}).length, sha256:hash(after)};
    report.files.push(entry);
    report.types[type].files++;
    for (const key of ['bytesBefore', 'bytesAfter', 'gzipBefore', 'gzipAfter']) report.types[type][key] += entry[key];
    if (target !== file) report.renamed.push({from:entry.pathBefore, to:entry.pathAfter});
  }
  for (const [file, after] of output) await fs.writeFile(renamed.get(file) || file, after);
  for (const [file, target] of renamed) if (file !== target) await fs.unlink(file);
  return report;
}

module.exports = {finalizeDelivery, versionQuery};
if (require.main === module) {
  (async () => {
    const options = {version:'2'};
    let site;
    for (let index = 2; index < process.argv.length; index++) {
      const option = process.argv[index];
      if (!['--site', '--version'].includes(option) || !process.argv[index + 1] || process.argv[index + 1].startsWith('--')) throw new Error('Usage: finalize-delivery.cjs --site <export/site> [--version 2]');
      const value = process.argv[++index];
      if (option === '--site') site = value; else options.version = value;
    }
    if (!site) throw new Error('--site is required.');
    process.stdout.write(JSON.stringify(await finalizeDelivery(site, options), null, 2) + '\n');
  })().catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
}
