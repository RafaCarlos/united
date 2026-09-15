// Run with: node scripts/check-mobile.cjs
// Exercise source behavior against the built hero without fetching external assets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM, VirtualConsole } = require('/tmp/united-seo-tools/node_modules/jsdom');

const root = path.resolve(__dirname, '..');
const markup = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'src/preview.js'), 'utf8');
const responsive = fs.readFileSync(path.join(root, 'src/responsive-home.js'), 'utf8');
const bannerIds = ['banner-institucional', 'banner-liveclass', 'banner-jimmy'];

function fixture(options = {}) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(markup, {
    url: 'https://preview.example/' + (options.query || ''),
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole
  });
  const w = dom.window;
  const d = w.document;
  let width = options.width ?? 390;
  let reduced = options.reduced ?? false;
  let hidden = options.hidden ?? false;
  let now = 0;
  let nextTimer = 0;
  const timers = new Map();
  const mediaQueries = new Map();
  const observers = [];

  w.innerWidth = width;
  w.innerHeight = 844;
  Object.defineProperty(d, 'hidden', { configurable: true, get: () => hidden });
  w.setTimeout = (callback, delay = 0) => {
    const id = ++nextTimer;
    timers.set(id, { callback, due: now + Number(delay) });
    return id;
  };
  w.clearTimeout = id => timers.delete(id);
  const matches = query => {
    if (query.includes('prefers-reduced-motion')) return reduced;
    const maximum = query.match(/max-width:\s*(\d+)px/);
    return maximum ? width <= Number(maximum[1]) : false;
  };
  w.matchMedia = query => {
    if (!mediaQueries.has(query)) {
      const listeners = new Set();
      mediaQueries.set(query, {
        media: query,
        get matches() { return matches(query); },
        addEventListener(type, callback) { if (type === 'change') listeners.add(callback); },
        removeEventListener(type, callback) { if (type === 'change') listeners.delete(callback); },
        addListener(callback) { listeners.add(callback); },
        removeListener(callback) { listeners.delete(callback); },
        listeners
      });
    }
    return mediaQueries.get(query);
  };
  function changeMedia(change) {
    const previous = new Map([...mediaQueries].map(([query, media]) => [query, media.matches]));
    change();
    for (const [query, media] of mediaQueries) {
      if (previous.get(query) !== media.matches) {
        for (const callback of media.listeners) callback({ matches: media.matches, media: query });
      }
    }
  }
  w.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() {}
  };
  w.ResizeObserver = class { observe() {} disconnect() {} };
  w.HTMLElement.prototype.scrollIntoView = function() {};

  const hero = d.querySelector('.united-preview-hero');
  assert.ok(hero, 'Build the preview before running this test');
  const tabs = [...hero.querySelectorAll('[role=tab]')];
  const playback = hero.querySelector('.preview-playback');
  assert.ok(playback, 'Built hero must include its pause/resume control');

  return {
    w, d, hero, tabs, playback,
    runPreview() { w.eval(preview); },
    tick(milliseconds) {
      const until = now + milliseconds;
      let callbacks = 0;
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.due <= until)
          .sort((a, b) => a[1].due - b[1].due)[0];
        if (!next) break;
        assert.ok(++callbacks < 100, 'Unexpected timer loop');
        const [id, timer] = next;
        timers.delete(id);
        now = timer.due;
        timer.callback();
      }
      now = until;
    },
    expectBanner(index) {
      assert.equal(hero.querySelectorAll('.preview-panel.active').length, 1);
      assert.equal(hero.querySelector('.preview-panel.active').id, bannerIds[index]);
      for (const [i, panel] of [...hero.querySelectorAll('.preview-panel')].entries()) {
        assert.equal(panel.getAttribute('aria-expanded'), String(i === index));
        assert.equal(panel.querySelector('.art-cta').tabIndex, i === index ? 0 : -1);
        assert.equal(tabs[i].getAttribute('aria-selected'), String(i === index));
        assert.equal(tabs[i].tabIndex, i === index ? 0 : -1);
      }
    },
    swipe(dx, dy = 0) {
      for (const [type, x, y] of [['touchstart', 200, 200], ['touchend', 200 + dx, 200 + dy]]) {
        const event = new w.Event(type, { bubbles: true });
        Object.defineProperty(event, 'changedTouches', { value: [{ clientX: x, clientY: y }] });
        hero.dispatchEvent(event);
      }
    },
    setWidth(value) {
      changeMedia(() => { width = value; w.innerWidth = value; });
      w.dispatchEvent(new w.Event('resize'));
    },
    setReduced(value) { changeMedia(() => { reduced = value; }); },
    setHidden(value) { hidden = value; d.dispatchEvent(new w.Event('visibilitychange')); },
    intersect(ratio) {
      for (const observer of observers) {
        observer.callback([{ target: observer.target, isIntersecting: ratio > 0, intersectionRatio: ratio }]);
      }
    },
    pendingTimers() { return timers.size; },
    close() {
      w.close();
      assert.deepEqual(errors, [], 'No uncaught DOM event errors');
    }
  };
}

