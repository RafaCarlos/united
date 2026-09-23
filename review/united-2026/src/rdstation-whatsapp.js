(function () {
  'use strict';
  const links = Array.from(document.querySelectorAll('.banner-whatsapp, #contato a[href*="api.whatsapp.com/send"]'));
  if (!links.length) return;
  const mobile = window.matchMedia('(max-width:768px)');
  const placements = [];
  // The same shortcut follows scrolling on mobile, above the contact bar. Move
  // it outside the hero's clipping/stacking context; restore its place on desktop.
  links.filter(function (link) { return link.classList.contains('banner-whatsapp'); }).forEach(function (link) {
    const originalParent = link.parentNode;
    const originalNext = link.nextSibling;
    let actions = null;
    let sizeObserver = null;
    function keepBannerPlacement() {
      [['position', mobile.matches ? 'fixed' : 'absolute'], ['z-index', mobile.matches ? '106' : '9']].forEach(function (property) {
        if (link.style.getPropertyValue(property[0]) !== property[1] || link.style.getPropertyPriority(property[0]) !== 'important') {
          link.style.setProperty(property[0], property[1], 'important');
        }
      });
    }
    function measureContactBar() {
      if (!actions || !actions.isConnected) return;
      const height = actions.getBoundingClientRect().height;
      if (!height) return;
      const value = Math.ceil(height) + 'px';
      if (link.style.getPropertyValue('--whatsapp-contact-height') !== value) {
        link.style.setProperty('--whatsapp-contact-height', value);
      }
    }
    function watchContactBar() {
      const candidate = document.querySelector('.contact-actions');
      if (!candidate || candidate === actions) return;
      if (sizeObserver) sizeObserver.disconnect();
      actions = candidate;
      if (typeof ResizeObserver !== 'undefined') {
        sizeObserver = new ResizeObserver(measureContactBar);
        sizeObserver.observe(actions);
      }
      measureContactBar();
    }
    function placeShortcut() {
      if (mobile.matches) {
        if (link.parentNode !== document.body) document.body.appendChild(link);
      } else if (originalParent.isConnected && link.parentNode !== originalParent) {
        originalParent.insertBefore(link, originalNext && originalNext.parentNode === originalParent ? originalNext : null);
      }
      keepBannerPlacement();
      watchContactBar();
      measureContactBar();
    }
    placeShortcut();
    if (mobile.addEventListener) mobile.addEventListener('change', placeShortcut);
    else mobile.addListener(placeShortcut);
    window.addEventListener('resize', measureContactBar);
    placements.push(watchContactBar);
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
})();
