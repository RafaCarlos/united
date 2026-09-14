(function () {
  'use strict';
  // The side menu must not depend on legacy carousel initialization or fade timers.
  const pageNavigation = document.querySelector('.lateral-bar');
  if (pageNavigation) {
    pageNavigation.setAttribute('data-managed-navigation', '');
    let navigationFrame = false;
    function syncPageNavigation() {
      navigationFrame = false;
      pageNavigation.classList.toggle('page-navigation-visible', window.scrollY >= 100);
    }
    function schedulePageNavigation() {
      if (!navigationFrame) {
        navigationFrame = true;
        window.requestAnimationFrame(syncPageNavigation);
      }
    }
    window.addEventListener('scroll', schedulePageNavigation, {passive:true});
    window.addEventListener('resize', schedulePageNavigation);
    window.addEventListener('load', schedulePageNavigation);
    syncPageNavigation();
  }
  document.querySelectorAll('.reviews-section').forEach(function (section) {
    const track = section.querySelector('.reviews-track');
    const cards = Array.from(track.querySelectorAll('.review-card'));
    const previous = section.querySelector('[data-review-prev]');
    const next = section.querySelector('[data-review-next]');
    const status = section.querySelector('.reviews-status');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function updateReviews() {
      const viewport = track.getBoundingClientRect();
      const visible = cards.map(function (card, index) {
        const box = card.getBoundingClientRect();
        return box.left >= viewport.left - 8 && box.left < viewport.right - 32 ? index + 1 : null;
      }).filter(Boolean);
      previous.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 3;
      if (visible.length) status.textContent = (visible.length === 1 ? 'Depoimento ' + visible[0] : 'Depoimentos ' + visible[0] + ' a ' + visible[visible.length - 1]) + ' de ' + cards.length;
    }
    function moveReviews(direction) {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const width = cards[0].getBoundingClientRect().width + gap;
      const count = Math.max(1, Math.round((track.clientWidth + gap) / width));
      track.scrollBy({left:direction * count * width,behavior:motion.matches ? 'instant' : 'smooth'});
    }
    previous.addEventListener('click', function () { moveReviews(-1); });
    next.addEventListener('click', function () { moveReviews(1); });
    track.addEventListener('scroll', updateReviews, {passive:true});
    window.addEventListener('resize', updateReviews);
    section.querySelectorAll('.review-read-more').forEach(function (button) {
      button.addEventListener('click', function () {
        const expanded = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(expanded));
        button.closest('.review-card').classList.toggle('expanded', expanded);
        button.textContent = expanded ? 'Ler menos' : 'Ler mais';
      });
    });
    updateReviews();
  });
  // Re-align deep links after images/fonts settle, unless the visitor has moved.
  if (window.location.hash) {
    document.body.classList.add('preview-deep-link');
    let interacted = false;
    ['wheel', 'touchstart', 'keydown'].forEach(function (name) {
      window.addEventListener(name, function () { interacted = true; }, { once:true, passive:true });
    });
    window.addEventListener('load', async function () {
      if (document.fonts) await document.fonts.ready;
      let target;
      try { target = document.getElementById(decodeURIComponent(window.location.hash.slice(1))); } catch (_) { return; }
      if (target && !interacted) target.scrollIntoView({ behavior:'instant', block:'start' });
    }, { once:true });
  }
  if ('IntersectionObserver' in window) {
    const visibleSections = new Set();
    const contactBoundaries = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visibleSections.add(entry.target);
        else visibleSections.delete(entry.target);
      });
      document.body.classList.toggle('footer-in-view', visibleSections.size > 0);
    });
    // Keep page navigation available through every content section.
    // Only the contact area and actual footer replace it with their own controls.
    document.querySelectorAll('footer,#contato').forEach(function (section) { contactBoundaries.observe(section); });
    const inlineForm = document.querySelector('#contato .formulario');
    if (inlineForm) new IntersectionObserver(function (entries) {
      document.body.classList.toggle('inline-contact-in-view', entries[0].intersectionRatio >= .25);
    }, {threshold:[0,.25]}).observe(inlineForm);
  }
  document.addEventListener('click', function (event) {
    const toggle = event.target.closest('footer .accordeon .open-item');
    // Delegation runs after the original target handler and its slide animation.
    if (toggle) toggle.setAttribute('aria-expanded', String(toggle.classList.contains('open')));
  });
})();
