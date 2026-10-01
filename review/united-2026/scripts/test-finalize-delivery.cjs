'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const {spawnSync} = require('node:child_process');
const {JSDOM} = require('jsdom');
const parseSrcset = require('parse-srcset');
const {finalizeDelivery, versionQuery} = require('./finalize-delivery.cjs');
const BUNDLE = 'assets/page-home-0123456789ab.css';
const JSONLD = '\n  { "@context": "https://schema.org", "name": "United  Idiomas" }\n';
const JAVASCRIPT = '/*! Copyright United; license MIT */\nvar UnitedAPI = { add: function add(a, b) { return a + b; } };\nfunction greet(name) { return "Olá " + name; }\nglobalThis.result = [UnitedAPI.add(2, 3), greet("Rafa"), greet.name];\n';

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'united-delivery-'));
  const site = path.join(directory, 'site');
  await fs.mkdir(path.join(site, 'assets'), {recursive:true});
  t.after(() => fs.rm(directory, {recursive:true, force:true}));
  const files = {
    [BUNDLE]:'/*! United stylesheet */\n@import "theme.css?lang=pt&v=old";\n.hero { background-image: url("photo.png?x=a%20b&v=old#sample"); }\n@font-face { font-family: Brand; src: url("brand.woff2?#iefix") format("woff2"); }\n.external { background: url(https://example.org/art.png); }\n.inline { background: url("data:image/svg+xml,%3Csvg/%3E"); }\n',
    'assets/theme.css':'.theme { color: rgb(0, 0, 0); background: image-set("photo.png" 1x, "photo@2.png" 2x); }\n',
    'assets/app.js':JAVASCRIPT,
    'assets/photo.png':'image-placeholder', 'assets/photo@2.png':'second-image',
    'assets/brand.woff2':'font-placeholder', 'assets/sprite.svg':'<svg xmlns="http://www.w3.org/2000/svg"><path id="shape" d="M0 0h1"/></svg>',
    'index.html':`<!DOCTYPE html>\n<html lang="pt-BR"><head><title>United Idiomas</title>
      <link rel="canonical" href="https://www.unitedidiomas.com/">
      <meta property="og:image" content="/assets/photo.png">
      <link rel="stylesheet" href="${BUNDLE}">
      <link rel="preload" as="style" href="${BUNDLE}">
      <link rel="preload" as="image" href="assets/photo.png" imagesrcset="assets/photo.png 1x, assets/photo@2.png 2x">
      <link rel="icon" href="assets/photo.png#icon">
      <noscript><link rel="stylesheet" href="${BUNDLE}"></noscript>
      <style>.inline { background: url('assets/photo.png'); }</style>
      <script type="application/ld+json">${JSONLD}</script>
      </head><body><h1>United</h1><p>Olá <strong>mundo</strong> hoje.</p>
      <a href="/cursos/?origem=home#online">Curso</a>
      <a href="https://api.whatsapp.com/send?phone=5511111111111&text=Ol%C3%A1">WhatsApp</a>
      <form id="lead" action="/submit.php" method="post"><label for="nome">Nome</label><input id="nome" name="nome" required>
      <textarea name="message"> Linha 1\n   Linha 2  </textarea><button type="submit">Enviar</button></form>
      <pre>  a   b\n    c  </pre><div style="background-image: url('assets/photo.png')">Foto</div>
      <img id="photo" src="assets/photo.png?foo=a%20b&v=one&v=two#pic" srcset="data:image/png;base64,AAAA 1x, assets/photo@2.png 2x" alt="United">
      <video poster="assets/photo.png"></video>
      <svg viewBox="0 0 100 50"><text xml:space="preserve">A   B</text><image href="assets/photo.png"/><use xlink:href="assets/sprite.svg#shape"/><use href="#shape"/></svg>
      <script src="assets/app.js?feature=yes#code" defer></script>
      <script src="https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js" async></script>
      <script> globalThis.order = "keep  two  spaces"; </script>
      </body></html>`,
  };
  for (const [file, text] of Object.entries(files)) await fs.writeFile(path.join(site, file), text);
  return {site, files};
}
async function snapshot(root) {
  const files = {};
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, {withFileTypes:true})) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else files[path.relative(root, file)] = (await fs.readFile(file)).toString('base64');
    }
  }
  await walk(root);
  return files;
}

test('versioning is idempotent and preserves query values and fragments', () => {
  assert.equal(versionQuery('photo.png?foo=a%20b&v=one&v=two#pic', '2'), 'photo.png?foo=a%20b&v=2#pic');
  assert.equal(versionQuery('photo.png?v=2#pic', '2'), 'photo.png?v=2#pic');
});

