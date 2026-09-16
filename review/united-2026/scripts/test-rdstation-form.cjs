/* Behavioral smoke tests for the local RD adapter; no SDK, network or lead data. */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { randomFillSync } = require('node:crypto');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(path.join(__dirname, '../src/rdstation-form.js'), 'utf8');

class Target {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, callback, capture = false) {
    const listeners = this.listeners.get(type) || [];
    listeners.push({ callback, capture: Boolean(capture) });
    this.listeners.set(type, listeners);
  }
  dispatchEvent(event) {
    event.currentTarget = this;
    for (const listener of [...(this.listeners.get(event.type) || [])].sort((a, b) => Number(b.capture) - Number(a.capture))) {
      listener.callback(event);
      if (event.stopped) break;
    }
    return !event.defaultPrevented;
  }
}

function event(type) {
  return { type, defaultPrevented: false, stopped: false,
    preventDefault() { this.defaultPrevented = true; },
    stopImmediatePropagation() { this.stopped = true; } };
}

function setup({ sdk = 'ready', href = 'https://preview.example/review/united-2026/dist/cursos/?cta=button#live-class' } = {}) {
  let currentUrl = new URL(href), readyForm = null, sdkCreates = 0, reloads = 0, timerSequence = 0;
  const observers = [], timers = new Map(), cache = new Map(), replacements = [], sdkSubmissions = [];
  const mount = { hidden: false, querySelector: () => readyForm, querySelectorAll: () => [] };
  const status = { hidden: false }, error = { hidden: true };
  const success = { hidden: true, focuses: 0, focus() { this.focuses++; } };
  const message = { value: 'Obrigado!' }, redirects = [{ value: 'https://old.example/' }];
  const reload = new Target(), form = new Target(), container = new Target(), window = new Target();
  form.dataset = {};
  form.querySelector = selector => selector === 'input[name="thankyou_message"]' ? message : null;
  form.querySelectorAll = selector => selector === 'input[name="redirect_to"]' ? redirects : [];
  container.dataset = {};
  container.querySelector = selector => ({
    '[data-rd-mount]': mount, '[data-rd-status]': status, '[data-rd-error]': error,
    '[data-rd-success]': success, '[data-rd-reload]': reload,
  })[selector] || null;
  window.location = {
    get href() { return currentUrl.href; }, get hash() { return currentUrl.hash; },
    reload() { reloads++; },
  };
  window.history = { state: { source: 'test' }, replaceState(state, title, destination) {
    replacements.push({ state, destination }); currentUrl = new URL(destination, currentUrl);
  } };
  window.crypto = { getRandomValues: randomFillSync };
  window.jQuery = element => ({ data(key, value) {
    if (arguments.length === 1) return cache.get(element)?.[key];
    const data = cache.get(element) || {}; data[key] = value; cache.set(element, data); return this;
  } });
  if (sdk !== 'missing') window.RDStationForms = class {
    createForm() {
      sdkCreates++;
      if (sdk === 'throws') throw new Error('SDK unavailable');
      if (sdk === 'pending') return;
      readyForm = form;
      // Model the public contract: SDK owns validation/submission and appends its return field.
      form.addEventListener('submit', submitted => {
        sdkSubmissions.push({ alreadyPrevented: submitted.defaultPrevented });
        submitted.preventDefault();
        if (submitted.result === 'invalid') return;
        const destination = cache.get(form)?.assetAction;
        if (destination) redirects.push({ value: Buffer.from(destination, 'base64').toString('latin1') });
      });
    }
  };
  class MutationObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() { this.active = true; }
    disconnect() { this.active = false; }
  }
  const context = vm.createContext({ window, document: { querySelector: () => container }, URL,
    MutationObserver, CustomEvent: class { constructor(type) { this.type = type; } },
    btoa: value => Buffer.from(value, 'latin1').toString('base64'),
    setTimeout: callback => { const id = ++timerSequence; timers.set(id, callback); return id; },
    clearTimeout: id => timers.delete(id),
  });
  const run = () => vm.runInContext(source, context);
  const flushMutations = () => observers.filter(observer => observer.active).forEach(observer => observer.callback([]));
  const navigate = destination => { currentUrl = new URL(destination, currentUrl); window.dispatchEvent(event('hashchange')); };
  run(); flushMutations();
  return { window, form, container, mount, status, error, success, message, redirects, cache,
    replacements, sdkSubmissions, observers, timers, reload, run, flushMutations, navigate,
    submit(result = 'pending') { const submitted = event('submit'); submitted.result = result; form.dispatchEvent(submitted); return submitted; },
    destination() { return Buffer.from(form.dataset.assetAction, 'base64').toString('latin1'); },
    get sdkCreates() { return sdkCreates; }, get reloads() { return reloads; },
  };
}

function assertUnconfirmed(state) {
  assert.equal(state.success.hidden, true);
  assert.equal(state.mount.hidden, false);
  assert.equal(state.container.dataset.rdComplete, undefined);
  assert.equal(state.replacements.length, 0);
}

