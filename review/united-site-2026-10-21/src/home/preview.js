(function () {
  'use strict';
  // Animate only the product while the section is visible. Reading stays stable;
  // there is no pinned scrolling, timer loop or extra image/video download.
  const onDemand = document.querySelector('.ondemand-current');
  if (onDemand && 'IntersectionObserver' in window) {
    const stage = onDemand.querySelector('.content');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let visible = false;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let hover = 0;
    let currentScale = 1;
    let currentY = 0;
    let currentX = 0;
    let currentRotate = 0;
    const clamp = function (value) { return Math.min(1, Math.max(0, value)); };
    function render() {
      frame = 0;
      if (!visible || document.hidden || motion.matches) return;
      const rect = stage.getBoundingClientRect();
      const progress = clamp((window.innerHeight * .94 - rect.top) / (window.innerHeight * .82));
      const small = window.innerWidth <= 700;
      const targetScale = (small ? .93 : .84) + progress * (small ? .07 : .16) + hover * .035;
      const targetY = (1 - progress) * (small ? 16 : 54) + pointerY * -7;
      const targetX = pointerX * 12;
      const targetRotate = pointerX * 2.6;
      currentScale += (targetScale - currentScale) * .12;
      currentY += (targetY - currentY) * .12;
      currentX += (targetX - currentX) * .12;
      currentRotate += (targetRotate - currentRotate) * .12;
      stage.style.setProperty('--od-scale', currentScale.toFixed(4));
      stage.style.setProperty('--od-y', currentY.toFixed(2) + 'px');
      stage.style.setProperty('--od-x', currentX.toFixed(2) + 'px');
      stage.style.setProperty('--od-rotate', currentRotate.toFixed(2) + 'deg');
      const unsettled = Math.abs(targetScale - currentScale) > .0002 || Math.abs(targetY - currentY) > .05 || Math.abs(targetX - currentX) > .05 || Math.abs(targetRotate - currentRotate) > .02;
      if (unsettled) frame = window.requestAnimationFrame(render);
    }
    function schedule() {
      if (visible && !frame && !motion.matches && !document.hidden) frame = window.requestAnimationFrame(render);
    }
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) schedule();
      else { window.cancelAnimationFrame(frame); frame = 0; }
    }).observe(stage);
    window.addEventListener('scroll', schedule, {passive:true});
    window.addEventListener('resize', schedule, {passive:true});
    document.addEventListener('visibilitychange', schedule);
    stage.addEventListener('pointermove', function (event) {
      if (!pointer.matches || event.pointerType !== 'mouse') return;
      const rect = stage.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - .5) * 2;
      pointerY = ((event.clientY - rect.top) / rect.height - .5) * 2;
      hover = 1;
      schedule();
    }, {passive:true});
    stage.addEventListener('pointerleave', function () { pointerX = 0; pointerY = 0; hover = 0; schedule(); });
    motion.addEventListener('change', function () {
      if (motion.matches) {
        window.cancelAnimationFrame(frame); frame = 0;
        ['--od-scale','--od-y','--od-x','--od-rotate'].forEach(function (name) { stage.style.removeProperty(name); });
      } else schedule();
    });
  }
  const hero = document.querySelector('.united-preview-hero');
  if (hero) {
    const panels = Array.from(hero.querySelectorAll('.preview-panel'));
    const tabs = Array.from(hero.querySelectorAll('[role=tab]'));
    const titles = ['United', 'Live Class', 'Jimmy 24/7'];
    const playback = hero.querySelector('.preview-playback');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width:768px)');
    const mouseHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    let active = 0;
    let hoverTimer = null;
    let automaticTimer = null;
    let autoPaused = new URLSearchParams(location.search).get('compare') === '1';
    let heroVisible = true;

    // CSS owns the cover size and the artwork aspect ratio. Selecting a banner
    // never writes viewport dimensions, including after returning from WhatsApp.
    function select(index) {
      active = (index + panels.length) % panels.length;
      hero.dataset.activeBanner = String(active);
      panels.forEach(function (panel, i) {
        const selected = i === active;
        panel.classList.toggle('active', selected);
        panel.setAttribute('aria-expanded', String(selected));
        panel.querySelector('.art-cta').tabIndex = selected ? 0 : -1;
        tabs[i].setAttribute('aria-selected', String(selected));
        tabs[i].tabIndex = selected ? 0 : -1;
      });
      hero.querySelector('.preview-announcement').textContent = 'Banner ' + titles[active] + ' aberto';
      updateAutomatic();
    }
    function choose(index) {
      window.clearTimeout(hoverTimer);
      hoverTimer = null;
      autoPaused = true;
      select(index);
    }
    function updateAutomatic() {
      window.clearTimeout(automaticTimer);
      automaticTimer = null;
      const paused = autoPaused || reducedMotion.matches;
      if (playback) {
        playback.disabled = reducedMotion.matches;
        playback.textContent = paused ? '\u25b6' : '\u2161';
        playback.setAttribute('aria-label', reducedMotion.matches
          ? 'Troca automática desativada pela preferência de movimento reduzido'
          : paused ? 'Retomar troca automática dos banners' : 'Pausar troca automática dos banners');
      }
      if (mobile.matches && !paused && !document.hidden && heroVisible) {
        automaticTimer = window.setTimeout(function () { select(active + 1); }, 6000);
      }
    }
    panels.forEach(function (panel, i) {
      // A brief intent delay prevents a quick pass across the cover from
      // opening every panel. Touch devices keep their tap/swipe controls.
      panel.addEventListener('pointerenter', function (event) {
        if (event.pointerType !== 'mouse' || mobile.matches || !mouseHover.matches || i === active) return;
        window.clearTimeout(hoverTimer);
        hoverTimer = window.setTimeout(function () {
          if (!mobile.matches && mouseHover.matches) choose(i);
        }, 100);
      });
      panel.addEventListener('pointerleave', function () {
        window.clearTimeout(hoverTimer);
        hoverTimer = null;
      });
      panel.addEventListener('click', function (event) {
        if (!event.target.closest('a')) choose(i);
      });
      panel.addEventListener('keydown', function (event) {
        if (event.target.closest('a')) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          choose(i);
        }
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          choose(active + (event.key === 'ArrowRight' ? 1 : -1));
          panels[active].focus();
        }
      });
      tabs[i].addEventListener('click', function () { choose(i); });
      tabs[i].addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          choose(active + (event.key === 'ArrowRight' ? 1 : -1));
          tabs[active].focus();
        }
      });
    });
    let touchStart = null;
    hero.addEventListener('touchstart', function (event) {
      touchStart = {x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY};
    }, {passive: true});
    hero.addEventListener('touchend', function (event) {
      if (!touchStart || !mobile.matches) return;
      const dx = event.changedTouches[0].clientX - touchStart.x;
      const dy = event.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) choose(active + (dx < 0 ? 1 : -1));
      touchStart = null;
    }, {passive: true});
    window.addEventListener('pageshow', updateAutomatic);
    document.addEventListener('visibilitychange', updateAutomatic);
    if (mobile.addEventListener) mobile.addEventListener('change', updateAutomatic);
    else mobile.addListener(updateAutomatic);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', updateAutomatic);
    else reducedMotion.addListener(updateAutomatic);
    if (playback) playback.addEventListener('click', function () {
      autoPaused = !autoPaused;
      updateAutomatic();
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting && entries[0].intersectionRatio >= .25;
      updateAutomatic();
    }, {threshold: [0, .25]}).observe(hero);
    const requested = Number(new URLSearchParams(location.search).get('banner'));
    select(Number.isInteger(requested) && requested >= 1 && requested <= 3 ? requested - 1 : 0);
  }
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const href = link.getAttribute('href');
    if (href && href !== '#contato' && !link.hasAttribute('data-contact-form') && href.charAt(0) === '#') {
      let target;
      try { target = document.getElementById(decodeURIComponent(href.slice(1))); } catch (error) { return; }
      if (target) {
        event.preventDefault();
        // Retain the section in the address bar and browser history, as a native
        // anchor would. This makes sections shareable and Back work as expected.
        if (window.location.hash !== href) window.history.pushState(window.history.state, '', href);
        target.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block: 'start'});
        // Keyboard users continue from the section instead of tabbing through
        // every intervening control after following an in-page link.
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
          target.addEventListener('blur', function () { target.removeAttribute('tabindex'); }, {once: true});
        }
        target.focus({preventScroll: true});
      }
    }
  });
})();