test('HTML, CSS, preloads and noscript share versioned local URLs without changing navigation or forms', async t => {
  const {site, files} = await fixture(t);
  const report = await finalizeDelivery(site);
  const html = await fs.readFile(path.join(site, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {runScripts:'outside-only'}), document = dom.window.document;
  t.after(() => dom.window.close());
  const bundled = report.renamed.find(item => item.from === BUNDLE).to;
  const css = await fs.readFile(path.join(site, bundled), 'utf8');
  const digest = createHash('sha256').update(css).digest('hex').slice(0, 12);
  assert.ok(bundled.endsWith('-' + digest + '.css'));
  assert.equal(document.querySelector('link[rel="stylesheet"]').getAttribute('href'), bundled + '?v=2');
  assert.equal(document.querySelector('link[as="style"]').getAttribute('href'), bundled + '?v=2');
  assert.ok(html.includes('<noscript><link rel="stylesheet" href="' + bundled + '?v=2">'));
  assert.match(css, /theme\.css\?lang=pt&v=2/);
  assert.match(css, /photo\.png\?x=a%20b&v=2#sample/);
  assert.match(css, /brand\.woff2\?v=2#iefix/);
  assert.match(css, /https:\/\/example\.org\/art\.png/);
  assert.match(css, /data:image\/svg\+xml/);
  assert.match(await fs.readFile(path.join(site, 'assets/theme.css'), 'utf8'), /photo@2\.png\?v=2/);
  assert.equal(document.querySelector('#photo').getAttribute('src'), 'assets/photo.png?foo=a%20b&v=2#pic');
  assert.deepEqual(parseSrcset(document.querySelector('#photo').getAttribute('srcset')).map(item => ({url:item.url, d:item.d || 1})), [
    {url:'data:image/png;base64,AAAA', d:1}, {url:'assets/photo@2.png?v=2', d:2},
  ]);
  assert.equal(document.querySelector('link[as="image"]').getAttribute('imagesrcset'), 'assets/photo.png?v=2 1x, assets/photo@2.png?v=2 2x');
  assert.equal(document.querySelector('video').getAttribute('poster'), 'assets/photo.png?v=2');
  assert.equal(document.querySelector('image').getAttribute('href'), 'assets/photo.png?v=2');
  assert.equal(document.querySelector('use').getAttribute('xlink:href'), 'assets/sprite.svg?v=2#shape');
  assert.equal(document.querySelectorAll('use')[1].getAttribute('href'), '#shape');
  assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://www.unitedidiomas.com/');
  assert.equal(document.querySelector('[property="og:image"]').content, '/assets/photo.png');
  assert.equal(document.querySelector('a').getAttribute('href'), '/cursos/?origem=home#online');
  assert.equal(document.querySelectorAll('a')[1].getAttribute('href'), 'https://api.whatsapp.com/send?phone=5511111111111&text=Ol%C3%A1');
  assert.equal(document.querySelector('#lead').getAttribute('action'), '/submit.php');
  assert.equal(document.querySelector('#nome').name, 'nome');
  assert.equal(document.querySelector('#nome').required, true);
  assert.equal(document.querySelector('p').textContent, 'Olá mundo hoje.');
  assert.equal(document.querySelector('textarea').value, ' Linha 1\n   Linha 2  ');
  assert.equal(document.querySelector('pre').textContent, '  a   b\n    c  ');
  assert.equal(document.querySelector('svg text').textContent, 'A   B');
  assert.ok(html.includes(JSONLD));
  const scripts = [...document.querySelectorAll('script[src]')];
  assert.equal(scripts[0].getAttribute('src'), 'assets/app.js?feature=yes&v=2#code');
  assert.equal(scripts[0].hasAttribute('defer'), true);
  assert.equal(scripts[1].getAttribute('src'), 'https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js');
  assert.equal(scripts[1].hasAttribute('async'), true);
  assert.ok(html.includes(' globalThis.order = "keep  two  spaces"; '));
  assert.equal(await fs.readFile(path.join(site, 'assets/photo.png'), 'utf8'), files['assets/photo.png']);
  assert.equal(report.assetVersion, '2');
  assert.equal(report.types.css.files, 2);
  assert.ok(report.types.html.bytesAfter < report.types.html.bytesBefore);
  for (const item of Object.values(report.types)) assert.ok(item.bytesBefore > 0 && item.gzipAfter > 0);
});

test('minified JavaScript keeps global names, behavior and license; the second pass changes no files', async t => {
  const {site} = await fixture(t);
  await finalizeDelivery(site);
  const source = await fs.readFile(path.join(site, 'assets/app.js'), 'utf8');
  const before = {}, after = {};
  vm.runInNewContext(JAVASCRIPT, before);
  vm.runInNewContext(source, after);
  assert.deepEqual([...after.result], [...before.result]);
  assert.equal(after.UnitedAPI.add(20, 3), 23);
  assert.equal(after.greet.name, 'greet');
  assert.ok(source.includes('Copyright United; license MIT'));
  const first = await snapshot(site);
  await finalizeDelivery(site);
  assert.deepEqual(await snapshot(site), first);
});

test('CLI emits a JSON report and leaves PHP untouched', async t => {
  const {site} = await fixture(t);
  await fs.writeFile(path.join(site, 'legacy.php'), '<?php echo "unchanged"; ?>');
  const run = spawnSync(process.execPath, [path.join(__dirname, 'finalize-delivery.cjs'), '--site', site, '--version', '2'], {encoding:'utf8', env:process.env});
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(run.stdout).assetVersion, '2');
  assert.equal(await fs.readFile(path.join(site, 'legacy.php'), 'utf8'), '<?php echo "unchanged"; ?>');
});

test('invalid asset references, unsafe roots, versions and symlinks fail before writing', async t => {
  const {site} = await fixture(t);
  await fs.writeFile(path.join(site, 'assets/theme.css'), '.x { background: url(../../private.png); }');
  const before = await snapshot(site);
  await assert.rejects(finalizeDelivery(site), /Missing or escaping/);
  assert.deepEqual(await snapshot(site), before);
  await assert.rejects(finalizeDelivery(site, {version:'2&bad=1'}), /Asset version/);
  await assert.rejects(finalizeDelivery(path.resolve(__dirname, '..', 'dist')), /source repository/);
  await fs.symlink(path.join(site, 'assets/app.js'), path.join(site, 'outside.js'));
  await assert.rejects(finalizeDelivery(site), /Symlink refused/);
});
