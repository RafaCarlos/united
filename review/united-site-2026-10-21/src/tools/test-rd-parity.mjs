// Local behavior tests only. The RD widget is a fake DOM fixture: no HTTP/leads.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = await fs.readFile(path.join(root, 'rdstation-whatsapp.js'), 'utf8');
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const cases = [];
const dom = new JSDOM(`<!doctype html><body>
  <div id="approved-position"><a id="commercial" target="_blank" style="position:fixed;bottom:30px" href="https://wa.me/5511940040658?text=Quero%20conhecer">WhatsApp</a></div>
  <a id="api" target="_blank" href="https://api.whatsapp.com/send?phone=5511940040658&amp;text=Oi">Contato</a>
  <a id="partnership" target="_blank" href="https://wa.me/5511958575315">Parcerias</a>
  <a id="unit" target="_blank" href="https://wa.me/551122272711">Unidade</a>
  <div class="united-contact-alternative"><a id="fallback" target="_blank" href="https://wa.me/5511940040658">WhatsApp alternativo</a></div>
  <a id="unrelated" target="_blank" href="https://example.test/wa.me/5511940040658">Outro</a>
</body>`, {url: 'https://preview.example/', runScripts: 'outside-only', pretendToBeVisual: true});
const { window: w } = dom;
const d = w.document;
w.fetch = () => { throw new Error('Network forbidden in this test'); };
w.HTMLElement.prototype.getClientRects = function () {
  return this.hidden || this.style.display === 'none' ? [] : [{width: 20, height: 20}];
};
const originalParent = d.querySelector('#commercial').parentElement;
const originalStyle = d.querySelector('#commercial').getAttribute('style');
const originalHref = d.querySelector('#commercial').getAttribute('href');
w.eval(source);

function click(element, props = {}) {
  const event = new w.MouseEvent('click', {bubbles: true, cancelable: true, button: 0, ...props});
  element.dispatchEvent(event);
  return event;
}

function widget(id, {deferTrigger = false} = {}) {
  const el = d.createElement('div');
  el.id = id;
  el.className = 'floating-button floating-button--close';
  el.innerHTML = `<button type="button" class="rdstation-popup-js-floating-button" aria-label="Abrir WhatsApp">RD</button>
    <button type="button" class="rdstation-popup-js-close-button">Fechar</button>
    <form action="https://example.invalid/rd-never-submitted"><input name="name" value="Valor local"><input name="email"><input name="personal_phone"><input type="hidden" name="token" value="local-fixture-not-a-secret"><button type="submit">Enviar</button></form>
    <a target="_blank" class="student" href="https://wa.me/5511940040658?text=Sou%20aluno">CLIQUE AQUI</a>`;
  let opens = 0;
  const trigger = el.querySelector('.rdstation-popup-js-floating-button');
  trigger.addEventListener('click', () => {
    opens++;
    el.classList.remove('floating-button--close');
    el.querySelector('[name=name]').focus();
  });
  el.querySelector('.rdstation-popup-js-close-button').addEventListener('click', () => el.classList.add('floating-button--close'));
  el.querySelector('form').addEventListener('submit', event => { event.preventDefault(); throw new Error('No test may submit a lead'); });
  if (deferTrigger) trigger.remove();
  d.body.appendChild(el);
  return {el, trigger, opens: () => opens};
}

assert.equal(click(d.querySelector('#commercial')).defaultPrevented, false);
assert.equal(d.querySelector('#commercial').hasAttribute('aria-haspopup'), false);
cases.push('Blocked/missing RD widget preserves the original direct WhatsApp link');

const rd = widget('rd-native-widget');
await flush();
assert.equal(rd.el.getAttribute('aria-hidden'), 'true');
assert.equal(rd.el.hasAttribute('inert'), true);
assert.equal(d.querySelector('#commercial').getAttribute('aria-controls'), 'rd-native-widget');
assert.equal(d.querySelector('#commercial').getAttribute('aria-haspopup'), 'dialog');
assert.equal(rd.el.querySelector('.rdstation-popup-js-floating-button').style.display, 'none');
assert.equal(rd.el.querySelector('.student').textContent, 'Atendimento para alunos');
assert.equal(click(d.querySelector('#commercial')).defaultPrevented, true);
assert.equal(rd.opens(), 1);
assert.equal(d.querySelector('#commercial').getAttribute('aria-expanded'), 'true');
assert.equal(rd.el.hasAttribute('inert'), false);
assert.equal(rd.el.getAttribute('aria-modal'), 'true');
assert.equal(d.activeElement, rd.el.querySelector('[name=name]'));
assert.equal(d.querySelector('#commercial').parentElement, originalParent);
assert.equal(d.querySelector('#commercial').getAttribute('style'), originalStyle);
assert.equal(d.querySelector('#commercial').getAttribute('href'), originalHref);
assert.equal(rd.el.querySelector('form').getAttribute('action'), 'https://example.invalid/rd-never-submitted');
assert.equal(rd.el.querySelector('[name=token]').value, 'local-fixture-not-a-secret');
assert.equal(rd.el.querySelector('[name=name]').value, 'Valor local');
cases.push('Late native widget opens through its existing handler; layout, destinations and all fields are untouched');

