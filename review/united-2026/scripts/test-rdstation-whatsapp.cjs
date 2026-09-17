/* Behavior of the local WhatsApp adapter against the native widget's DOM contract.
 * No remote SDK, network requests or contact data are used. */
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync(path.join(__dirname, '../src/rdstation-whatsapp.js'), 'utf8');

function event(type, properties = {}) {
  return { type, defaultPrevented: false, propagationStopped: false, ...properties,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() { this.propagationStopped = true; },
  };
}

function setup({ early = false } = {}) {
  const observers = [], records = [];
  let document, sequence = 0;
  const notify = (target, type, attributeName) => records.push({ target, type, attributeName });
  function matches(element, selector) {
    const parts = selector.trim().match(/(?:\[[^\]]*\]|[^\s])+/g);
    function simple(node, part) {
      const tag = part.match(/^[a-z][\w-]*/i);
      if (tag && node.tagName !== tag[0].toUpperCase()) return false;
      for (const match of part.matchAll(/\.([\w-]+)|#([\w-]+)|\[([\w-]+)(?:(\*=|=)["']?([^"'\]]*)["']?)?\]/g)) {
        if (match[1] && !node.classList.contains(match[1])) return false;
        if (match[2] && node.id !== match[2]) return false;
        if (match[3]) {
          const value = node.getAttribute(match[3]);
          if (value === null || (match[4] === '=' && value !== match[5]) ||
              (match[4] === '*=' && !value.includes(match[5]))) return false;
        }
      }
      return true;
    }
    if (!parts || !simple(element, parts.pop())) return false;
    let ancestor = element.parentNode;
    while (parts.length) {
      const part = parts.pop();
      while (ancestor && !simple(ancestor, part)) ancestor = ancestor.parentNode;
      if (!ancestor) return false;
      ancestor = ancestor.parentNode;
    }
    return true;
  }
  class Element {
    constructor(tag, attributes = {}) {
      this.tagName = tag.toUpperCase(); this.attributes = new Map(); this.children = [];
      this.parentNode = null; this.listeners = new Map(); this.disabled = false; this.hidden = false;
      this.visibility = 'visible'; this.focuses = 0;
      this.style = { setProperty(name, value, priority) { this[name] = value; this[name + 'Priority'] = priority; } };
      this.classList = {
        contains: name => (this.getAttribute('class') || '').split(/\s+/).includes(name),
        toggle: (name, force) => {
          const names = new Set((this.getAttribute('class') || '').split(/\s+/).filter(Boolean));
          const present = force === undefined ? !names.has(name) : force;
          if (present) names.add(name); else names.delete(name);
          this.setAttribute('class', [...names].join(' ')); return present;
        },
        add: name => this.classList.toggle(name, true), remove: name => this.classList.toggle(name, false),
      };
      for (const [name, value] of Object.entries(attributes)) this.setAttribute(name, value);
    }
    get id() { return this.getAttribute('id') || ''; }
    get isConnected() { return this === document || !!this.parentNode?.isConnected; }
    get tabIndex() {
      const value = this.getAttribute('tabindex');
      if (value !== null) return Number(value);
      return /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(this.tagName) || (this.tagName === 'A' && this.hasAttribute('href')) ? 0 : -1;
    }
    set tabIndex(value) { this.setAttribute('tabindex', String(value)); }
    setAttribute(name, value) { this.attributes.set(name, String(value)); notify(this, 'attributes', name); }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); notify(this, 'attributes', name); }
    appendChild(child) { child.parentNode = this; this.children.push(child); notify(this, 'childList'); return child; }
    remove() {
      const parent = this.parentNode;
      if (!parent) return;
      parent.children.splice(parent.children.indexOf(this), 1); this.parentNode = null; notify(parent, 'childList');
    }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    querySelectorAll(selector) {
      const result = [], selectors = selector.split(',');
      const walk = node => node.children.forEach(child => {
        if (selectors.some(part => matches(child, part))) result.push(child);
        walk(child);
      });
      walk(this); return result;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    closest(selector) { return matches(this, selector) ? this : this.parentNode?.closest(selector) || null; }
    getClientRects() {
      if (!this.isConnected) return [];
      for (let node = this; node; node = node.parentNode) {
        if (node.hidden || node.style.display === 'none') return [];
      }
      return [{}];
    }
    focus() { if (this.isConnected) { document.activeElement = this; this.focuses++; } }
    addEventListener(type, callback) {
      const listeners = this.listeners.get(type) || [];
      listeners.push(callback); this.listeners.set(type, listeners);
    }
    dispatchEvent(dispatched) {
      dispatched.target ||= this;
      for (let node = this; node; node = node.parentNode) {
        dispatched.currentTarget = node;
        for (const callback of node.listeners.get(dispatched.type) || []) callback(dispatched);
        if (dispatched.propagationStopped) break;
      }
      return !dispatched.defaultPrevented;
    }
    click(properties = {}) { const clicked = event('click', properties); this.dispatchEvent(clicked); return clicked; }
  }
  document = new Element('document');
  document.body = document.appendChild(new Element('body'));
  document.activeElement = document.body;
  const destination = 'https://api.whatsapp.com/send?phone=5511940040658';
  const banner = document.body.appendChild(new Element('a', { class: 'banner-whatsapp', href: destination }));
  const contact = document.body.appendChild(new Element('section', { id: 'contato' }));
  const footer = contact.appendChild(new Element('a', { href: destination }));
  const links = [banner, footer];
  function widget() {
    const wrapper = new Element('div', { class: 'floating-button floating-button--close', id: 'widget-' + ++sequence });
    const trigger = wrapper.appendChild(new Element('button', { class: 'rdstation-popup-js-floating-button', 'aria-label': 'Abrir WhatsApp' }));
    const close = wrapper.appendChild(new Element('button', { class: 'rdstation-popup-js-close-button' }));
    const input = wrapper.appendChild(new Element('input'));
    const disabled = wrapper.appendChild(new Element('input')); disabled.disabled = true;
    const send = wrapper.appendChild(new Element('button'));
    const hidden = wrapper.appendChild(new Element('button')); hidden.hidden = true;
    const invisible = wrapper.appendChild(new Element('button')); invisible.visibility = 'hidden';
    const state = { wrapper, trigger, close, input, disabled, send, hidden, invisible, opens: 0, closes: 0 };
    // Simulate the SDK's existing handlers, including focus and class-based close.
    trigger.addEventListener('click', () => { state.opens++; wrapper.classList.remove('floating-button--close'); input.focus(); });
    close.addEventListener('click', () => { state.closes++; wrapper.classList.add('floating-button--close'); });
    document.body.appendChild(wrapper); return state;
  }
  class MutationObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target, options) { this.target = target; this.options = options; this.active = true; }
    disconnect() { this.active = false; }
  }
  function flush() {
    for (let round = 0; records.length; round++) {
      assert.ok(round < 20, 'observer callbacks must settle without a mutation loop');
      const batch = records.splice(0);
      for (const observer of [...observers]) {
        if (!observer.active) continue;
        const relevant = batch.filter(record => {
          const o = observer.options;
          return (record.target === observer.target || (o.subtree && observer.target.contains(record.target))) &&
            ((record.type === 'childList' && o.childList) || (record.type === 'attributes' && o.attributes &&
              (!o.attributeFilter || o.attributeFilter.includes(record.attributeName))));
        });
        if (relevant.length) observer.callback(relevant);
      }
    }
  }
  const initialWidget = early ? widget() : null;
  records.length = 0;
  const rejectNetwork = () => { throw new Error('The adapter must delegate to the original native click, not send a request'); };
  const context = vm.createContext({ document, MutationObserver,
    getComputedStyle: element => ({ visibility: element.visibility }), fetch: rejectNetwork, XMLHttpRequest: rejectNetwork,
  });
  vm.runInContext(source, context); flush();
  return { document, links, banner, footer, destination, widget, initialWidget, flush,
    isOpen: () => document.body.classList.contains('rd-whatsapp-open'),
    key(target, key, properties = {}) { const pressed = event('keydown', { key, ...properties }); target.dispatchEvent(pressed); return pressed; },
  };
}

