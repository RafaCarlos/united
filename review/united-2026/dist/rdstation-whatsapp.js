(function () {
  'use strict';
  const links = Array.from(document.querySelectorAll('.banner-whatsapp, #contato a[href*="api.whatsapp.com/send"]'));
  if (!links.length) return;
  const mobile = window.matchMedia('(max-width:768px)');
  const placements = [];
  const restorations = [];
  // The same shortcut follows scrolling on mobile, above the contact bar. Move
  // it outside the hero's clipping/stacking context; restore its place on desktop.
  links.filter(function (link) { return link.classList.contains('banner-whatsapp'); }).forEach(function (link) {
    const originalParent = link.parentNode;
    const originalNext = link.nextSibling;
    let actions = null;
    let sizeObserver = null;
    let measureFrame = null;
    let observedHeight = null;
    let needsResizeMeasurement = false;
    function keepBannerPlacement() {
      [['position', mobile.matches ? 'fixed' : 'absolute'], ['z-index', mobile.matches ? '106' : '9']].forEach(function (property) {
        if (link.style.getPropertyValue(property[0]) !== property[1] || link.style.getPropertyPriority(property[0]) !== 'important') {
          link.style.setProperty(property[0], property[1], 'important');
        }
      });
    }
    function measureContactBar(height) {
      observedHeight = typeof height === 'number' && height > 0 ? height : null;
      if (!actions || measureFrame !== null) return;
      measureFrame = window.requestAnimationFrame(function () {
        measureFrame = null;
        if (!actions || !actions.isConnected) return;
        // ResizeObserver has already measured the border box, including the
        // contact bar's safe-area padding. Only older browsers and lifecycle
        // recovery need a layout read, once per frame rather than per event.
        const height = observedHeight === null ? actions.getBoundingClientRect().height : observedHeight;
        observedHeight = null;
        if (!height) return;
        const value = Math.ceil(height) + 'px';
        if (link.style.getPropertyValue('--whatsapp-contact-height') !== value) {
          link.style.setProperty('--whatsapp-contact-height', value);
        }
      });
    }
    function observeContactBar(entries) {
      const entry = entries.find(function (entry) { return entry.target === actions; });
      if (!entry) return;
      const boxes = entry.borderBoxSize;
      const box = boxes && (boxes[0] || boxes);
      // This horizontal contact bar uses blockSize as its physical height.
      needsResizeMeasurement = !box || !(box.blockSize > 0);
      measureContactBar(box && box.blockSize);
    }
    function watchContactBar() {
      const candidate = document.querySelector('.contact-actions');
      if (!candidate || candidate === actions) return;
      if (sizeObserver) sizeObserver.disconnect();
      actions = candidate;
      observedHeight = null;
      if (typeof ResizeObserver !== 'undefined') {
        sizeObserver = new ResizeObserver(observeContactBar);
        try {
          sizeObserver.observe(actions, {box: 'border-box'});
        } catch (error) {
          // Older implementations accept only the target/content box. Keep
          // resize fallback for safe-area padding changes they do not report.
          needsResizeMeasurement = true;
          sizeObserver.observe(actions);
        }
      } else measureContactBar();
    }
    function placeShortcut() {
      if (mobile.matches) {
        if (link.parentNode !== document.body) document.body.appendChild(link);
      } else if (originalParent.isConnected && link.parentNode !== originalParent) {
        originalParent.insertBefore(link, originalNext && originalNext.parentNode === originalParent ? originalNext : null);
      }
      keepBannerPlacement();
      watchContactBar();
      if (!sizeObserver || needsResizeMeasurement) measureContactBar();
    }
    placeShortcut();
    if (mobile.addEventListener) mobile.addEventListener('change', placeShortcut);
    else mobile.addListener(placeShortcut);
    window.addEventListener('resize', function () {
      if (!sizeObserver || needsResizeMeasurement) measureContactBar();
    });
    placements.push(watchContactBar);
    restorations.push(function () {
      placeShortcut();
      // Safari/bfcache may resume without delivering a ResizeObserver entry,
      // or may discard a queued frame. Start a fresh, deferred measurement.
      if (measureFrame !== null) window.cancelAnimationFrame(measureFrame);
      measureFrame = null;
      measureContactBar();
    });
    new MutationObserver(keepBannerPlacement).observe(link, {attributes: true, attributeFilter: ['style']});
  });
  let trigger = null;
  let wrapper = null;
  let stateObserver = null;
  let opener = null;
  let wasOpen = false;
  function visible(element) {
    return element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
  }
  function focusable() {
    return Array.from(wrapper.querySelectorAll('a[href],button,input,select,textarea,[tabindex]'))
      .filter(function (element) { return element.tabIndex >= 0 && !element.disabled && visible(element); });
  }
  function updateState() {
    const open = !!wrapper && wrapper.isConnected && !wrapper.classList.contains('floating-button--close');
    if (wrapper) {
      // Keep the accessible name valid even while the native panel is closed.
      // Inert prevents its hidden controls from remaining in keyboard order.
      wrapper.setAttribute('role', 'dialog');
      if (open) {
        wrapper.removeAttribute('inert');
        wrapper.removeAttribute('aria-hidden');
        wrapper.setAttribute('aria-modal', 'true');
      } else {
        wrapper.setAttribute('inert', '');
        wrapper.setAttribute('aria-hidden', 'true');
        wrapper.removeAttribute('aria-modal');
      }
    }
    document.body.classList.toggle('rd-whatsapp-open', open);
    links.forEach(function (link) { link.setAttribute('aria-expanded', String(open)); });
    if (!open && wasOpen && opener && opener.isConnected && visible(opener)) opener.focus({preventScroll: true});
    wasOpen = open;
  }
  links.forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (!trigger || !trigger.isConnected || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      if (wrapper.classList.contains('floating-button--close')) {
        // RD may focus its first field synchronously inside its click handler.
        wrapper.removeAttribute('inert');
        wrapper.removeAttribute('aria-hidden');
        trigger.click();
        updateState();
      }
      else {
        const field = focusable().find(function (element) { return /^(INPUT|SELECT|TEXTAREA)$/.test(element.tagName); });
        if (field) field.focus({preventScroll: true});
      }
    });
  });
  function describeStudentLink() {
    if (!wrapper) return;
    wrapper.querySelectorAll('a[href*="api.whatsapp.com/send"]').forEach(function (link) {
      if (link.textContent.trim().toUpperCase() === 'CLIQUE AQUI') {
        // Keep RD's destination, tracking and native click handlers intact.
        link.textContent = 'Atendimento para alunos';
      }
    });
  }
  function connect() {
    placements.forEach(function (watchContactBar) { watchContactBar(); });
    describeStudentLink();
    if (wrapper && wrapper.isConnected) return;
    if (wrapper) {
      // RD removes its popup after conversion, without toggling its closed class.
      updateState();
      stateObserver.disconnect();
      links.forEach(function (link) {
        ['aria-haspopup', 'aria-controls', 'aria-expanded'].forEach(function (name) { link.removeAttribute(name); });
      });
      wrapper = null;
      trigger = null;
    }
    const candidate = document.querySelector('.rdstation-popup-js-floating-button[aria-label="Abrir WhatsApp"]');
    const candidateWrapper = candidate && candidate.closest('.floating-button');
    if (!candidateWrapper) return;
    trigger = candidate;
    wrapper = candidateWrapper;
    describeStudentLink();
    // Keep RD's form, analytics and close handler; replace only its fixed shortcut.
    trigger.setAttribute('data-united-whatsapp-trigger', '');
    trigger.style.setProperty('display', 'none', 'important');
    trigger.setAttribute('aria-hidden', 'true');
    trigger.tabIndex = -1;
    wrapper.setAttribute('aria-label', 'Fale com a United pelo WhatsApp');
    links.forEach(function (link) {
      link.setAttribute('aria-haspopup', 'dialog');
      link.setAttribute('aria-controls', wrapper.id);
    });
    wrapper.addEventListener('keydown', function (event) {
      if (event.defaultPrevented || wrapper.classList.contains('floating-button--close')) return;
      if (event.key === 'Escape') {
        const close = wrapper.querySelector('.rdstation-popup-js-close-button');
        if (close) { event.preventDefault(); event.stopPropagation(); close.click(); }
      } else if (event.key === 'Tab') {
        const fields = focusable();
        const first = fields[0], last = fields[fields.length - 1];
        if (first && ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last))) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    });
    stateObserver = new MutationObserver(updateState);
    stateObserver.observe(wrapper, {attributes: true, attributeFilter: ['class']});
    updateState();
  }
  // Handle an early/late loader and the SDK removing or replacing its popup.
  new MutationObserver(connect).observe(document.body, {childList: true, subtree: true});
  connect();
  let restoreFrame = null;
  function restoreViewport() {
    if (document.hidden || restoreFrame !== null) return;
    restoreFrame = window.requestAnimationFrame(function () {
      restoreFrame = null;
      if (document.hidden) return;
      // A return from another app/bfcache need not emit a normal resize. Keep
      // the same shortcut above the real contact bar, including safe-area size.
      restorations.forEach(function (restore) { restore(); });
      connect();
      if (wrapper) updateState();
    });
  }
  window.addEventListener('pageshow', function () {
    if (restoreFrame !== null) window.cancelAnimationFrame(restoreFrame);
    restoreFrame = null;
    restoreViewport();
  });
  window.addEventListener('orientationchange', restoreViewport);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', restoreViewport);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (restoreFrame !== null) window.cancelAnimationFrame(restoreFrame);
      restoreFrame = null;
      // Preserve the form and values, but do not restore a stale focused input
      // and keyboard after WhatsApp takes the foreground on an iPhone.
      const field = document.activeElement;
      if (wrapper && field && wrapper.contains(field) && /^(INPUT|SELECT|TEXTAREA)$/.test(field.tagName)) field.blur();
    } else restoreViewport();
  });
})();