for (const selector of ['#partnership', '#unit', '#fallback', '#unrelated', '.student']) {
  assert.equal(click(d.querySelector(selector)).defaultPrevented, false, selector + ' must remain direct');
}
for (const props of [{ctrlKey: true}, {metaKey: true}, {shiftKey: true}, {altKey: true}, {button: 1}]) {
  assert.equal(click(d.querySelector('#commercial'), props).defaultPrevented, false);
}
assert.equal(rd.opens(), 1);
cases.push('Student/native RD links, units, partnerships, contact fallback and modified clicks retain browser behavior');

const field = rd.el.querySelector('[name=name]');
field.focus();
const first = rd.el.querySelector('.rdstation-popup-js-close-button');
const last = rd.el.querySelector('.student');
first.focus();
const shiftTab = new w.KeyboardEvent('keydown', {key: 'Tab', shiftKey: true, bubbles: true, cancelable: true});
first.dispatchEvent(shiftTab);
assert.equal(shiftTab.defaultPrevented, true);
assert.equal(d.activeElement, last);
const tab = new w.KeyboardEvent('keydown', {key: 'Tab', bubbles: true, cancelable: true});
last.dispatchEvent(tab);
assert.equal(tab.defaultPrevented, true);
assert.equal(d.activeElement, first);
const escape = new w.KeyboardEvent('keydown', {key: 'Escape', bubbles: true, cancelable: true});
first.dispatchEvent(escape);
await flush();
assert.equal(escape.defaultPrevented, true);
assert.equal(rd.el.classList.contains('floating-button--close'), true);
assert.equal(d.activeElement, d.querySelector('#commercial'));
assert.equal(d.querySelector('#commercial').getAttribute('aria-expanded'), 'false');
cases.push('Escape uses native close; focus trap and return focus preserve accessibility');

const status = d.createElement('p');
d.body.appendChild(status);
await flush();
let linkScans = 0;
const querySelectorAll = d.querySelectorAll;
d.querySelectorAll = function (selector) {
  if (selector === 'a[href]') linkScans++;
  return querySelectorAll.call(this, selector);
};
for (let index = 0; index < 20; index++) {
  status.textContent = 'Banner ' + index + ' aberto';
  await flush();
}
const unrelatedSection = d.createElement('section');
unrelatedSection.innerHTML = '<div><p>Conteúdo sem links</p></div>';
d.body.appendChild(unrelatedSection);
await flush();
assert.equal(linkScans, 0, 'Unrelated text/content changes must not rescan all page links');
d.querySelectorAll = querySelectorAll;
cases.push('Repeated banner/status text and unrelated subtrees do not rescan page links');

const student = rd.el.querySelector('.student');
student.textContent = 'CLIQUE AQUI';
await flush();
assert.equal(student.textContent, 'Atendimento para alunos');
const nestedStudent = d.createElement('div');
nestedStudent.innerHTML = '<a href="https://wa.me/5511940040658?text=Aluno">CLIQUE AQUI</a>';
rd.el.appendChild(nestedStudent);
await flush();
assert.equal(nestedStudent.querySelector('a').textContent, 'Atendimento para alunos');
assert.equal(rd.el.querySelector('[name=name]').value, 'Valor local');
cases.push('Existing student-link text updates and controls inserted inside RD still reconcile');

const dynamic = d.createElement('a');
dynamic.href = 'https://api.whatsapp.com/send?phone=%2B55%20(11)%2094004-0658';
dynamic.target = '_blank';
dynamic.textContent = 'Contato adicionado depois';
d.body.appendChild(dynamic);
await flush();
assert.equal(dynamic.getAttribute('aria-controls'), rd.el.id);
assert.equal(click(dynamic).defaultPrevented, true);
assert.equal(rd.opens(), 2);
click(d.querySelector('#api'));
assert.equal(rd.opens(), 2, 'An already-open RD widget must not toggle closed');
assert.equal(d.activeElement, field);
cases.push('Dynamic wa.me/API commercial links work with delegated clicks without reopening an open widget');

rd.el.remove();
await flush();
assert.equal(d.body.classList.contains('rd-whatsapp-open'), false);
assert.equal(d.querySelector('#commercial').hasAttribute('aria-controls'), false);
assert.equal(click(d.querySelector('#commercial')).defaultPrevented, false);
const replacement = widget('rd-replacement-widget');
await flush();
w.eval(source);
assert.equal(click(d.querySelector('#commercial')).defaultPrevented, true);
assert.equal(replacement.opens(), 1, 'No duplicated handler after evaluating the bridge twice');
assert.equal(d.querySelector('#commercial').getAttribute('aria-controls'), replacement.el.id);
cases.push('Removed/replaced widgets recover cleanly; repeated initialization never duplicates handlers');

replacement.el.remove();
await flush();
const delayed = widget('rd-delayed-trigger', {deferTrigger: true});
await flush();
assert.equal(d.querySelector('#commercial').hasAttribute('aria-controls'), false);
const triggerContainer = d.createElement('div');
triggerContainer.appendChild(delayed.trigger);
delayed.el.prepend(triggerContainer);
await flush();
assert.equal(delayed.trigger.style.display, 'none');
assert.equal(d.querySelector('#commercial').getAttribute('aria-controls'), delayed.el.id);
assert.equal(click(d.querySelector('#commercial')).defaultPrevented, true);
assert.equal(delayed.opens(), 1);
cases.push('A native trigger inserted later inside a subtree connects without waiting for a click');

dom.window.close();
console.log(JSON.stringify({passed: true, networkRequests: 0, leadsSubmitted: 0, cases}, null, 2));