test('without an available widget the original WhatsApp destination stays usable', () => {
  const state = setup();
  for (const link of state.links) {
    assert.equal(link.click().defaultPrevented, false);
    assert.equal(link.getAttribute('href'), state.destination);
    assert.equal(link.hasAttribute('aria-controls'), false);
  }
  assert.equal(state.isOpen(), false);
});

test('early and late loaders connect once and delegate both shortcuts to the native handler', () => {
  for (const early of [true, false]) {
    const state = setup({ early }); const native = state.initialWidget || state.widget(); state.flush();
    assert.equal(native.trigger.style.display, 'none');
    assert.equal(native.trigger.tabIndex, -1);
    assert.equal(state.banner.getAttribute('aria-controls'), native.wrapper.id);
    assert.equal(state.banner.click().defaultPrevented, true); state.flush();
    assert.equal(native.opens, 1); assert.equal(state.isOpen(), true);
    assert.equal(state.document.activeElement, native.input);
    assert.equal(state.footer.click().defaultPrevented, true); state.flush();
    assert.equal(native.opens, 1, 'clicking another shortcut while open must not toggle the popup closed');
    assert.ok(state.links.every(link => link.getAttribute('aria-expanded') === 'true'));
  }
});

test('modified clicks and a detached native trigger preserve normal link navigation', () => {
  const state = setup({ early: true }), native = state.initialWidget;
  for (const key of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
    assert.equal(state.banner.click({ [key]: true }).defaultPrevented, false);
  }
  assert.equal(native.opens, 0);
  native.wrapper.remove();
  assert.equal(state.banner.click().defaultPrevented, false, 'fallback works even before the mutation callback');
  state.flush(); assert.equal(state.footer.click().defaultPrevented, false);
});

