/* Preserve the existing destinations and contact dialog; share mobile navigation state. */
(function () {
  'use strict';
  const opener = document.querySelector('.united-header .open-menu');
  const menu = document.querySelector('.united-mobile-menu');
  if (!opener || !menu) return;
  const closer = menu.querySelector('.close-menu');
  const mobile = window.matchMedia('(max-width:768px)');
  function sync() {
    const open = menu.classList.contains('open');
    opener.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    document.documentElement.classList.toggle('united-menu-open', open);
  }
  function close(restoreFocus) {
    menu.classList.remove('open');
    sync();
    if (restoreFocus) opener.focus({preventScroll:true});
  }
  // Capture avoids duplicate legacy click handlers on the same controls.
  document.addEventListener('click', function (event) {
    if (event.target.closest('.united-header .open-menu')) {
      event.preventDefault();event.stopImmediatePropagation();
      if (!mobile.matches) return;
      menu.classList.add('open');sync();closer.focus({preventScroll:true});
    } else if (event.target.closest('.united-mobile-menu .close-menu')) {
      event.preventDefault();event.stopImmediatePropagation();close(true);
    } else if (menu.contains(event.target) && event.target.closest('a')) {
      close(false);
    }
  }, true);
  menu.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {event.preventDefault();close(true);return;}
    if (event.key !== 'Tab') return;
    const controls = Array.from(menu.querySelectorAll('a[href],button:not([disabled])')).filter(el => el.getClientRects().length);
    const first=controls[0],last=controls[controls.length-1];
    if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  });
  // The existing form can close the drawer during capture. Keep the lock and ARIA in sync.
  new MutationObserver(sync).observe(menu,{attributes:true,attributeFilter:['class']});
  function resize() {if (!mobile.matches) close(false);}
  if (mobile.addEventListener) mobile.addEventListener('change',resize);
  else mobile.addListener(resize);
  sync();
})();
