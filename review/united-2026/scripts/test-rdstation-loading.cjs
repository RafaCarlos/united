/* SDK loading tests: jsdom 26, no external resources or real lead submissions. */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const readRuntimeSource = require('./read-runtime-source.cjs');

const source = readRuntimeSource('rdstation-form.js');
const markup = readFileSync(path.join(__dirname, '../src/rdstation-form.html'), 'utf8');
const sdkUrl = 'https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js';
const flush = () => new Promise(resolve => setImmediate(resolve));

function setup(t, { href = 'https://united.example/?utm_source=example', intersection = true, existing = false, installed = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><head>' + (existing ? '<script id="rdstation-forms-sdk" src="' + sdkUrl + '"></script>' : '') + '</head><body><section id="contato">' + markup + '</section></body></html>', {
    url: href, referrer: 'https://campaign.example/', runScripts: 'outside-only',
  });
  const w = dom.window, container = w.document.querySelector('[data-rd-contact]');
  t.after(() => w.close());
  const timers = new Map(), intersections = [];
  let timerId = 0, creates = 0, readyEvents = 0;
  w.setTimeout = (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; };
  w.clearTimeout = id => timers.delete(id);
  if (intersection) w.IntersectionObserver = class {
    constructor(callback, options) { this.callback = callback; this.options = options; intersections.push(this); }
    observe(target) { this.target = target; this.active = true; }
    disconnect() { this.active = false; }
    intersect(value = true) { if (this.active) this.callback([{ target: this.target, isIntersecting: value }]); }
  };
  function install({ pending = false, throws = false } = {}) {
    w.RDStationForms = class {
      constructor(id, account) {
        assert.equal(id, 'form-vamos-conversar-5ba05329ea8c88b5c10d');
        assert.equal(account, 'UA-42887237-1');
      }
      createForm() {
        creates++;
        if (throws) throw new Error('Fixture SDK failure');
        if (!pending) render();
      }
    };
  }
  function render() {
    const mount = container.querySelector('[data-rd-mount]');
    mount.innerHTML = '<form><label>Nome<input name="nome"></label><input name="thankyou_message" value="Old message"><button type="submit">Enviar</button></form>';
  }
  container.addEventListener('united:rd-form-ready', () => readyEvents++);
  w.dataLayer = [{ 'gtm.start': 1, event: 'gtm.js' }];
  if (installed) install();
  const run = () => w.eval(source);
  run();
  return {
    w, container, timers, intersections, run, install, render,
    request() { container.dispatchEvent(new w.CustomEvent('united:rd-form-request', { bubbles: true })); },
    sdk() { return w.document.getElementById('rdstation-forms-sdk'); },
    load() { this.sdk().dispatchEvent(new w.Event('load')); },
    error() { this.sdk().dispatchEvent(new w.Event('error')); },
    expire() { for (const [id, timer] of Array.from(timers)) { timers.delete(id); timer.callback(); } },
    get creates() { return creates; }, get readyEvents() { return readyEvents; },
  };
}

function unconfirmed(state) {
  assert.equal(state.container.querySelector('[data-rd-success]').hidden, true);
  assert.equal(state.container.dataset.rdComplete, undefined);
}

test('offscreen form does not request the SDK or start its timeout', t => {
  const state = setup(t);
  assert.equal(state.sdk(), null);
  assert.equal(state.timers.size, 0);
  assert.equal(state.container.dataset.rdLoadState, 'idle');
  assert.equal(state.intersections[0].options.rootMargin, '300px');
  assert.equal(state.intersections[0].target, state.container);
  state.intersections[0].intersect(false);
  assert.equal(state.sdk(), null);
  unconfirmed(state);
});

test('early contact request starts one SDK load and one 20-second timeout', async t => {
  const state = setup(t);
  const url = state.w.location.href, referrer = state.w.document.referrer, events = state.w.dataLayer;
  state.request(); state.request(); state.run();
  assert.equal(state.w.document.querySelectorAll('#rdstation-forms-sdk').length, 1);
  assert.equal(state.sdk().src, sdkUrl);
  assert.equal(state.sdk().async, true);
  assert.equal(state.timers.size, 1);
  assert.equal([...state.timers.values()][0].delay, 20000);
  assert.equal(state.intersections[0].active, false);
  assert.equal(state.container.dataset.rdLoadState, 'loading');
  assert.equal(state.creates, 0);
  state.install(); state.load(); await flush();
  state.request(); state.load(); await flush();
  assert.equal(state.creates, 1);
  assert.equal(state.readyEvents, 1);
  assert.equal(state.timers.size, 0);
  assert.equal(state.container.dataset.rdLoadState, 'ready');
  assert.equal(state.w.location.href, url);
  assert.equal(state.w.document.referrer, referrer);
  assert.equal(state.w.dataLayer, events);
  assert.equal(events.length, 1);
  unconfirmed(state);
});

