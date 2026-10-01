/* Real contact adapter against native dialog events; no SDK or lead submission. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const readRuntimeSource = require('./read-runtime-source.cjs');
const path = require('node:path');
const {JSDOM} = require(path.join(process.env.UNITED_CODE_TOOLS || '/private/tmp/united-code-tools', 'node_modules/jsdom'));
const source = readRuntimeSource('contact-preview.js');

function fixture() {
  const dom = new JSDOM('<section id="contato"><div data-rd-contact>' +
    '<label>Nome<input name="nome"></label><button type="button">Continuar</button>' +
    '</div></section>', {
    url:'https://www.unitedidiomas.com/', runScripts:'outside-only', pretendToBeVisual:true,
  });
  const w = dom.window, d = w.document;
  w.HTMLDialogElement.prototype.showModal = function () {this.open = true;};
  w.HTMLDialogElement.prototype.close = function () {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new w.Event('close'));
  };
  w.eval(source);
  const dialog = d.querySelector('dialog');
  let reads = 0;
  dialog.getBoundingClientRect = () => {
    reads++;
    return {left:100, top:100, right:500, bottom:600};
  };
  d.querySelector('[data-contact-open]').click();
  return {
    w, d, dialog,
    get reads(){return reads;},
    tap(target, x, y){
      const options = {bubbles:true, cancelable:true, clientX:x, clientY:y};
      target.dispatchEvent(new w.MouseEvent('pointerdown', options));
      target.dispatchEvent(new w.MouseEvent('click', options));
    },
    close(){w.close();},
  };
}

test('tapping form inputs and buttons never measures the dialog backdrop', () => {
  const f = fixture();
  try {
    assert.equal(f.dialog.open, true);
    f.tap(f.d.querySelector('[data-rd-contact] input'), 150, 150);
    f.tap(f.d.querySelector('[data-rd-contact] button'), 150, 300);
    assert.equal(f.reads, 0);
    assert.equal(f.dialog.open, true);
  } finally {f.close();}
});

test('pressing and clicking outside the panel closes the dialog', () => {
  const f = fixture();
  try {
    f.tap(f.dialog, 20, 20);
    assert.equal(f.dialog.open, false);
    assert.equal(f.reads, 2);
    assert.equal(f.d.querySelector('#contato [data-rd-contact]') !== null, true);
  } finally {f.close();}
});

test('clicking the dialog padding inside its bounds keeps it open', () => {
  const f = fixture();
  try {
    f.tap(f.dialog, 120, 120);
    assert.equal(f.dialog.open, true);
    assert.equal(f.reads, 1);
  } finally {f.close();}
});
