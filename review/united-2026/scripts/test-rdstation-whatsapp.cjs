/* Behavior of the local WhatsApp adapter against the native widget's DOM contract.
 * No remote SDK, network requests or contact data are used. */
const assert = require('node:assert/strict');
const readRuntimeSource = require('./read-runtime-source.cjs');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readRuntimeSource('rdstation-whatsapp.js');

function event(type, properties = {}) {
  return { type, defaultPrevented: false, propagationStopped: false, ...properties,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() { this.propagationStopped = true; },
  };
}

function setup({ early = false, bannerStyle = {}, mobile = false, resizeObserver = true, legacyObserver = false, contactHeight = null } = {}) {
  const observers = [], records = [], sizeObservers = [];
  const frames = new Map(), windowListeners = new Map(), viewportListeners = new Map();
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
      const styledElement = this;
      this.style = {
        getPropertyValue(name) { return this[name] || ''; },
        getPropertyPriority(name) { return this[name + 'Priority'] || ''; },
        setProperty(name, value, priority = '') {
          if (this.getPropertyValue(name) === value && this.getPropertyPriority(name) === priority) return;
          this[name] = value; this[name + 'Priority'] = priority;
          notify(styledElement, 'attributes', 'style');
        },
      };
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
    get nextSibling() { return this.parentNode?.children[this.parentNode.children.indexOf(this) + 1] || null; }
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
    appendChild(child) { child.remove(); child.parentNode = this; this.children.push(child); notify(this, 'childList'); return child; }
    insertBefore(child, reference) {
      if (!reference) return this.appendChild(child);
      child.remove();
      assert.equal(reference.parentNode, this);
      child.parentNode = this; this.children.splice(this.children.indexOf(reference), 0, child);
      notify(this, 'childList'); return child;
    }
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
    getBoundingClientRect() { this.layoutReads = (this.layoutReads || 0) + 1; return {height:this.rectHeight || 0}; }
    focus() {
      for (let node = this; node; node = node.parentNode) if (node.hasAttribute('inert')) return;
      if (this.isConnected) { document.activeElement = this; this.focuses++; }
    }
    blur() { if (document.activeElement === this) document.activeElement = document.body; }
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
  document.hidden = false;
  const destination = 'https://api.whatsapp.com/send?phone=5511940040658';
  const hero = document.body.appendChild(new Element('section', {class:'united-preview-hero'}));
  const banner = hero.appendChild(new Element('a', { class: 'banner-whatsapp', href: destination }));
  const following = hero.appendChild(new Element('p'));
  for (const [name, values] of Object.entries(bannerStyle)) banner.style.setProperty(name, ...values);
  const contact = document.body.appendChild(new Element('section', { id: 'contato' }));
  const footer = contact.appendChild(new Element('a', { href: destination }));
  const links = [banner, footer];
  const initialBar = contactHeight === null ? null : document.body.appendChild(new Element('div', {class:'contact-actions'}));
  if (initialBar) initialBar.rectHeight = contactHeight;
  function widget() {
    const wrapper = new Element('div', { class: 'floating-button floating-button--close', id: 'widget-' + ++sequence });
    const trigger = wrapper.appendChild(new Element('button', { class: 'rdstation-popup-js-floating-button', 'aria-label': 'Abrir WhatsApp' }));
    const close = wrapper.appendChild(new Element('button', { class: 'rdstation-popup-js-close-button' }));
    const input = wrapper.appendChild(new Element('input'));
    const disabled = wrapper.appendChild(new Element('input')); disabled.disabled = true;
    const student = wrapper.appendChild(new Element('a', {href:destination})); student.textContent = 'CLIQUE AQUI';
    const send = wrapper.appendChild(new Element('button'));
    const hidden = wrapper.appendChild(new Element('button')); hidden.hidden = true;
    const invisible = wrapper.appendChild(new Element('button')); invisible.visibility = 'hidden';
    const state = { wrapper, trigger, close, input, disabled, student, send, hidden, invisible, opens: 0, closes: 0, studentClicks: 0 };
    student.addEventListener('click', () => state.studentClicks++);
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
  class ResizeObserver {
    constructor(callback) { this.callback = callback; sizeObservers.push(this); }
    observe(target, options) {
      if (legacyObserver && options) throw new TypeError('Observation options are not supported');
      this.target = target; this.active = true;
    }
    disconnect() { this.active = false; }
  }
  function deliverSize(bar, box = 'array') {
    const size = {blockSize:bar.rectHeight, inlineSize:390};
    const entry = {target:bar, contentRect:{height:40}};
    if (box !== 'missing' && !legacyObserver) entry.borderBoxSize = box === 'object' ? size : [size];
    sizeObservers.filter(observer => observer.active && observer.target === bar).forEach(observer => observer.callback([entry]));
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
  const media = {matches:mobile, listeners:[], addEventListener(type, callback) { this.listeners.push(callback); }};
  function addListener(target, type, callback) {
    if (!target.has(type)) target.set(type, []);
    target.get(type).push(callback);
  }
  const window = {
    matchMedia:() => media,
    addEventListener(type, callback) { addListener(windowListeners, type, callback); },
    requestAnimationFrame(callback) { const id = ++sequence; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    visualViewport: {addEventListener(type, callback) { addListener(viewportListeners, type, callback); }},
  };
  const context = vm.createContext({ document, window, MutationObserver, ResizeObserver: resizeObserver ? ResizeObserver : undefined,
    getComputedStyle: element => ({ visibility: element.visibility }), fetch: rejectNetwork, XMLHttpRequest: rejectNetwork,
  });
  vm.runInContext(source, context); flush();
  if (initialBar) deliverSize(initialBar);
  return { document, hero, following, links, banner, footer, destination, widget, initialWidget, initialBar, flush, frames,
    setMobile(matches) { media.matches = matches; media.listeners.forEach(callback => callback({matches})); flush(); },
    setViewportSilently(matches) { media.matches = matches; },
    windowEvent(type) { (windowListeners.get(type) || []).forEach(callback => callback(event(type))); },
    visualResize() { (viewportListeners.get('resize') || []).forEach(callback => callback(event('resize'))); },
    setHidden(hidden) { document.hidden = hidden; document.dispatchEvent(event('visibilitychange')); },
    paint() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); flush(); },
    addContactBar(height) {
      const bar = new Element('div', {class:'contact-actions'}); bar.rectHeight = height;
      document.body.appendChild(bar); flush(); deliverSize(bar); return bar;
    },
    resizeBar(bar, height, box = 'array') {
      bar.rectHeight = height;
      deliverSize(bar, box);
      flush();
    },
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

test('mobile shortcut lives outside the hero while retaining fallback and native RD delegation', () => {
  const state = setup({mobile:true});
  assert.equal(state.banner.parentNode, state.document.body, 'hero clipping and stacking cannot affect the fixed shortcut');
  assert.equal(state.banner.style.getPropertyValue('position'), 'fixed');
  assert.equal(state.banner.style.getPropertyValue('z-index'), '106');
  assert.equal(state.document.querySelectorAll('.banner-whatsapp').length, 1);
  assert.equal(state.banner.click().defaultPrevented, false, 'direct link works before RD is ready');
  const native = state.widget(); state.flush();
  state.banner.click(); state.flush();
  assert.equal(native.opens, 1); assert.equal(state.isOpen(), true);
  native.close.click(); state.flush();
  assert.equal(state.document.activeElement, state.banner);
  assert.equal(state.banner.getAttribute('href'), state.destination);
});

test('viewport changes restore the same shortcut to its original desktop location without duplicate listeners', () => {
  const state = setup({early:true}), native = state.initialWidget;
  for (let cycle = 0; cycle < 3; cycle++) {
    state.setMobile(true);
    assert.equal(state.banner.parentNode, state.document.body);
    assert.equal(state.banner.style.getPropertyValue('position'), 'fixed');
    state.banner.click(); state.flush(); native.close.click(); state.flush();
    state.setMobile(false);
    assert.equal(state.banner.parentNode, state.hero);
    assert.equal(state.banner.nextSibling, state.following);
    assert.equal(state.banner.style.getPropertyValue('position'), 'absolute');
    assert.equal(state.banner.style.getPropertyValue('z-index'), '9');
    assert.equal(state.banner.listeners.get('click').length, 1);
    assert.equal(state.document.querySelectorAll('.banner-whatsapp').length, 1);
  }
  assert.equal(native.opens, 3);
  assert.equal(state.footer.parentNode.id, 'contato');
});

test('a late contact bar and height changes reserve its actual height for mobile spacing', () => {
  const state = setup({mobile:true});
  const bar = state.addContactBar(73);
  assert.equal(bar.layoutReads || 0, 0, 'inserting the bar must not force layout');
  state.paint();
  assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'), '73px');
  state.resizeBar(bar, 95.4);
  state.paint();
  assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'), '96px');
  assert.equal(state.banner.style.getPropertyValue('position'), 'fixed');
  assert.equal(state.banner.style.getPropertyValue('z-index'), '106');
  state.resizeBar(bar, 95.4);
  state.paint();
  assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'), '96px', 'unchanged measurements settle without a style loop');
  assert.equal(bar.layoutReads || 0, 0, 'observer border boxes include padding without additional geometry reads');
});

test('an existing contact bar is initialized from its observer without forcing first-load layout', () => {
  const state = setup({mobile:true, contactHeight:107});
  assert.equal(state.initialBar.layoutReads || 0, 0);
  state.paint();
  assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'), '107px');
  assert.equal(state.initialBar.layoutReads || 0, 0);
});

test('resize bursts use the latest border-box height, including the older object format', () => {
  const state = setup({mobile:true});
  const bar = state.addContactBar(73);
  state.resizeBar(bar, 88);
  state.windowEvent('resize');
  state.resizeBar(bar, 101.2, 'object');
  assert.equal(state.frames.size, 1, 'resize observations share one pending update');
  assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'), '');
  state.paint();
  assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'), '102px');
  assert.equal(bar.layoutReads || 0, 0, 'use the reported border box, never the smaller content rectangle');
});

test('older observer entries and browsers without ResizeObserver measure once per frame', () => {
  for (const resizeObserver of [true, false]) {
    const state = setup({mobile:true, resizeObserver});
    const bar = state.addContactBar(73);
    state.resizeBar(bar, 94, 'missing');
    state.windowEvent('resize'); state.windowEvent('resize');
    assert.equal(bar.layoutReads || 0, 0);
    assert.equal(state.frames.size, 1);
    state.paint();
    assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'), '94px');
    assert.equal(bar.layoutReads, 1);
  }
});

test('an older ResizeObserver rejecting border-box options retains safe-area resize fallback', () => {
  const state = setup({mobile:true, legacyObserver:true});
  const bar = state.addContactBar(73);
  state.paint();
  assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'), '73px');
  bar.rectHeight = 104;
  state.windowEvent('resize'); state.windowEvent('resize');
  assert.equal(bar.layoutReads, 1, 'resize waits until the next frame');
  state.paint();
  assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'), '104px');
  assert.equal(bar.layoutReads, 2);
});

test('a replaced contact bar cannot apply the detached bar height', () => {
  const state = setup({mobile:true});
  const oldBar = state.addContactBar(73);
  oldBar.remove();
  const bar = state.addContactBar(103);
  state.resizeBar(oldBar, 150);
  state.paint();
  assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'), '103px');
  assert.equal(bar.layoutReads || 0, 0);
});

test('returning from WhatsApp remeasures the bar and orientation even without a resize event', () => {
  const state = setup({mobile:true, early:true}), native = state.initialWidget;
  const bar = state.addContactBar(73);
  state.paint();
  state.banner.click(); state.flush();
  native.input.value = 'Preserve this draft';
  state.setHidden(true);
  assert.notEqual(state.document.activeElement, native.input, 'suspended input does not keep its keyboard focus');
  assert.equal(native.input.value, 'Preserve this draft');
  assert.equal(native.closes, 0, 'switching apps must not discard or close an unfinished form');
  bar.rectHeight = 96;
  state.setViewportSilently(false);
  state.setHidden(false); state.windowEvent('pageshow'); state.visualResize();
  assert.equal(state.frames.size, 1, 'return signals share one measurement frame');
  state.paint();
  assert.equal(state.banner.parentNode, state.hero);
  assert.equal(state.banner.style.getPropertyValue('position'), 'absolute');
  assert.equal(bar.layoutReads || 0, 0, 'repositioning does not force a synchronous layout read');
  state.paint();
  assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'), '96px');
  native.close.click(); state.flush();
  assert.equal(state.isOpen(), false);
  assert.equal(state.document.activeElement, state.banner);
  state.setViewportSilently(true); state.windowEvent('pageshow'); state.paint();
  assert.equal(state.banner.parentNode, state.document.body);
  assert.equal(state.banner.style.getPropertyValue('position'), 'fixed');
  assert.equal(state.document.querySelectorAll('.banner-whatsapp').length, 1);
});

test('suspended viewport frames cannot prevent recovery after bfcache and popup removal', () => {
  const state = setup({mobile:true, early:true}), native = state.initialWidget;
  state.banner.click(); state.flush();
  state.visualResize(); assert.equal(state.frames.size, 1);
  state.setHidden(true); assert.equal(state.frames.size, 0);
  native.wrapper.remove();
  state.setHidden(false); state.windowEvent('pageshow'); state.paint();
  assert.equal(state.isOpen(), false);
  assert.equal(state.banner.hasAttribute('aria-controls'), false);
  assert.equal(state.banner.hasAttribute('aria-expanded'), false);
  assert.equal(state.banner.click().defaultPrevented, false);
  assert.equal(state.banner.getAttribute('href'), state.destination);
});

test('bfcache return recovers a lost viewport-frame ticket without a visibility event', () => {
  const state = setup({mobile:true});
  const bar = state.addContactBar(73);
  state.paint();
  state.visualResize();assert.equal(state.frames.size,1);
  state.frames.clear();bar.rectHeight=104;
  state.windowEvent('pageshow');state.paint();state.paint();
  assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'),'104px');
  assert.equal(state.banner.parentNode,state.document.body);
  assert.equal(state.banner.click().defaultPrevented,false);
});

test('bfcache also recovers a discarded contact measurement frame', () => {
  const state = setup({mobile:true, resizeObserver:false});
  const bar = state.addContactBar(73);
  assert.equal(state.frames.size, 1);
  state.frames.clear();
  bar.rectHeight = 104;
  state.windowEvent('pageshow'); state.paint(); state.paint();
  assert.equal(state.banner.style.getPropertyValue('--whatsapp-contact-height'), '104px');
  assert.equal(bar.layoutReads, 1);
});

test('banner placement repairs an early fixed override while preserving offsets and its direct destination', () => {
  const state = setup({ bannerStyle: {
    position: ['fixed', 'important'], 'z-index': ['99999', 'important'],
    right: ['14px', ''], bottom: ['18px', ''], width: ['46px', ''],
  } });
  assert.equal(state.banner.style.getPropertyValue('position'), 'absolute');
  assert.equal(state.banner.style.getPropertyPriority('position'), 'important');
  assert.equal(state.banner.style.getPropertyValue('z-index'), '9');
  assert.equal(state.banner.style.getPropertyPriority('z-index'), 'important');
  for (const [name, value] of [['right', '14px'], ['bottom', '18px'], ['width', '46px']]) {
    assert.equal(state.banner.style.getPropertyValue(name), value);
  }
  assert.equal(state.banner.click().defaultPrevented, false);
  assert.equal(state.banner.getAttribute('href'), state.destination);
  state.flush();
});

test('late banner style rewrites settle without changing other links or native widget behavior', () => {
  const state = setup({ early: true }), native = state.initialWidget;
  state.footer.style.setProperty('position', 'fixed', 'important');
  state.footer.style.setProperty('z-index', '101', 'important');
  native.trigger.style.setProperty('position', 'fixed', 'important');
  native.wrapper.style.setProperty('z-index', '99999', 'important');
  for (const position of ['fixed', '', 'relative']) {
    state.banner.style.setProperty('position', position, 'important');
    state.banner.style.setProperty('z-index', '99999', 'important');
    state.banner.style.setProperty('bottom', '22px');
    state.flush();
    assert.equal(state.banner.style.getPropertyValue('position'), 'absolute');
    assert.equal(state.banner.style.getPropertyValue('z-index'), '9');
    assert.equal(state.banner.style.getPropertyValue('bottom'), '22px');
  }
  assert.equal(state.footer.style.getPropertyValue('position'), 'fixed');
  assert.equal(state.footer.style.getPropertyValue('z-index'), '101');
  assert.equal(native.trigger.style.getPropertyValue('position'), 'fixed');
  assert.equal(native.trigger.style.getPropertyValue('display'), 'none');
  assert.equal(native.wrapper.style.getPropertyValue('z-index'), '99999');
  state.banner.click(); state.flush();
  assert.equal(native.opens, 1); assert.equal(state.isOpen(), true);
  native.close.click(); state.flush();
  assert.equal(native.closes, 1); assert.equal(state.isOpen(), false);
  state.banner.click(); state.flush();
  assert.equal(native.opens, 2); assert.equal(state.isOpen(), true);
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

test('closed popup is a named inert dialog and opens before RD synchronously focuses a field', () => {
  const state = setup({early:true}), native = state.initialWidget;
  assert.equal(native.wrapper.getAttribute('role'), 'dialog');
  assert.equal(native.wrapper.getAttribute('aria-label'), 'Fale com a United pelo WhatsApp');
  assert.equal(native.wrapper.getAttribute('aria-hidden'), 'true');
  assert.equal(native.wrapper.hasAttribute('inert'), true);
  assert.equal(native.wrapper.hasAttribute('aria-modal'), false);
  native.input.focus(); assert.notEqual(state.document.activeElement, native.input);
  state.banner.click();
  assert.equal(state.document.activeElement, native.input, 'native synchronous focus works before mutation observers run');
  assert.equal(native.wrapper.hasAttribute('inert'), false);
  assert.equal(native.wrapper.hasAttribute('aria-hidden'), false);
  assert.equal(native.wrapper.getAttribute('aria-modal'), 'true');
  state.flush(); native.close.click(); state.flush();
  assert.equal(native.wrapper.getAttribute('role'), 'dialog');
  assert.equal(native.wrapper.hasAttribute('inert'), true);
  assert.equal(native.wrapper.getAttribute('aria-hidden'), 'true');
  assert.equal(state.document.activeElement, state.banner);
});

test('RD student link gains descriptive text while preserving its URL and handler', () => {
  const state = setup({early:true}), native = state.initialWidget;
  assert.equal(native.student.textContent, 'Atendimento para alunos');
  assert.equal(native.student.getAttribute('href'), state.destination);
  state.banner.click(); state.flush(); native.student.click();
  assert.equal(native.studentClicks, 1);
  assert.equal(native.opens, 1, 'student navigation is not a second conversion trigger');
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
