(function () {
  'use strict';
  const thanksUrl = new URL('obrigado/', document.currentScript.src).href;
  const container = document.querySelector('[data-rd-contact]');
  if (!container || container.dataset.rdInitialized) return;
  container.dataset.rdInitialized = 'true';
  const mount = container.querySelector('[data-rd-mount]');
  const status = container.querySelector('[data-rd-status]');
  const error = container.querySelector('[data-rd-error]');
  container.querySelector('[data-rd-reload]').addEventListener('click', function () {
    // A full reload retries the SDK without registering a second form or handler.
    window.location.reload();
  });
  function unavailable() {
    if (mount.querySelector('form')) return;
    status.hidden = true;
    error.hidden = false;
  }
  if (typeof window.RDStationForms !== 'function') {
    unavailable();
    return;
  }
  // Keep RD's own Brazil/+55 mask; the country picker is hidden, not recreated.
  const countryObserver = new MutationObserver(function () {
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
    });
  });
  countryObserver.observe(mount, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-country', 'value']});
  let timeout;
  const observer = new MutationObserver(function () {
    const rdForm = mount.querySelector('form');
    if (!rdForm) return;
    // RD follows this return URL only after a successful conversion response.
    // Override the embed's old-site destination and native alert, not its submit.
    const destination = btoa(thanksUrl);
    rdForm.dataset.assetAction = destination;
    if (window.jQuery) window.jQuery(rdForm).data('assetAction', destination);
    const message = rdForm.querySelector('input[name="thankyou_message"]');
    if (message) message.value = '';
    rdForm.querySelectorAll('input[name="redirect_to"]').forEach(function (input) { input.value = thanksUrl; });
    status.hidden = true;
    error.hidden = true;
    clearTimeout(timeout);
    observer.disconnect();
    container.dispatchEvent(new CustomEvent('united:rd-form-ready', {bubbles: true}));
  });
  observer.observe(mount, {childList: true, subtree: true});
  timeout = setTimeout(unavailable, 20000);
  try {
    // Keep the official RD form's fields, validation, captcha and submission flow.
    new window.RDStationForms('lp-vamos-coversar-cbaf85f09c7f676d42c3', 'UA-42887237-1').createForm();
  } catch (exception) {
    clearTimeout(timeout);
    observer.disconnect();
    countryObserver.disconnect();
    unavailable();
  }
})();