test('loading and unrelated hashes never count as confirmation', () => {
  const state = setup({ href: 'https://preview.example/?mode=test#united-rd-confirmed-unregistered' });
  assertUnconfirmed(state);
  state.navigate('#contato'); assertUnconfirmed(state);
  state.navigate('#united-rd-confirmed-another-unregistered-value'); assertUnconfirmed(state);
});

test('submission, RD validation rejection and request failure leave the form unconfirmed', () => {
  const state = setup();
  for (const result of ['invalid', 'failed', 'pending']) {
    state.submit(result);
    assertUnconfirmed(state);
    assert.equal(state.sdkSubmissions.at(-1).alreadyPrevented, false, 'adapter must not cancel RD validation or submission');
  }
  state.navigate('#united-rd-confirmed-not-the-attempt'); assertUnconfirmed(state);
});

test('return stays in the same document and restores its query and original fragment', () => {
  for (const original of ['https://preview.example/?mode=test#contato', 'https://preview.example/review/united-2026/dist/cursos/?cta=button&banner=2#live-class']) {
    const state = setup({ href: original });
    state.submit();
    const destination = new URL(state.destination()), before = new URL(original);
    assert.equal(destination.origin, before.origin);
    assert.equal(destination.pathname, before.pathname);
    assert.equal(destination.search, before.search);
    assert.notEqual(destination.hash, before.hash);
    assert.match(destination.hash, /^#united-rd-confirmed-\d+-\d+-\d+-\d+$/);
    assert.equal(state.window.location.href, original, 'submission itself does not navigate');
    assert.equal(state.cache.get(state.form).assetAction, state.form.dataset.assetAction);
    assert.equal(state.message.value, '');
    state.navigate(destination.href);
    assert.equal(state.window.location.href, original);
    assert.equal(state.replacements[0].state, state.window.history.state);
  }
});

test('recognized return shows and focuses one success card, then blocks duplicate submissions', () => {
  const state = setup(); let confirmations = 0;
  state.container.addEventListener('united:rd-form-success', () => confirmations++);
  state.submit(); const destination = state.destination();
  state.navigate(destination);
  assert.equal(state.success.hidden, false);
  assert.equal(state.mount.hidden, true);
  assert.equal(state.status.hidden, true);
  assert.equal(state.error.hidden, true);
  assert.equal(state.container.dataset.rdComplete, 'true');
  assert.equal(state.success.focuses, 1);
  assert.equal(confirmations, 1);
  state.navigate(destination);
  assert.equal(confirmations, 1); assert.equal(state.success.focuses, 1);
  const duplicate = state.submit();
  assert.equal(duplicate.defaultPrevented, true);
  assert.equal(duplicate.stopped, true);
  assert.equal(state.sdkSubmissions.length, 1, 'SDK must not receive a second submission after confirmation');
});

test('retries replace all return fields, including fields appended by the SDK', () => {
  const state = setup();
  state.submit('failed'); const first = state.destination();
  assert.equal(state.redirects.length, 2);
  state.redirects.push({ value: 'https://stale.example/' });
  state.submit(); const second = state.destination();
  assert.notEqual(first, second);
  assert.equal(state.redirects.length, 4);
  assert.ok(state.redirects.every(input => input.value === second));
  assertUnconfirmed(state);
  state.navigate(second); assert.equal(state.success.hidden, false);
});

test('late success of an earlier pending attempt remains correlated', () => {
  const state = setup(); state.submit(); const first = state.destination();
  state.submit(); state.navigate(first);
  assert.equal(state.container.dataset.rdComplete, 'true');
  assert.equal(state.replacements.length, 1);
});

test('repeated execution does not initialize SDK or register submit handlers twice', () => {
  const state = setup(); state.run(); state.flushMutations(); state.submit();
  assert.equal(state.sdkCreates, 1);
  assert.equal(state.sdkSubmissions.length, 1);
  assert.equal(state.redirects.length, 2);
  state.navigate(state.destination()); assert.equal(state.replacements.length, 1);
});

test('missing or throwing SDK exposes fallback without confirmation and supports reload', () => {
  for (const sdk of ['missing', 'throws']) {
    const state = setup({ sdk });
    assert.equal(state.error.hidden, false); assert.equal(state.status.hidden, true);
    assert.equal(state.timers.size, 0);
    assert.equal(state.observers.some(observer => observer.active), false);
    state.navigate('#united-rd-confirmed-unregistered'); assertUnconfirmed(state);
    state.reload.dispatchEvent(event('click')); assert.equal(state.reloads, 1);
  }
});

test('SDK timeout exposes fallback without showing confirmation', () => {
  const state = setup({ sdk: 'pending' });
  for (const callback of state.timers.values()) callback();
  assert.equal(state.error.hidden, false); assert.equal(state.status.hidden, true);
  assertUnconfirmed(state);
});