function withPreview(options, check) {
  const f = fixture(options);
  try { f.runPreview(); check(f); } finally { f.close(); }
}

test('mobile rotates through all three banners every six seconds and wraps', () => {
  withPreview({ width: 768 }, f => {
    f.expectBanner(0);
    f.tick(5999);
    f.expectBanner(0);
    f.tick(1);
    f.expectBanner(1);
    f.tick(6000);
    f.expectBanner(2);
    f.tick(6000);
    f.expectBanner(0);
    assert.equal(f.pendingTimers(), 1, 'Only one future transition should be scheduled');
  });
});

test('a selected initial banner continues the same rotation order', () => {
  withPreview({ query: '?banner=3' }, f => {
    f.expectBanner(2);
    f.tick(6000);
    f.expectBanner(0);
  });
});

test('manual tab selection cancels automatic rotation until resumed', () => {
  withPreview({}, f => {
    f.tick(3000);
    f.tabs[2].click();
    f.expectBanner(2);
    assert.match(f.playback.getAttribute('aria-label'), /Retomar/);
    assert.equal(f.pendingTimers(), 0);
    f.tick(30000);
    f.expectBanner(2);
    f.playback.click();
    f.tick(6000);
    f.expectBanner(0);
  });
});

test('horizontal swipes select the next or previous banner and pause rotation', () => {
  withPreview({}, f => {
    f.swipe(-100);
    f.expectBanner(1);
    f.tick(30000);
    f.expectBanner(1);
    assert.equal(f.pendingTimers(), 0);
    f.swipe(100);
    f.expectBanner(0);
  });
});

test('vertical scrolling does not change the banner or pause its timer', () => {
  withPreview({}, f => {
    f.swipe(-30, 150);
    f.expectBanner(0);
    f.tick(6000);
    f.expectBanner(1);
  });
});

test('pause/resume gives the current banner a fresh interval', () => {
  withPreview({}, f => {
    f.tick(5500);
    f.playback.click();
    assert.match(f.playback.getAttribute('aria-label'), /Retomar/);
    f.tick(30000);
    f.expectBanner(0);
    f.playback.click();
    assert.match(f.playback.getAttribute('aria-label'), /Pausar/);
    f.tick(5999);
    f.expectBanner(0);
    f.tick(1);
    f.expectBanner(1);
  });
});

test('reduced motion prevents rotation, including when its preference changes', () => {
  withPreview({ reduced: true }, f => {
    f.tick(30000);
    f.expectBanner(0);
    assert.equal(f.pendingTimers(), 0);
    f.setReduced(false);
    f.tick(6000);
    f.expectBanner(1);
    f.setReduced(true);
    f.tick(30000);
    f.expectBanner(1);
    f.playback.click();
    f.playback.click();
    f.tick(30000);
    f.expectBanner(1);
  });
});