test('the original close button clears the open state and returns focus to the last shortcut', () => {
  const state = setup({ early: true }), native = state.initialWidget;
  state.footer.click(); state.flush(); native.close.click(); state.flush();
  assert.equal(native.closes, 1); assert.equal(state.isOpen(), false);
  assert.equal(state.document.activeElement, state.footer);
  assert.ok(state.links.every(link => link.getAttribute('aria-expanded') === 'false'));
  state.banner.click(); state.flush(); assert.equal(native.opens, 2);
});

test('conversion-style DOM removal restores contact actions, focus, ARIA and direct fallback', () => {
  const state = setup({ early: true }), native = state.initialWidget;
  state.banner.click(); state.flush();
  assert.equal(native.wrapper.classList.contains('floating-button--close'), false);
  native.wrapper.remove(); state.flush();
  assert.equal(state.isOpen(), false, 'the fixed contact action must not stay hidden after RD removes its popup');
  assert.equal(state.document.activeElement, state.banner);
  for (const link of state.links) {
    for (const attribute of ['aria-haspopup', 'aria-controls', 'aria-expanded']) assert.equal(link.hasAttribute(attribute), false);
    assert.equal(link.click().defaultPrevented, false);
    assert.equal(link.getAttribute('href'), state.destination);
  }
  assert.equal(native.closes, 0, 'removal must not require a class change or native close event');
});

test('a replacement widget reconnects without stacking shortcut listeners', () => {
  const state = setup({ early: true }), first = state.initialWidget;
  state.banner.click(); state.flush(); first.wrapper.remove();
  const second = state.widget(); state.flush();
  assert.equal(state.isOpen(), false);
  for (const link of state.links) {
    assert.equal(link.getAttribute('aria-controls'), second.wrapper.id);
    assert.equal(link.listeners.get('click').length, 1);
  }
  state.footer.click(); state.flush();
  assert.equal(first.opens, 1); assert.equal(second.opens, 1); assert.equal(state.isOpen(), true);
  second.close.click(); state.flush(); assert.equal(state.document.activeElement, state.footer);
});

test('Escape uses the original close handler and respects already handled keyboard events', () => {
  const state = setup({ early: true }), native = state.initialWidget;
  state.banner.click(); state.flush();
  state.key(native.input, 'Escape', { defaultPrevented: true }); state.flush();
  assert.equal(native.closes, 0); assert.equal(state.isOpen(), true);
  const pressed = state.key(native.input, 'Escape'); state.flush();
  assert.equal(pressed.defaultPrevented, true); assert.equal(native.closes, 1);
  assert.equal(state.isOpen(), false); assert.equal(state.document.activeElement, state.banner);
  state.key(native.input, 'Escape'); assert.equal(native.closes, 1, 'closed widgets do not consume Escape');
});

test('Tab wraps between visible enabled controls without overriding interior or handled navigation', () => {
  const state = setup({ early: true }), native = state.initialWidget;
  state.banner.click(); state.flush();
  native.close.focus();
  assert.equal(state.key(native.close, 'Tab', { shiftKey: true }).defaultPrevented, true);
  assert.equal(state.document.activeElement, native.send, 'hidden, disabled and negative-tabindex controls are excluded');
  assert.equal(state.key(native.send, 'Tab').defaultPrevented, true);
  assert.equal(state.document.activeElement, native.close);
  native.input.focus(); assert.equal(state.key(native.input, 'Tab').defaultPrevented, false);
  native.send.focus(); state.key(native.send, 'Tab', { defaultPrevented: true });
  assert.equal(state.document.activeElement, native.send);
});
