/* Dropdown behavior augments native details. HTML navigation is build-rendered. */
(() => {
  'use strict';
  // This proposal is reviewed through its local HTTP server. Opening an HTML
  // file directly cannot resolve directory routes or the blog's fetch requests.
  // Bring that entry back to the same preview, preserving the page and section.
  if (window.location.protocol === 'file:') {
    const script = document.currentScript;
    const root = script && new URL('.', script.src);
    if (root && window.location.pathname.startsWith(root.pathname)) {
      const route = window.location.pathname.slice(root.pathname.length).replace(/index\.html$/, '');
      const preview = new URL(route, 'http://127.0.0.1:8790/');
      preview.search = window.location.search;
      preview.hash = window.location.hash;
      window.location.replace(preview.href);
      return;
    }
  }
  const courses = document.querySelector('.site-header .site-courses');
  if (courses) {
    document.addEventListener('click', event => {
      if (courses.open && !courses.contains(event.target)) courses.open = false;
    });
    courses.addEventListener('keydown', event => {
      if (event.key === 'Escape' && courses.open) {
        courses.open = false;
        courses.querySelector('summary').focus();
        event.preventDefault();
      }
    });
  }
  // Internal proposal pages retain their already-tested menu controllers.
  const menu = document.querySelector('#mobile-menu[data-site-menu-managed]');
  const opener = document.querySelector('.site-header .menu-button');
  if (!menu || !opener) return;
  const close = () => { if (menu.open) menu.close(); };
  opener.addEventListener('click', () => {
    if (menu.open) return close();
    menu.showModal();
    opener.setAttribute('aria-expanded', 'true');
    document.body.classList.add('modal-open');
    menu.querySelector('.mobile-menu-close').focus();
  });
  menu.querySelector('.mobile-menu-close').addEventListener('click', close);
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  menu.addEventListener('close', () => {
    opener.setAttribute('aria-expanded', 'false');
    // Release the menu's lock even when it hands off to the contact dialog.
    // The contact dialog owns its separate united-contact-open scroll lock.
    document.body.classList.remove('modal-open');
    if (!document.querySelector('dialog[open]')) {
      opener.focus();
    }
  });
  const desktop = window.matchMedia('(min-width:1024px)');
  desktop.addEventListener('change', event => { if (event.matches) close(); });
})();
