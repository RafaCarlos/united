/* Real jQuery/structure execution in a DOM; no external scripts or lead submissions. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {JSDOM} = require(path.join(process.env.UNITED_CODE_TOOLS || '/private/tmp/united-code-tools', 'node_modules/jsdom'));
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }
async function page(route, full) {
  const html = read('dist/' + (route === '/' ? '' : route.slice(1)) + 'index.html');
  const dom = new JSDOM(html, {url:'https://www.unitedidiomas.com' + route, runScripts:'outside-only', pretendToBeVisual:true});
  const w = dom.window;
  const errors = [];
  const observers = [];
  w.MutationObserver = class extends w.MutationObserver {
    constructor(callback) { super(callback); observers.push(this); }
  };
  w.addEventListener('error', event => errors.push(event.error));
  w.matchMedia = query => ({matches:query.includes('max-width'), media:query, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){}});
  w.HTMLElement.prototype.scrollIntoView = function() {};
  w.eval(read(full ? 'dist/assets/js/dist/scripts.js' : 'dist/assets/js/dist/scripts-core.js'));
  w.eval(read('src/shared-header.js'));
  await new Promise(resolve => w.setTimeout(resolve, 40));
  try {
    check(errors.length === 0, route + ': no initialization exception');
    check(w.jQuery.fn.jquery === '3.1.1', route + ': jQuery global retained');
    check(typeof w.jQuery.fn.mask === 'function', route + ': phone mask plugin retained');
    check(typeof w.WOW === 'function', route + ': existing animation API retained');
    if (!full) {
      check(typeof w.jQuery.fn.slick === 'undefined', route + ': Slick is absent');
      const target = w.document.createElement('div'); target.className = 'carousel-steps'; w.document.body.append(target);
      w.structure.carousel('.carousel-steps', {});
      check(errors.length === 0, route + ': a target without plugin does not throw');
      let calls = 0;
      w.jQuery.fn.slick = function(options) { calls++; check(this[0] === target && options.slidesToShow === 2, route + ': guarded plugin receives target and settings'); return this; };
      w.structure.carousel('.carousel-steps', {slidesToShow:2});
      w.structure.carousel('.nonexistent-carousel', {});
      check(calls === 1, route + ': no initialization on an empty selection');
      delete w.jQuery.fn.slick;
      target.remove();
    } else {
      check(w.document.querySelectorAll('.carousel-methodology.slick-initialized').length === 1, 'Quem Somos keeps its actual Slick carousel');
      check(w.document.querySelectorAll('.carousel-methodology .slick-slide').length > 0, 'Methodology slides render');
    }
    const opener = w.document.querySelector('.open-menu');
    opener.click();
    check(opener.getAttribute('aria-expanded') === 'true', route + ': menu opens');
    w.document.querySelector('.close-menu').click();
    check(opener.getAttribute('aria-expanded') === 'false', route + ': menu closes');
    const footer = w.document.querySelector('footer .accordeon .open-item');
    footer.click(); w.jQuery(footer.nextElementSibling).finish();
    check(footer.classList.contains('open'), route + ': footer accordion opens');
    footer.click(); w.jQuery(footer.nextElementSibling).finish();
    check(!footer.classList.contains('open'), route + ': footer accordion closes');
    if (route === '/faq/') {
      const toggle = w.document.querySelector('.faq-toggle');
      toggle.click();
      check(toggle.getAttribute('aria-expanded') === 'true' && toggle.nextElementSibling.hidden === false, 'FAQ opens an answer');
      toggle.click();
      check(toggle.getAttribute('aria-expanded') === 'false' && toggle.nextElementSibling.hidden, 'FAQ closes an answer');
      const search = w.document.querySelector('#busca');
      search.value = 'Jimmy'; search.dispatchEvent(new w.Event('input', {bubbles:true}));
      const shown = [...w.document.querySelectorAll('.faq .question')].filter(item => !item.hidden);
      check(shown.length > 0 && shown.every(item => /Jimmy/i.test(item.textContent)), 'FAQ search filters actual answers');
      search.value = 'zzzz-sem-resultado'; search.dispatchEvent(new w.Event('input', {bubbles:true}));
      check(w.document.querySelector('.faq-empty').hidden === false, 'FAQ announces no results');
      search.value = ''; search.dispatchEvent(new w.Event('input', {bubbles:true}));
      check([...w.document.querySelectorAll('.faq .question')].every(item => !item.hidden), 'FAQ restores all questions');
    }
    await new Promise(resolve => w.setTimeout(resolve, 0));
    check(errors.length === 0, route + ': no errors after interactions');
  } finally {
    // jsdom tears down document before queued callbacks; clean up observers as
    // a real browsing context does when navigating away.
    observers.forEach(observer => observer.disconnect());
    w.close();
  }
}
(async () => {
  for (const route of ['/', '/cursos/', '/faq/']) await page(route, false);
  await page('/quem-somos/', true);
  console.log(checks + ' behavioral checks passed across four pages. No external requests or lead submissions.');
})().catch(error => {console.error(error); process.exitCode = 1;});
