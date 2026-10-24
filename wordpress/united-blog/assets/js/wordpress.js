/* Optional reading enhancements. Search, topics and pagination work without JS. */
(() => {
  'use strict';
  if (!document.body.classList.contains('united-blog-view')) return;
  const button = document.querySelector('[data-ub-share]');
  const status = document.querySelector('[data-share-status]');
  if (button) {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const url = button.dataset.shareUrl || window.location.href;
      try {
        if (navigator.share) { await navigator.share({title: document.title, url}); return; }
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url); status.textContent = 'Link copiado. Agora é só compartilhar.'; return;
        }
      } catch (error) { if (error.name === 'AbortError') return; }
      let fallback = document.querySelector('[data-share-fallback]');
      if (!fallback) {
        fallback = document.createElement('input'); fallback.type = 'url'; fallback.readOnly = true;
        fallback.setAttribute('data-share-fallback', ''); fallback.setAttribute('aria-label', 'Link do artigo para copiar');
        status.after(fallback);
      }
      fallback.value = url; fallback.focus(); fallback.select(); status.textContent = 'Copie este link para compartilhar o artigo.';
    });
  }
  const links = Array.from(document.querySelectorAll('.article-toc a[href^="#"]'));
  if (!('IntersectionObserver' in window) || !links.length) return;
  const headings = links.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1)))).filter(Boolean);
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach(link => {
        if (decodeURIComponent(link.hash.slice(1)) === entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, {rootMargin: '-120px 0px -65% 0px', threshold: 0});
  headings.forEach(heading => observer.observe(heading));
})();
