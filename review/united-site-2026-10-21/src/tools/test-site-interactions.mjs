// Behavioral checks use jsdom and a local fake RD renderer. No network or leads.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const flush = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
const cases = [];
async function browser(file, { sdk = true } = {}) {
  const html = await fs.readFile(path.join(root, file), 'utf8');
  const dom = new JSDOM(html, { url: 'https://preview.example/' + file.replace(/index.html$/, ''), runScripts: 'outside-only', pretendToBeVisual: true });
  const { window: w } = dom;
  w.matchMedia = query => ({ matches: /max-width/.test(query), media: query, addEventListener() {}, removeEventListener() {}, addListener() {} });
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.Element.prototype.scrollIntoView = function () {};
  w.Element.prototype.scrollBy = function () {};
  w.HTMLMediaElement.prototype.pause = function () {};
  w.HTMLMediaElement.prototype.load = function () {};
  w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { if (!this.open) return; this.open = false; w.setTimeout(() => this.dispatchEvent(new w.Event('close')), 0); };
  w.fetch = () => { throw new Error('Network is forbidden in this test.'); };
  let rdCreates = 0;
  if (sdk) w.RDStationForms = class {
    constructor(id, account) { assert.equal(id, 'form-vamos-conversar-5ba05329ea8c88b5c10d'); assert.equal(account, 'UA-42887237-1'); this.id = id; }
    createForm() {
      rdCreates++;
      w.document.getElementById(this.id).innerHTML = '<form><label>Nome<input name="name" required></label><label>E-mail<input type="email" name="email" required></label><label>Celular<input name="phone" required></label><input name="emP7yF13ld" readonly><input type="hidden" name="thankyou_message" value="Obrigado"><button type="submit">Enviar</button></form>';
    }
  };
  async function load(relative) {
    Object.defineProperty(w.document, 'currentScript', { configurable: true, value: { src: new URL(relative, 'https://preview.example/').href } });
    w.eval(await fs.readFile(path.join(root, relative), 'utf8'));
  }
  const scripts = [...w.document.querySelectorAll('script[src]')].map(s => new URL(s.getAttribute('src'), w.location.href).pathname.slice(1));
  for (const script of scripts) await load(script);
  await flush();
  return { dom, w, d: w.document, rdCreates: () => rdCreates };
}
function click(env, element) {
  const event = new env.w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  element.dispatchEvent(event);
  return event;
}
for (const file of ['index.html', 'home/index.html', 'business/index.html', 'full/index.html', 'quem-somos/index.html', 'faq/index.html', 'blog/index.html']) {
  const env = await browser(file); const { d, w } = env;
  const opener = d.querySelector('.menu-button'); const menu = d.querySelector('#mobile-menu');
  click(env, opener); assert.equal(menu.open, true, file + ': menu opens'); assert.equal(opener.getAttribute('aria-expanded'), 'true');
  click(env, menu.querySelector('.mobile-menu-close')); await flush();
  assert.equal(menu.open, false); assert.equal(opener.getAttribute('aria-expanded'), 'false');
  assert.equal(d.body.classList.contains('modal-open'), false);
  const trigger = d.querySelector('[data-contact-form]'); click(env, trigger);
  const dialog = d.querySelector('#united-contact-dialog'); assert.equal(dialog.open, true, file + ': contact opens immediately');
  await flush(300);
  assert.equal(d.querySelector('[data-rd-contact]').dataset.rdLoadState, 'ready', file + ': RD fields ready');
  assert.equal(env.rdCreates(), 1); assert.equal(d.querySelectorAll('[data-rd-mount]').length, 1);
  assert.equal(d.querySelector('[name=emP7yF13ld]').hidden, true);
  d.querySelector('[name=name]').value = 'Valor mantido apenas em memória';
  click(env, d.querySelector('.united-contact-close')); await flush();
  assert.equal(d.body.classList.contains('united-contact-open'), false);
  if (file === 'home/index.html') assert.ok(d.querySelector('[data-contact-inline] [data-rd-mount]'), 'Home restores the same inline form.');
  click(env, trigger); await flush();
  assert.equal(d.querySelector('[name=name]').value, 'Valor mantido apenas em memória'); assert.equal(env.rdCreates(), 1);
  const form = d.querySelector('[data-rd-mount] form');
  form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  assert.equal(d.querySelector('[data-rd-success]').hidden, true, 'Submitting alone must not show success.');
  const expected = w.atob(form.dataset.assetAction); const original = w.location.href;
  w.location.hash = 'unrelated-fragment'; await flush();
  assert.equal(d.querySelector('[data-rd-success]').hidden, true, 'Unrelated hashes cannot confirm a conversion.');
  w.location.hash = new URL(expected).hash; await flush();
  assert.equal(d.querySelector('[data-rd-success]').hidden, false, 'Only the expected local SDK-return nonce confirms.');
  assert.equal(w.location.href, original);
  assert.equal(form.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })), false, 'Completed forms do not submit twice.');
  cases.push(file + ': menu, shared form, one RD instance, field preservation and correlated success');
  env.dom.window.close();
}
const home = await browser('home/index.html');
const sectionLink = [...home.d.querySelectorAll('a[href^="#"]')].find(a => a.getAttribute('href') !== '#contato' && home.d.getElementById(a.getAttribute('href').slice(1)));
const modified = new home.w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true });
sectionLink.dispatchEvent(modified); assert.equal(modified.defaultPrevented, false, 'Modified anchors preserve browser behavior.');
click(home, sectionLink); assert.equal(home.w.location.hash, sectionLink.getAttribute('href')); assert.equal(home.d.activeElement.id, sectionLink.getAttribute('href').slice(1));
cases.push('Home anchors preserve modified clicks, URL/history and keyboard focus'); home.dom.window.close();
const faq = await browser('faq/index.html');
const search = faq.d.querySelector('#faq-search-input'); search.value = 'conversação';
faq.d.querySelector('.faq-search').dispatchEvent(new faq.w.Event('submit', { bubbles: true, cancelable: true }));
assert.ok([...faq.d.querySelectorAll('[data-faq-item]')].some(e => e.open && !e.hidden));
search.value = 'zzzxxyy not-found'; faq.d.querySelector('.faq-search').dispatchEvent(new faq.w.Event('submit', { bubbles: true, cancelable: true }));
assert.equal(faq.d.querySelector('[data-faq-empty]').hidden, false);
click(faq, faq.d.querySelector('[data-faq-reset]')); assert.equal(faq.d.querySelector('[data-faq-empty]').hidden, true);
cases.push('FAQ search, empty state and reset'); faq.dom.window.close();
for (const file of ['index.html', 'business/index.html', 'full/index.html']) {
  const env = await browser(file);
  for (const list of env.d.querySelectorAll('[role=tablist]')) {
    const tabs = [...list.querySelectorAll('[role=tab]')]; if (tabs.length < 2) continue;
    tabs[0].focus(); tabs[0].dispatchEvent(new env.w.KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    assert.equal(tabs.at(-1).getAttribute('aria-selected'), 'true'); assert.equal(env.d.activeElement, tabs.at(-1));
    const panel = env.d.getElementById(tabs.at(-1).getAttribute('aria-controls')); assert.equal(panel.hidden, false);
  }
  cases.push(file + ': keyboard tab explorers'); env.dom.window.close();
}
const unavailable = await browser('faq/index.html', { sdk: false });
click(unavailable, unavailable.d.querySelector('[data-contact-form]'));
unavailable.d.querySelector('#rdstation-forms-sdk').dispatchEvent(new unavailable.w.Event('error'));
await flush();
assert.equal(unavailable.d.querySelector('[data-rd-error]').hidden, false);
assert.equal(unavailable.d.querySelector('[data-rd-success]').hidden, true);
assert.equal(unavailable.d.querySelector('[data-rd-contact]').getAttribute('aria-busy'), 'false');
assert.ok(unavailable.d.querySelector('.united-contact-alternative a[href^="https://wa.me/"]'));
cases.push('RD network failure exposes retry and WhatsApp fallback without false success');
unavailable.dom.window.close();
console.log(JSON.stringify({ passed: true, networkRequests: 0, leadsSubmitted: 0, cases }, null, 2));
