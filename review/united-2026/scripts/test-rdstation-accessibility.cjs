/* Real DOM accessibility contracts; no remote SDK, requests or lead submissions. */
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const {JSDOM} = require(path.join(process.env.UNITED_CODE_TOOLS || '/private/tmp/united-code-tools', 'node_modules/jsdom'));
const source = readFileSync(path.join(__dirname, '../src/rdstation-form.js'), 'utf8');

async function setup() {
  const dom = new JSDOM(`<section data-rd-contact>
    <div data-rd-mount></div><p data-rd-status>Carregando</p>
    <div data-rd-error hidden><button data-rd-reload>Recarregar</button></div>
    <div data-rd-success hidden tabindex="-1">Mensagem enviada</div>
  </section>`, {url:'https://example.invalid/', runScripts:'outside-only'});
  const w = dom.window, observers = [], cache = new Map();
  const mount = w.document.querySelector('[data-rd-mount]');
  let form, before, changes = 0, nativeClicks = 0, nativeSubmits = 0;
  w.MutationObserver = class extends w.MutationObserver {
    constructor(callback) { super(callback); observers.push(this); }
  };
  w.jQuery = element => ({
    data(key, value) {
      if (key === 'select2') return true;
      const values = cache.get(element) || {};
      if (arguments.length === 1) return values[key];
      values[key] = value; cache.set(element, values); return this;
    },
    select2(method, value) {
      assert.equal(method, 'val');
      if (arguments.length === 1) return element.value;
      element.value = value; return this;
    },
    trigger(name) { assert.equal(name, 'change'); changes++; return this; },
  });
  w.RDStationForms = class {
    createForm() {
      mount.innerHTML = `<form>
        <label for="email">E-mail</label><input id="email" name="email" value="fixture@example.invalid">
        <input name="emP7yF13ld" type="text" value="" readonly>
        <input name="sh0uldN07ch4ng3" type="text" value="rd-fixture-token" readonly>
        <input name="other_readonly" value="retained" readonly>
        <div class="phone-input-group">
          <input class="country-field" name="country" value="BR">
          <select class="phone-country" name="phone_country"><option value="BR" selected>Brasil</option></select>
          <div class="select2-container"><a class="select2-choice" href="javascript:void(0)" tabindex="-1">Brasil</a></div>
          <input class="phone" name="personal_phone" value="" data-country="BR">
        </div>
        <a class="select2-choice" href="https://example.invalid/help">Ajuda</a>
        <input name="thankyou_message" value=""><button type="submit">Enviar</button>
      </form>`;
      form = mount.querySelector('form');
      before = [...new w.FormData(form)];
      form.querySelector('.phone-input-group .select2-choice').addEventListener('click', event => { event.preventDefault(); nativeClicks++; });
      form.addEventListener('submit', event => { event.preventDefault(); nativeSubmits++; });
    }
  };
  const flush = () => new Promise(resolve => w.setTimeout(resolve, 0));
  w.eval(source); await flush();
  return {w, form, before, mount, flush, cache,
    get changes() { return changes; }, get nativeClicks() { return nativeClicks; }, get nativeSubmits() { return nativeSubmits; },
    close() { observers.forEach(observer => observer.disconnect()); w.close(); },
  };
}

test('RD honeypots leave the accessible form without changing successful form controls', async () => {
  const state = await setup();
  try {
    assert.deepEqual([...new state.w.FormData(state.form)], state.before, 'serialized names and values are unchanged');
    for (const name of ['emP7yF13ld', 'sh0uldN07ch4ng3']) {
      const input = state.form.elements.namedItem(name);
      assert.equal(input.hidden, true); assert.equal(input.getAttribute('aria-hidden'), 'true');
      assert.equal(input.tabIndex, -1); assert.equal(input.type, 'text');
      assert.equal(input.disabled, false); assert.equal(input.readOnly, true);
    }
    assert.equal(state.form.elements.namedItem('email').hidden, false);
    assert.equal(state.form.elements.namedItem('other_readonly').hidden, false, 'do not hide unrelated readonly fields');
    const event = new state.w.Event('submit', {bubbles:true, cancelable:true});
    state.form.dispatchEvent(event);
    assert.equal(state.nativeSubmits, 1, 'native SDK submission handler remains registered');
    assert.equal(state.w.document.querySelector('[data-rd-success]').hidden, true, 'accessibility changes cannot confirm conversion');
  } finally { state.close(); }
});

test('late honeypots and recreated Select2 controls are normalized while BR, nodes and handlers remain intact', async () => {
  const state = await setup();
  try {
    const choice = state.form.querySelector('.phone-input-group .select2-choice');
    assert.equal(choice.hasAttribute('href'), false);
    assert.equal(choice.getAttribute('role'), 'button');
    assert.equal(choice.getAttribute('aria-hidden'), 'true');
    assert.equal(choice.tabIndex, -1);
    choice.click(); assert.equal(state.nativeClicks, 1);
    assert.equal(state.form.querySelector('a[href="https://example.invalid/help"]').textContent, 'Ajuda', 'real links are unchanged');
    choice.setAttribute('href', 'javascript:void(0)');
    state.form.insertAdjacentHTML('beforeend', '<input name="emP7yF13ld" value="late-token" readonly>');
    await state.flush();
    assert.equal(state.form.querySelector('.phone-input-group .select2-choice'), choice, 'the SDK node is not replaced');
    assert.equal(choice.hasAttribute('href'), false);
    assert.equal(state.form.lastElementChild.hidden, true);
    assert.equal(state.form.lastElementChild.value, 'late-token');
    assert.equal(state.form.querySelector('.phone-country').value, 'BR');
    assert.equal(state.form.querySelector('.phone').dataset.country, 'BR');
    assert.equal(state.changes, 0, 'an already-correct country does not trigger change loops');
    const controls = [...new state.w.FormData(state.form)];
    assert.deepEqual(controls.slice(0, state.before.length), state.before);
    assert.deepEqual(controls.at(-1), ['emP7yF13ld', 'late-token']);
  } finally { state.close(); }
});