test('desktop never auto-rotates and crossing the mobile breakpoint updates behavior', () => {
  withPreview({ width: 769 }, f => {
    f.tick(30000);
    f.expectBanner(0);
    assert.equal(f.pendingTimers(), 0);
    f.setWidth(768);
    f.tick(6000);
    f.expectBanner(1);
    f.setWidth(1440);
    f.tick(30000);
    f.expectBanner(1);
    assert.equal(f.pendingTimers(), 0);
  });
});

test('hidden tabs suspend rotation and resume only after becoming visible', () => {
  withPreview({ hidden: true }, f => {
    f.tick(30000);
    f.expectBanner(0);
    f.setHidden(false);
    f.tick(3000);
    f.setHidden(true);
    f.tick(30000);
    f.expectBanner(0);
    assert.equal(f.pendingTimers(), 0);
    f.setHidden(false);
    f.tick(6000);
    f.expectBanner(1);
  });
});

test('offscreen or mostly scrolled-away banners suspend rotation', () => {
  withPreview({}, f => {
    f.intersect(0);
    f.tick(30000);
    f.expectBanner(0);
    f.intersect(0.24);
    f.tick(30000);
    f.expectBanner(0);
    assert.equal(f.pendingTimers(), 0);
    f.intersect(0.25);
    f.tick(6000);
    f.expectBanner(1);
    f.tabs[2].click();
    f.intersect(0);
    f.intersect(1);
    f.tick(30000);
    f.expectBanner(2);
    assert.equal(f.pendingTimers(), 0, 'Returning onscreen must preserve a manual pause');
  });
});

test('review carousel follows viewport width and motion, without user-agent detection', () => {
  const f = fixture({ width: 1024 });
  const calls = [];
  let initialized = false;
  const reviews = {
    hasClass() { return initialized; },
    slick(command, settings) {
      calls.push(['reviews', command, settings]);
      if (typeof command === 'object') initialized = true;
      if (command === 'unslick') initialized = false;
      return this;
    }
  };
  const other = selector => ({
    slick(...args) { calls.push([selector, ...args]); return this; },
    attr(...args) { calls.push([selector, ...args]); return this; }
  });
  function jquery(selector) {
    if (typeof selector === 'function') { selector(); return; }
    return selector === '.avaliacoes .masonry' ? reviews : other(selector);
  }
  Object.defineProperty(jquery, 'browser', {
    get() { throw new Error('Responsive initialization must not inspect the user agent'); }
  });
  f.w.jQuery = jquery;
  try {
    f.w.eval(responsive);
    assert.equal(initialized, true, 'A 1024px desktop viewport must initialize mobile reviews');
    const initial = calls.find(call => call[0] === 'reviews' && typeof call[1] === 'object')[1];
    assert.equal(initial.autoplay, true);
    assert.equal(initial.adaptiveHeight, true);
    const steps = calls.find(call => call[0] === '.carousel-steps.slick-initialized');
    assert.equal(steps[2].responsive[0].breakpoint, 1025, 'Slick must agree with the inclusive CSS boundary');
    assert.equal(steps[2].adaptiveHeight, true);
    f.setReduced(true);
    const updated = calls.filter(call => call[0] === 'reviews').at(-1);
    assert.equal(updated[1], 'slickSetOption');
    assert.equal(updated[2].autoplay, false);
    assert.equal(updated[2].speed, 0);
    f.setWidth(1025);
    assert.equal(initialized, false, 'Desktop layout must remove the review slider');
    assert.equal(calls.filter(call => call[0] === 'reviews').at(-1)[1], 'unslick');
    f.setWidth(390);
    assert.equal(initialized, true, 'Returning to mobile must restore the review slider');
    assert.equal(calls.filter(call => call[0] === 'reviews').at(-1)[1].autoplay, false);
  } finally { f.close(); }
});
