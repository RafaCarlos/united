(function () {
  'use strict';
  if (window.UnitedContactForm) return;
  const FORM_ID = 'form-vamos-conversar-5ba05329ea8c88b5c10d';
  const SDK_URL = 'https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js';
  let dialog = null;
  let returnFocus = null;
  let requestForm = null;
  let sdkRequest = null;
  const inlineHost = document.querySelector('[data-contact-inline]');
  let contactBody = null;
  const CONTACT_SELECTOR = '[data-contact-form], a[href="#contato"]';
  const IDLE_WARM_DELAY = 4000;
  let pageLoaded = document.readyState === 'complete';
  let formWarmed = false;
  let warmTimer = null;
  let warmIdle = null;

  // Timing: never start background RD work during the initial render. Wait for
  // window.load, two paints, 4 seconds and an idle slot; skip hidden pages,
  // Save-Data and slow connections. Explicit CTA intent bypasses this wait.
  // The native dialog stays closed/inert while RD prepares its real controls.
  function mark(name) {
    if (window.performance && typeof performance.mark === 'function') performance.mark(name);
  }

  function preconnectSDK() {
    const origin = new URL(SDK_URL).origin;
    const existing = Array.from(document.querySelectorAll('link[rel="preconnect"]')).some(function (link) { return link.href.replace(/\/$/, '') === origin; });
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }

  function backgroundAllowed() {
    if (document.visibilityState === 'hidden' || document.prerendering || navigator.onLine === false) return false;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return !connection || !(connection.saveData || /(^|-)2g$|^3g$/.test(connection.effectiveType || '') ||
      (connection.downlink > 0 && connection.downlink < 1.5) || connection.rtt >= 400);
  }

  function cancelDeferredWarm() {
    clearTimeout(warmTimer);
    warmTimer = null;
    if (warmIdle !== null && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(warmIdle);
    warmIdle = null;
  }

  function prepareContact(reason) {
    if (formWarmed || document.visibilityState === 'hidden') return;
    cancelDeferredWarm();
    formWarmed = true;
    preconnectSDK();
    createDialog();
    dialog.dataset.rdWarmReason = reason;
    mark('united:rd-warm-' + reason);
    requestForm(reason);
  }

  function scheduleBackgroundWarm() {
    if (!pageLoaded || formWarmed || !backgroundAllowed()) return;
    cancelDeferredWarm();
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      if (formWarmed || !backgroundAllowed()) return;
      warmTimer = setTimeout(function waitForIdle() {
        warmTimer = null;
        if (formWarmed || !backgroundAllowed()) return;
        if (typeof window.requestIdleCallback === 'function') {
          warmIdle = window.requestIdleCallback(function (deadline) {
            warmIdle = null;
            if (formWarmed || !backgroundAllowed()) return;
            if (deadline.timeRemaining() < 12) {
              warmTimer = setTimeout(waitForIdle, 1000);
              return;
            }
            prepareContact('idle');
          });
        } else {
          // Safari without requestIdleCallback still waits until after load/paint.
          prepareContact('idle');
        }
      }, IDLE_WARM_DELAY);
    }); });
  }

  function loadSDK() {
    if (typeof window.RDStationForms === 'function') return Promise.resolve();
    if (sdkRequest) return sdkRequest;
    sdkRequest = new Promise(function (resolve, reject) {
      let script = document.getElementById('rdstation-forms-sdk') || Array.from(document.scripts).find(function (item) { return item.src === SDK_URL; });
      if (script && script.dataset.unitedSdkState === 'error') {
        script.remove();
        script = null;
      }
      const existing = Boolean(script);
      if (!script) {
        script = document.createElement('script');
        script.id = 'rdstation-forms-sdk';
        script.src = SDK_URL;
        script.async = true;
        script.setAttribute('fetchpriority', dialog && dialog.open ? 'high' : 'low');
      }
      let settled = false;
      const timer = setTimeout(function () { finish(new Error('RD SDK timeout')); }, 15000);
      function finish(error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        script.removeEventListener('load', loaded);
        script.removeEventListener('error', failed);
        script.dataset.unitedSdkState = error ? 'error' : 'ready';
        if (error) reject(error); else resolve();
      }
      function loaded() { finish(typeof window.RDStationForms === 'function' ? null : new Error('RD SDK unavailable')); }
      function failed() { finish(new Error('RD SDK failed')); }
      script.addEventListener('load', loaded, {once: true});
      script.addEventListener('error', failed, {once: true});
      if (!existing) {
        mark('united:rd-sdk-request');
        document.head.appendChild(script);
      }
    });
    sdkRequest.catch(function () { sdkRequest = null; });
    return sdkRequest;
  }

  function warmContact(event) {
    const trigger = event.target instanceof Element ? event.target.closest(CONTACT_SELECTOR) : null;
    if (!trigger) return;
    preconnectSDK();
    prepareContact('intent');
  }
  document.addEventListener('pointerenter', warmContact, true);
  document.addEventListener('focusin', warmContact);

  function createDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.id = 'united-contact-dialog';
    dialog.className = 'united-contact-dialog';
    dialog.inert = true;
    dialog.setAttribute('aria-hidden', 'true');
    dialog.setAttribute('aria-labelledby', 'united-contact-heading');
    dialog.setAttribute('aria-describedby', 'united-contact-description');
    dialog.innerHTML = '<div class="united-contact-head"><div><p class="united-contact-eyebrow">UNITED · SEU PRÓXIMO PASSO</p><h2 id="united-contact-heading">Vamos conversar?</h2></div><button type="button" class="united-contact-close" aria-label="Fechar formulário">×</button></div>' +
      '<div class="united-contact-body"><p id="united-contact-description">Deixe seu contato. A equipe United fala com você.</p>' +
      '<div class="united-contact-rd" data-rd-contact aria-busy="false"><div class="united-contact-loading" data-rd-loading><p class="united-contact-status" role="status" data-rd-status>Carregando os campos…</p><div class="united-contact-skeleton" aria-hidden="true"><span></span><span></span><span></span><i></i></div></div>' +
      '<div id="' + FORM_ID + '" data-rd-mount></div>' +
      '<div class="united-contact-success" role="status" tabindex="-1" data-rd-success hidden><span class="united-contact-success-icon" aria-hidden="true">✓</span><h3>Mensagem enviada!</h3><p>Obrigado pelo contato. Nossa equipe entrará em contato com você.</p></div>' +
      '<div class="united-contact-error" role="alert" data-rd-error hidden><p>Não foi possível carregar o formulário. Confira sua conexão e tente novamente, ou fale com a equipe pelo WhatsApp.</p><button type="button" data-rd-reload>Recarregar formulário</button></div></div>' +
      '<p class="united-contact-alternative">Prefere conversar pelo WhatsApp? <a href="https://wa.me/5511940040658?text=Ol%C3%A1%21%20Quero%20conhecer%20os%20cursos%20da%20United." target="_blank" rel="noopener">Fale com a United</a></p></div>';
    document.body.appendChild(dialog);
    contactBody = dialog.querySelector('.united-contact-body');
    dialog.querySelector('.united-contact-close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', function () {
      dialog.inert = true;
      dialog.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('united-contact-open');
      restoreInlineForm();
      if (returnFocus && returnFocus.isConnected) returnFocus.focus({preventScroll: true});
    });
    requestForm = initializeRD(contactBody.querySelector('[data-rd-contact]'));
    restoreInlineForm();
  }

  // The Home and its modal share one real RD form. Moving the same node keeps
  // values, validation, consent, SDK listeners and the conversion target intact.
  function restoreInlineForm() {
    if (!inlineHost || !contactBody || dialog.open) return;
    const placeholder = inlineHost.querySelector('.home-inline-placeholder');
    if (placeholder) placeholder.remove();
    inlineHost.appendChild(contactBody);
    inlineHost.style.removeProperty('min-height');
  }

  function openContact(trigger) {
    cancelDeferredWarm();
    formWarmed = true;
    createDialog();
    if (inlineHost && inlineHost.contains(contactBody)) {
      inlineHost.style.minHeight = Math.ceil(inlineHost.getBoundingClientRect().height) + 'px';
      dialog.appendChild(contactBody);
    }
    returnFocus = trigger || document.activeElement;
    if (returnFocus && returnFocus.closest('dialog:not([open])')) returnFocus = document.querySelector('.menu-button') || returnFocus;
    dialog.inert = false;
    dialog.removeAttribute('aria-hidden');
    if (!dialog.open) dialog.showModal();
    const sdk = document.getElementById('rdstation-forms-sdk');
    if (sdk) sdk.setAttribute('fetchpriority', 'high');
    document.body.classList.add('united-contact-open');
    const success = dialog.querySelector('[data-rd-success]');
    (success.hidden ? dialog.querySelector('.united-contact-close') : success).focus({preventScroll: true});
    requestForm('open');
  }

  // This is the existing United RD adapter, scoped to the lazy contact modal.
  // RD owns its fields, validation, anti-spam, consent and real conversion request.
  function initializeRD(container) {
    const mount = container.querySelector('[data-rd-mount]');
    const status = container.querySelector('[data-rd-status]');
    const loading = container.querySelector('[data-rd-loading]');
    const error = container.querySelector('[data-rd-error]');
    const success = container.querySelector('[data-rd-success]');
    const attempts = new Map();
    let completed = false;
    let requested = false;
    let created = false;
    let timeout;
    let readyTimer;
    let firstCandidateAt = 0;
    let presentationVersion = 0;
    container.dataset.rdLoadState = 'idle';

    function showConfirmation() {
      const originalUrl = attempts.get(window.location.hash);
      if (!originalUrl || completed) return;
      // Only the SDK's successful conversion redirect reaches an issued nonce.
      // Clicking submit, validation failures and request failures are not success.
      completed = true;
      attempts.clear();
      window.history.replaceState(window.history.state, '', originalUrl);
      mount.hidden = true;
      loading.hidden = true;
      container.setAttribute('aria-busy', 'false');
      status.hidden = true;
      error.hidden = true;
      success.hidden = false;
      container.dataset.rdComplete = 'true';
      container.dispatchEvent(new CustomEvent('united:rd-form-success', {bubbles: true}));
      if (dialog.open || (inlineHost && inlineHost.contains(success))) success.focus({preventScroll: true});
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
      const destination = window.btoa(destinationUrl.href);
      rdForm.dataset.assetAction = destination;
      if (window.jQuery) window.jQuery(rdForm).data('assetAction', destination);
      rdForm.querySelectorAll('input[name="redirect_to"]').forEach(function (input) { input.value = destinationUrl.href; });
      const message = rdForm.querySelector('input[name="thankyou_message"]');
      if (message) message.value = '';
      // Do not cancel: the official RD SDK still validates and submits the form.
    }

    container.querySelector('[data-rd-reload]').addEventListener('click', function () {
      // A full reload avoids duplicate SDK instances and duplicate form handlers.
      const returnUrl = new URL(window.location.href);
      returnUrl.hash = 'contato';
      window.history.replaceState(window.history.state, '', returnUrl.href);
      window.location.reload();
    });

    function unavailable() {
      if (completed || container.dataset.rdLoadState === 'ready') return;
      container.dataset.rdLoadState = 'error';
      container.setAttribute('aria-busy', 'false');
      loading.hidden = true;
      mount.hidden = true;
      status.hidden = true;
      error.hidden = false;
    }

    function visibleControl(control) {
      if (!control || control.matches('input[type="hidden"]')) return false;
      for (let element = control; element && element !== mount; element = element.parentElement) {
        const style = window.getComputedStyle(element);
        if (element.hidden || style.display === 'none' || style.visibility === 'hidden') return false;
      }
      return true;
    }

    function completeForm() {
      const form = mount.querySelector('form');
      if (!form) return null;
      const fields = Array.from(form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea')).filter(visibleControl);
      const submit = Array.from(form.querySelectorAll('button[type="submit"], input[type="submit"], button:not([type])')).find(visibleControl);
      return fields.length && submit ? {form: form, fieldCount: fields.length} : null;
    }

    function hideHoneypots() {
      // Preserve successful controls and values; only hide RD's readonly traps.
      mount.querySelectorAll('input[name="emP7yF13ld"][readonly], input[name="sh0uldN07ch4ng3"][readonly]').forEach(function (input) {
        if (!input.hidden) input.hidden = true;
        input.setAttribute('aria-hidden', 'true');
        input.tabIndex = -1;
      });
    }

    function keepBrazilPhone() {
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
        group.querySelectorAll('.select2-container a.select2-choice').forEach(function (choice) {
          if (/^javascript:void\(0\);?$/i.test((choice.getAttribute('href') || '').trim())) {
            choice.removeAttribute('href');
            choice.setAttribute('role', 'button');
            choice.setAttribute('aria-hidden', 'true');
            choice.tabIndex = -1;
          }
        });
      });
    }

    const countryObserver = new MutationObserver(keepBrazilPhone);
    function finishPresentation() {
      const candidate = completeForm();
      if (!candidate || completed || container.dataset.rdLoadState === 'ready') return;
      const rdForm = candidate.form;
      keepBrazilPhone();
      // Prevent the prior website destination from being reused by this form.
      rdForm.dataset.assetAction = '';
      if (window.jQuery) window.jQuery(rdForm).data('assetAction', '');
      const message = rdForm.querySelector('input[name="thankyou_message"]');
      if (message) message.value = '';
      rdForm.addEventListener('submit', prepareConfirmation, true);
      mount.hidden = false;
      mount.inert = false;
      mount.removeAttribute('aria-hidden');
      loading.hidden = true;
      status.hidden = true;
      error.hidden = true;
      container.dataset.rdLoadState = 'ready';
      container.setAttribute('aria-busy', 'false');
      clearTimeout(timeout);
      observer.disconnect();
      mark('united:rd-form-ready');
      container.dispatchEvent(new CustomEvent('united:rd-form-ready', {bubbles: true}));
    }
    const observer = new MutationObserver(function () {
      keepBrazilPhone();
      clearTimeout(readyTimer);
      const version = ++presentationVersion;
      const candidate = completeForm();
      if (!candidate) { firstCandidateAt = 0; return; }
      if (!firstCandidateAt) firstCandidateAt = performance.now();
      // The active form has three fields. Give partial renders time to settle,
      // but allow a future RD configuration with fewer fields to become ready.
      const partialGrace = candidate.fieldCount < 3 ? Math.max(0, 650 - (performance.now() - firstCandidateAt)) : 0;
      readyTimer = setTimeout(function () {
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          if (version === presentationVersion) finishPresentation();
        }); });
      }, Math.max(180, partialGrace));
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
      observer.observe(mount, {childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'type']});
      try {
        new window.RDStationForms(FORM_ID, 'UA-42887237-1').createForm();
      } catch (exception) {
        clearTimeout(timeout);
        observer.disconnect();
        countryObserver.disconnect();
        unavailable();
      }
    }

    return function request(reason) {
      // A failed SDK warm-up may be retried by opening the form. Once RD has
      // created an instance, use the explicit reload action to avoid duplicates.
      if (reason === 'open' && requested && !created && container.dataset.rdLoadState === 'error') requested = false;
      if (requested) return;
      requested = true;
      container.dataset.rdLoadState = 'loading';
      container.setAttribute('aria-busy', 'true');
      mount.inert = true;
      mount.hidden = false;
      mount.setAttribute('aria-hidden', 'true');
      loading.hidden = false;
      status.hidden = false;
      error.hidden = true;
      timeout = setTimeout(unavailable, 20000);
      loadSDK().then(createForm).catch(function () { clearTimeout(timeout); unavailable(); });
    };
  }

  document.addEventListener('click', function (event) {
    const trigger = event.target instanceof Element ? event.target.closest(CONTACT_SELECTOR) : null;
    if (!trigger || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openContact(trigger);
  });
  window.addEventListener('hashchange', function () { if (window.location.hash === '#contato') openContact(); });
  window.UnitedContactForm = {open: openContact};
  if (inlineHost && 'IntersectionObserver' in window) {
    const inlineObserver = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      prepareContact('near-contact');
      if (formWarmed) inlineObserver.disconnect();
    }, {rootMargin: '600px 0px'});
    inlineObserver.observe(inlineHost);
  }
  if (window.location.hash === '#contato') openContact();
  if (pageLoaded) scheduleBackgroundWarm();
  else window.addEventListener('load', function () { pageLoaded = true; scheduleBackgroundWarm(); }, {once: true});
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') cancelDeferredWarm();
    else scheduleBackgroundWarm();
  });
})();
