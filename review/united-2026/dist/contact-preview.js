(function () {
  'use strict';
  const form = document.getElementById('formBar');
  if (!form || typeof HTMLDialogElement === 'undefined') return;
  // Comparison links opt into the compact alternative; the mobile default is the bar.
  document.documentElement.dataset.contactPresentation = new URLSearchParams(window.location.search).get('cta') === 'button' ? 'button' : 'bar';

  const dialog = document.createElement('dialog');
  dialog.id = 'contact-preview-dialog';
  dialog.className = 'contact-preview-dialog';
  dialog.setAttribute('aria-labelledby', 'contact-preview-title');
  dialog.setAttribute('aria-describedby', 'contact-preview-intro');
  dialog.innerHTML = '<div class="contact-dialog-header"><div><p class="contact-eyebrow">SEU PRÓXIMO PASSO</p><h2 id="contact-preview-title">Conheça a United.</h2></div><button type="button" class="contact-dialog-close" aria-label="Fechar formulário"><span aria-hidden="true">×</span></button></div><div class="contact-dialog-scroll"><p id="contact-preview-intro">Deixe seu contato. Nossa equipe ajuda você a conhecer o curso e tirar suas dúvidas.</p></div>';
  dialog.querySelector('.contact-dialog-scroll').appendChild(form);
  form.querySelector('button[type="submit"]').textContent = 'Quero conhecer';
  form.querySelector('label[for="name"]').textContent = 'Nome';
  form.querySelector('label[for="phone"]').textContent = 'Telefone';
  form.querySelector('label[for="mail"]').textContent = 'E-mail';
  form.querySelector('#name').placeholder = 'Como podemos chamar você?';
  form.querySelector('#phone').placeholder = '(DDD) + número';
  form.querySelector('#mail').placeholder = 'voce@exemplo.com';
  document.body.appendChild(dialog);

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'contact-launcher';
  launcher.innerHTML = 'Quero conhecer <span aria-hidden="true">↗</span>';
  launcher.setAttribute('data-contact-open', '');
  const actions = document.createElement('div');
  actions.className = 'contact-actions';
  actions.setAttribute('role', 'group');
  actions.setAttribute('aria-label', 'Fale com a United');
  actions.appendChild(launcher);
  document.body.appendChild(actions);
  // The inline contact area already offers the form and the single WhatsApp link.
  const contactSection = document.getElementById('contato');
  if (contactSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      document.body.classList.toggle('contact-section-in-view', entries[0].isIntersecting && entries[0].intersectionRatio >= .1);
    }, {threshold:[0,.1]}).observe(contactSection);
  }

  const triggers = Array.from(document.querySelectorAll('a[href="#contato"], [data-contact-open]'));
  triggers.forEach(function (trigger) {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', dialog.id);
    trigger.setAttribute('aria-expanded', 'false');
    // Preserve each link's label; the persistent launcher is the main contact action.
  });
  const footerButton = document.querySelector('#formLead button[type="submit"]');
  if (footerButton) footerButton.textContent = 'Quero conhecer';
  document.body.classList.add('contact-preview-ready');

  let opener = null;
  let previousOverflow = '';
  const viewport = window.visualViewport;
  function fitDialog() {
    if (!dialog.open) return;
    dialog.style.setProperty('--contact-viewport-height', (viewport ? viewport.height : window.innerHeight) + 'px');
    dialog.style.setProperty('--contact-viewport-top', (viewport ? viewport.offsetTop : 0) + 'px');
  }
  function openDialog(trigger) {
    if (dialog.open) return;
    const mobileMenu = document.querySelector('.menu-mobile');
    opener = trigger.closest('.menu-mobile') ? document.querySelector('.open-menu') : trigger;
    if (mobileMenu) mobileMenu.classList.remove('open');
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('contact-preview-open');
    triggers.forEach(function (item) { item.setAttribute('aria-expanded', 'true'); });
    dialog.showModal();
    fitDialog();
    form.querySelector('#name').focus({ preventScroll: true });
  }
  document.addEventListener('click', function (event) {
    const trigger = event.target.closest('a[href="#contato"], [data-contact-open]');
    if (!trigger || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openDialog(trigger);
  }, true);
  dialog.querySelector('.contact-dialog-close').addEventListener('click', function () { dialog.close(); });
  let backdropPress = false;
  function outsidePanel(event) {
    const rect = dialog.getBoundingClientRect();
    return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
  }
  dialog.addEventListener('pointerdown', function (event) { backdropPress = outsidePanel(event); });
  dialog.addEventListener('click', function (event) {
    if (backdropPress && outsidePanel(event)) dialog.close();
    backdropPress = false;
  });
  // Keep Tab cycling through the panel, including at the browser-chrome boundary.
  // Native dialog supplies Escape and makes the page behind it inert.
  dialog.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab') return;
    const controls = Array.from(dialog.querySelectorAll('button:not([disabled]), input:not([type="hidden"]):not([disabled]):not([tabindex="-1"])'))
      .filter(function (element) { return element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden'; });
    const first = controls[0], last = controls[controls.length - 1];
    if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  });
  dialog.addEventListener('close', function () {
    document.documentElement.style.overflow = previousOverflow;
    document.body.classList.remove('contact-preview-open');
    triggers.forEach(function (item) { item.setAttribute('aria-expanded', 'false'); });
    function visible(element) {
      return element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
    }
    const target = visible(opener) ? opener : visible(launcher) ? launcher : document.querySelector('#formLead input[name="nome"]');
    if (visible(target)) target.focus({ preventScroll: true });
  });
  window.addEventListener('resize', fitDialog);
  if (viewport) {
    viewport.addEventListener('resize', fitDialog);
    viewport.addEventListener('scroll', fitDialog);
  }
})();
