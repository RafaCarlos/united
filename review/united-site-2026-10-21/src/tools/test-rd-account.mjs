// No external scripts execute; these tests inspect local DOM insertions only.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const source = await fs.readFile(new URL('../rdstation-account.js', import.meta.url), 'utf8');
const rd = 'https://d335luupugsy2.cloudfront.net/js/loader-scripts/ee4f0815-8266-4fb5-ba25-416836b02312-loader.js';
const gtm = 'https://www.googletagmanager.com/gtm.js?id=GTM-MTK74PV';
const cases = [];
function page(url, extra = '') {
  return new JSDOM('<!doctype html><head>' + extra + '</head><body></body>', {url, runScripts:'outside-only'});
}
for (const url of ['http://127.0.0.1:8790/', 'file:///local/index.html', 'https://preview.example/', 'https://unitedidiomas.com.example/']) {
  const dom = page(url); dom.window.eval(source);
  assert.equal(dom.window.document.scripts.length, 0); dom.window.close();
}
cases.push('Local, file and third-party preview hosts do not inject marketing scripts');
{
  const dom = page('https://www.unitedidiomas.com/review/', '<meta name="robots" content="noindex,follow">');
  dom.window.eval(source); assert.equal(dom.window.document.scripts.length, 0); dom.window.close();
  cases.push('Official-host noindex previews also stay out of marketing tracking');
}
for (const host of ['www.unitedidiomas.com', 'unitedidiomas.com']) {
  const dom = page('https://' + host + '/blog/'); const w = dom.window;
  w.dataLayer = [{event:'existing-agency-event'}];
  w.eval(source); w.eval(source);
  assert.deepEqual([...w.document.scripts].map(s=>s.src), [rd,gtm]);
  assert.equal(w.dataLayer.length, 2); assert.equal(w.dataLayer[0].event, 'existing-agency-event');
  assert.equal(w.dataLayer[1].event, 'gtm.js');
  assert.ok([...w.document.scripts].every(s=>s.async)); dom.window.close();
}
cases.push('Official hosts load the current account and GTM only once, preserving dataLayer');
{
  const dom = page('https://www.unitedidiomas.com/', '<script src="'+rd+'?v=current"></script><script src="'+gtm+'&amp;l=dataLayer"></script>');
  dom.window.eval(source); assert.equal(dom.window.document.scripts.length, 2);
  assert.equal(dom.window.dataLayer, undefined); dom.window.close();
  cases.push('Existing host-injected loaders with query parameters are not duplicated');
}
{
  const dom = page('https://www.unitedidiomas.com/');
  dom.window.google_tag_manager = {'GTM-MTK74PV':{}}; dom.window.eval(source);
  assert.deepEqual([...dom.window.document.scripts].map(s=>s.src), [rd]); dom.window.close();
  cases.push('An already initialized GTM container is preserved');
}
console.log(JSON.stringify({passed:true,cases,externalRequests:0,leadsSubmitted:0},null,2));
