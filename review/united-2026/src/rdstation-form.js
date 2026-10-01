(function () {
  'use strict';
  const container = document.querySelector('[data-rd-contact]');
  if (!container || container.dataset.rdInitialized) return;
  container.dataset.rdInitialized = 'true';
  const mount = container.querySelector('[data-rd-mount]');
  const status = container.querySelector('[data-rd-status]');
  const error = container.querySelector('[data-rd-error]');
  const success = container.querySelector('[data-rd-success]');
  const SDK_URL = 'https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js';
  const attempts = new Map();
  let completed = false;
  let requested = false;
  let created = false;
  let timeout;
  let visibilityObserver = null;
  container.dataset.rdLoadState = 'idle';
  function showConfirmation() {
    const originalUrl = attempts.get(window.location.hash);
    if (!originalUrl || completed) return;
    // The SDK follows this fragment only in its successful conversion handler.
    // Ignore page loads, unrelated hashes, validation errors and failed requests.
    completed = true;
    attempts.clear();
    window.history.replaceState(window.history.state, '', originalUrl);
    mount.hidden = true;
    status.hidden = true;
    error.hidden = true;
    success.hidden = false;
    container.dataset.rdComplete = 'true';
    container.dispatchEvent(new CustomEvent('united:rd-form-success', {bubbles: true}));
    success.focus({preventScroll: true});
  }
  window.addEventListener('hashchange', showConfirmation);
  function prepareConfirmation(event) {
    if (completed) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const rdForm = event.currentTarget;
    const originalUrl = window.location.href;
    const destinationUrl = new URL(originalUrl);
    const nonce = Array.from(window.crypto.getRandomValues(new Uint32Array(4))).join('-');
    destinationUrl.hash = 'united-rd-confirmed-' + nonce;
    attempts.set(destinationUrl.hash, originalUrl);
    const destination = btoa(destinationUrl.href);
    rdForm.dataset.assetAction = destination;
    if (window.jQuery) window.jQuery(rdForm).data('assetAction', destination);
    // RD appends its own redirect field; keep older attempts consistent too.
    rdForm.querySelectorAll('input[name="redirect_to"]').forEach(function (input) { input.value = destinationUrl.href; });
    const message = rdForm.querySelector('input[name="thankyou_message"]');
    if (message) message.value = '';
    // Do not cancel submission: RD still validates and sends the real conversion.
  }
  container.querySelector('[data-rd-reload]').addEventListener('click', function () {
    // A full reload retries the SDK without registering a second form or handler.
    window.location.reload();
  });
  function unavailable() {
    if (mount.querySelector('form')) return;
    container.dataset.rdLoadState = 'error';
    status.hidden = true;
    error.hidden = false;
  }
  function hideHoneypots() {
    // These two readonly fields are RD's anti-spam controls, not visitor fields.
    // Keep their names, types, values and successful-control status untouched.
    mount.querySelectorAll('input[name="emP7yF13ld"][readonly], input[name="sh0uldN07ch4ng3"][readonly]').forEach(function (input) {
      input.hidden = true;
      input.setAttribute('aria-hidden', 'true');
      input.tabIndex = -1;
    });
  }
  // Keep RD's own Brazil/+55 mask; the country picker is hidden, not recreated.
  const countryObserver = new MutationObserver(function () {
    hideHoneypots();
    mount.querySelectorAll('.phone-input-group').forEach(function (group) {
      const defaultCountry = group.querySelector('.country-field');
      const selector = group.querySelector('.phone-country');
      const phone = group.querySelector('input.phone');
      if (defaultCountry && defaultCountry.getAttribute('value') !== 'BR') defaultCountry.setAttribute('value', 'BR');
      if (selector && window.jQuery) {
        const field = window.jQuery(selector);
        if (field.data('select2') && field.select2('val') !== 'BR') field.select2('val', 'BR').trigger('change');
      }
      if (phone && phone.dataset.country !== 'BR') phone.dataset.country = 'BR';
      // The fixed-country Select2 choice is a hidden widget control, not a URL.
      // Keep its node and plugin handlers; only remove the non-navigation href.
      group.querySelectorAll('.select2-container a.select2-choice').forEach(function (choice) {
        if (/^javascript:void\(0\);?$/i.test((choice.getAttribute('href') || '').trim())) {
          choice.removeAttribute('href');
          choice.setAttribute('role', 'button');
          choice.setAttribute('aria-hidden', 'true');
          choice.tabIndex = -1;
        }
      });
    });
  });
  const observer = new MutationObserver(function () {
    const rdForm = mount.querySelector('form');
    if (!rdForm) return;
    hideHoneypots();
    // Replace the old-site destination only when this form is submitted.
    rdForm.dataset.assetAction = '';
    if (window.jQuery) window.jQuery(rdForm).data('assetAction', '');
    const message = rdForm.querySelector('input[name="thankyou_message"]');
    if (message) message.value = '';
    rdForm.addEventListener('submit', prepareConfirmation, true);
    status.hidden = true;
    error.hidden = true;
    container.dataset.rdLoadState = 'ready';
    clearTimeout(timeout);
    observer.disconnect();
    container.dispatchEvent(new CustomEvent('united:rd-form-ready', {bubbles: true}));
  });
  function createForm() {
    if (created) return;
    if (typeof window.RDStationForms !== 'function') {
      clearTimeout(timeout);
      unavailable();
      return;
    }
    created = true;
    countryObserver.observe(mount, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-country', 'value', 'href']});
    observer.observe(mount, {childList: true, subtree: true});
    try {
      // Keep the official RD form's fields, validation, captcha and submission flow.
      new window.RDStationForms('form-vamos-conversar-5ba05329ea8c88b5c10d', 'UA-42887237-1').createForm();
    } catch (exception) {
      clearTimeout(timeout);
      observer.disconnect();
      countryObserver.disconnect();
      unavailable();
    }
  }
  function requestForm() {
    if (requested) return;
    requested = true;
    if (visibilityObserver) visibilityObserver.disconnect();
    container.dataset.rdLoadState = 'loading';
    status.hidden = false;
    error.hidden = true;
    // Count SDK and template loading together, starting at the actual request.
    timeout = setTimeout(unavailable, 20000);
    if (typeof window.RDStationForms === 'function') {
      createForm();
      return;
    }
    let script = document.getElementById('rdstation-forms-sdk');
    const existing = Boolean(script);
    if (!script) {
      script = document.createElement('script');
      script.id = 'rdstation-forms-sdk';
      script.src = SDK_URL;
      script.async = true;
    }
    script.addEventListener('load', createForm, {once: true});
    script.addEventListener('error', function () {
      clearTimeout(timeout);
      unavailable();
    }, {once: true});
    if (!existing) document.head.appendChild(script);
  }
  // The account loader and its attribution/WhatsApp tracking stay independent.
  // Only the offscreen embedded form waits for an actual navigation intent.
  container.addEventListener('united:rd-form-request', requestForm);
  container.addEventListener('focusin', requestForm);
  function requestHashTarget() {
    if (window.location.hash === '#contato') requestForm();
  }
  window.addEventListener('hashchange', requestHashTarget);
  if (typeof window.RDStationForms === 'function' || window.location.hash === '#contato' || typeof window.IntersectionObserver !== 'function') {
    requestForm();
  } else {
    visibilityObserver = new window.IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) requestForm();
    }, {rootMargin: '300px'});
    visibilityObserver.observe(container);
  }
})();
