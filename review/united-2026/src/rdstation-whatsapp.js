(function () {
  'use strict';
  const links = Array.from(document.querySelectorAll('.banner-whatsapp, #contato a[href*="api.whatsapp.com/send"]'));
  if (!links.length) return;
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
      if (open) {
        wrapper.setAttribute('role', 'dialog');
        wrapper.setAttribute('aria-modal', 'true');
      } else {
        wrapper.removeAttribute('role');
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
      if (wrapper.classList.contains('floating-button--close')) trigger.click();
      else {
        const field = focusable().find(function (element) { return /^(INPUT|SELECT|TEXTAREA)$/.test(element.tagName); });
        if (field) field.focus({preventScroll: true});
      }
    });
  });
  function connect() {
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