test('scroll proximity starts the same singleton as contact clicks', async t => {
  const state = setup(t);
  state.intersections[0].intersect(); state.request();
  state.install(); state.load(); await flush();
  assert.equal(state.creates, 1);
  assert.equal(state.readyEvents, 1);
  unconfirmed(state);
});

test('initial and subsequent contact deep links request the form', t => {
  const direct = setup(t, { href: 'https://united.example/?utm_source=example#contato' });
  assert.equal(direct.sdk().src, sdkUrl);
  const later = setup(t);
  later.w.history.replaceState(null, '', '#live-class');
  later.w.dispatchEvent(new later.w.HashChangeEvent('hashchange'));
  assert.equal(later.sdk(), null);
  later.w.history.replaceState(null, '', '#contato');
  later.w.dispatchEvent(new later.w.HashChangeEvent('hashchange'));
  assert.equal(later.sdk().src, sdkUrl);
  unconfirmed(direct); unconfirmed(later);
});

test('focus intent and browsers without IntersectionObserver have a loading path', t => {
  const focus = setup(t);
  focus.container.dispatchEvent(new focus.w.FocusEvent('focusin', { bubbles: true }));
  assert.equal(focus.sdk().src, sdkUrl);
  const fallback = setup(t, { intersection: false });
  assert.equal(fallback.sdk().src, sdkUrl);
});

test('a preinstalled SDK stays compatible with immediate initialization', async t => {
  const state = setup(t, { installed: true });
  await flush();
  assert.equal(state.sdk(), null);
  assert.equal(state.creates, 1);
  assert.equal(state.readyEvents, 1);
  assert.equal(state.container.dataset.rdLoadState, 'ready');
});

test('an independently loaded or already loading SDK is reused', async t => {
  const present = setup(t);
  present.install(); present.request(); await flush();
  assert.equal(present.sdk(), null);
  assert.equal(present.creates, 1);
  const existing = setup(t, { existing: true });
  const original = existing.sdk();
  existing.request(); existing.install(); existing.load(); await flush();
  assert.equal(existing.sdk(), original);
  assert.equal(existing.w.document.querySelectorAll('#rdstation-forms-sdk').length, 1);
  assert.equal(existing.creates, 1);
});

test('closing, moving and reopening a pending form does not create another embed', async t => {
  const state = setup(t);
  const inline = state.container.parentElement;
  const dialog = state.w.document.createElement('dialog');
  state.w.document.body.appendChild(dialog);
  state.request(); dialog.appendChild(state.container);
  inline.appendChild(state.container);
  state.request(); dialog.appendChild(state.container);
  state.install(); state.load(); await flush();
  assert.equal(state.creates, 1);
  assert.equal(state.readyEvents, 1);
  assert.equal(state.container.parentElement, dialog);
  unconfirmed(state);
});

test('SDK network failure shows the real fallback without false success or retries', t => {
  const state = setup(t);
  state.request(); state.error(); state.request();
  assert.equal(state.container.dataset.rdLoadState, 'error');
  assert.equal(state.container.querySelector('[data-rd-error]').hidden, false);
  assert.equal(state.container.querySelector('[data-rd-status]').hidden, true);
  assert.equal(state.timers.size, 0);
  assert.equal(state.w.document.querySelectorAll('#rdstation-forms-sdk').length, 1);
  assert.equal(state.creates, 0);
  unconfirmed(state);
});

test('missing SDK export and SDK exception expose the fallback', t => {
  for (const variant of ['missing', 'throws']) {
    const state = setup(t);
    state.request();
    if (variant === 'throws') state.install({ throws: true });
    state.load();
    assert.equal(state.container.dataset.rdLoadState, 'error');
    assert.equal(state.timers.size, 0);
    unconfirmed(state);
  }
});

test('a timed-out SDK may recover when it finally loads, without false success', async t => {
  const state = setup(t);
  state.request(); state.expire();
  assert.equal(state.container.dataset.rdLoadState, 'error');
  unconfirmed(state);
  state.install(); state.load(); await flush();
  assert.equal(state.creates, 1);
  assert.equal(state.container.dataset.rdLoadState, 'ready');
  assert.equal(state.container.querySelector('[data-rd-error]').hidden, true);
  unconfirmed(state);
});

test('template delay shares the original timeout and can recover when rendered', async t => {
  const state = setup(t);
  state.request();
  const [originalTimer] = state.timers.keys();
  state.install({ pending: true }); state.load();
  assert.deepEqual([...state.timers.keys()], [originalTimer]);
  state.expire();
  assert.equal(state.container.dataset.rdLoadState, 'error');
  state.render(); await flush();
  assert.equal(state.creates, 1);
  assert.equal(state.readyEvents, 1);
  assert.equal(state.container.dataset.rdLoadState, 'ready');
  unconfirmed(state);
});
