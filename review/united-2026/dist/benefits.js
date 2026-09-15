(function () {
  'use strict';
  const section = document.querySelector('.united-benefits');
  if (!section) return;
  const track = section.querySelector('.benefits-grid');
  const cards = Array.from(track.querySelectorAll('.benefit-card'));
  const previous = section.querySelector('[data-benefit-prev]');
  const next = section.querySelector('[data-benefit-next]');
  const label = section.querySelector('.benefits-position');
  const mobile = window.matchMedia('(max-width:760px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
  function update() {
    const step = cards[0].getBoundingClientRect().width + 12;
    const index = Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / step)));
    label.textContent = (index + 1) + ' de ' + cards.length;
    previous.disabled = index === 0;
    next.disabled = index === cards.length - 1;
    track.setAttribute('tabindex', mobile.matches ? '0' : '-1');
  }
  function move(direction) {
    if (!mobile.matches) return;
    const step = cards[0].getBoundingClientRect().width + 12;
    track.scrollBy({left:direction * step,behavior:reducedMotion.matches ? 'instant' : 'smooth'});
  }
  previous.addEventListener('click', function () { move(-1); });
  next.addEventListener('click', function () { move(1); });
  track.addEventListener('scroll', update, {passive:true});
  track.addEventListener('keydown', function (event) {
    if (!mobile.matches || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  window.addEventListener('resize', update);
  update();
})();
