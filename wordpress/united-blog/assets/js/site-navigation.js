/* Progressive enhancement: native course details and accessible mobile menu. */
(() => {
  'use strict';
  const root = document.querySelector('body.united-blog-view');
  if (!root) return;
  const courses = root.querySelector('.site-header .site-courses');
  if (courses) {
    document.addEventListener('click', event => { if (courses.open && !courses.contains(event.target)) courses.open = false; });
    courses.addEventListener('keydown', event => {
      if (event.key === 'Escape' && courses.open) { courses.open = false; courses.querySelector('summary').focus(); event.preventDefault(); }
    });
  }
  const menu = root.querySelector('#mobile-menu');
  const opener = root.querySelector('.site-header .menu-button');
  if (!menu || !opener || typeof menu.showModal !== 'function') return;
  root.classList.add('united-menu-enhanced');
  const close = () => { if (menu.open) menu.close(); };
  opener.addEventListener('click', () => {
    if (menu.open) return close();
    menu.showModal(); opener.setAttribute('aria-expanded', 'true');
    root.classList.add('modal-open'); menu.querySelector('.mobile-menu-close').focus();
  });
  menu.querySelector('.mobile-menu-close').addEventListener('click', close);
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  menu.addEventListener('close', () => {
    opener.setAttribute('aria-expanded', 'false'); root.classList.remove('modal-open');
    if (!root.querySelector('dialog[open]')) opener.focus();
  });
  const desktop = window.matchMedia('(min-width:1024px)');
  if (desktop.addEventListener) desktop.addEventListener('change', event => { if (event.matches) close(); });
})();
