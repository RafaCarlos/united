/* Review navigation keeps its controls and announcements accurate during scroll/resize. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const readRuntimeSource = require('./read-runtime-source.cjs');
const path = require('node:path');
const {JSDOM} = require(path.join(process.env.UNITED_CODE_TOOLS || '/private/tmp/united-code-tools', 'node_modules/jsdom'));
const source = readRuntimeSource('site-refinement.js');

function fixture() {
  const dom = new JSDOM('<section class="reviews-section"><div class="reviews-track">' +
    '<article class="review-card"></article>'.repeat(3) +
    '</div><button data-review-prev></button><button data-review-next></button>' +
    '<p class="reviews-status" aria-live="polite"></p></section>', {
    url:'https://www.unitedidiomas.com/', runScripts:'outside-only', pretendToBeVisual:true,
  });
  const w = dom.window, d = w.document, frames = new Map(), trace = [];
  const track = d.querySelector('.reviews-track'), status = d.querySelector('.reviews-status');
  const previous = d.querySelector('[data-review-prev]'), next = d.querySelector('[data-review-next]');
  let width = 200, left = 0, sequence = 0;
  w.matchMedia = () => ({matches:false});
  w.requestAnimationFrame = callback => { const id = ++sequence; frames.set(id, callback); return id; };
  track.getBoundingClientRect = () => { trace.push('read'); return {left:0, right:width}; };
  Object.defineProperties(track, {
    scrollLeft:{get(){trace.push('read'); return left;}},
    scrollWidth:{get(){trace.push('read'); return 580;}},
    clientWidth:{get(){trace.push('read'); return width;}},
  });
  Array.from(track.children).forEach((card, index) => {
    card.getBoundingClientRect = () => { trace.push('read'); return {left:index * 200 - left, width:180}; };
  });
  const disabled = Object.getOwnPropertyDescriptor(w.HTMLButtonElement.prototype, 'disabled');
  for (const button of [previous, next]) Object.defineProperty(button, 'disabled', {
    get(){return disabled.get.call(this);},
    set(value){trace.push('write'); disabled.set.call(this, value);},
  });
  const text = Object.getOwnPropertyDescriptor(w.Node.prototype, 'textContent');
  Object.defineProperty(status, 'textContent', {
    get(){return text.get.call(this);},
    set(value){trace.push('announce'); text.set.call(this, value);},
  });
  w.eval(source);
  return {
    w, track, status, previous, next, frames, trace,
    scroll(value){left = value; track.dispatchEvent(new w.Event('scroll'));},
    resize(value){width = value; w.dispatchEvent(new w.Event('resize'));},
    paint(){const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback());},
    close(){w.close();},
  };
}

test('scroll and resize bursts update once using the final viewport and announce only changed cards', () => {
  const f = fixture();
  try {
    assert.equal(f.status.textContent, 'Depoimento 1 de 3');
    assert.equal(f.previous.disabled, true);
    f.trace.length = 0;
    f.scroll(100); f.resize(200); f.scroll(200);
    assert.equal(f.frames.size, 1);
    assert.deepEqual(f.trace, []);
    f.paint();
    assert.equal(f.status.textContent, 'Depoimento 2 de 3');
    assert.equal(f.previous.disabled, false);
    assert.equal(f.next.disabled, false);
    assert.equal(f.trace.filter(action => action === 'announce').length, 1);
    const firstWrite = f.trace.findIndex(action => action !== 'read');
    assert.ok(firstWrite > 0);
    assert.equal(f.trace.slice(firstWrite).includes('read'), false, 'no geometry read after controls change');
    f.trace.length = 0;
    f.scroll(200); f.resize(200); f.paint();
    assert.equal(f.trace.includes('announce'), false, 'unchanged cards do not repeat the live announcement');
    assert.equal(f.trace.includes('write'), false);
  } finally {f.close();}
});

test('last-card and wider-screen controls remain accurate after resize', () => {
  const f = fixture();
  try {
    f.scroll(380); f.paint();
    assert.equal(f.status.textContent, 'Depoimento 3 de 3');
    assert.equal(f.next.disabled, true);
    f.scroll(0); f.resize(580); f.paint();
    assert.equal(f.status.textContent, 'Depoimentos 1 a 3 de 3');
    assert.equal(f.previous.disabled, true);
    assert.equal(f.next.disabled, true);
  } finally {f.close();}
});
