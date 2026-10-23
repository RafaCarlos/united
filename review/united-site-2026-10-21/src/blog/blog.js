(() => {
  'use strict';

  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

  // Capture the script URL now: currentScript is null inside DOMContentLoaded.
  const scriptUrl = document.currentScript?.src;

  function setupLibrary() {
    const library = document.querySelector('#article-library');
    const form = document.querySelector('#blog-search');
    const input = form?.querySelector('input[name="q"]');
    const grid = library?.querySelector('.articles-grid');
    if (!library || !form || !input || !grid) return;

    const blogBase = scriptUrl
      ? new URL('./', scriptUrl)
      : new URL(library.dataset.blogBase || './', window.location.href);
    const indexUrl = new URL('search-index.json', blogBase);
    const filters = [...library.querySelectorAll('[data-topic-filter]')];
    const topicLabels = new Map(filters.map((button) => [button.dataset.topicFilter, button.textContent.trim()]));
    const topics = new Set(['todos', ...topicLabels.keys()]);
    const status = library.querySelector('[data-blog-status]');
    const clearButtons = [...library.querySelectorAll('[data-blog-clear]')];
    const resetButtons = [...library.querySelectorAll('[data-blog-reset]')];
    const empty = library.querySelector('[data-blog-empty]');
    const pagination = library.querySelector('[data-blog-pagination]');
    const previous = library.querySelector('[data-blog-prev]');
    const next = library.querySelector('[data-blog-next]');
    const pageLabel = library.querySelector('[data-blog-page], [data-page-label]');
    const heading = library.querySelector('[data-results-heading]');
    const featured = document.querySelector('[data-blog-featured]');
    const staticPage = Math.max(1, Number(library.dataset.currentPage) || 1);
    let query = '';
    let topic = 'todos';
    let page = staticPage;
    let pageCount = 1;
    let pageSize = 9;
    let featuredSlug = '';
    let articles;
    let indexPromise;
    let dynamicMode = false;
    let latestRequest = 0;
    let searchTimer;

    function readUrl() {
      const params = new URL(window.location.href).searchParams;
      query = (params.get('q') || '').trim();
      topic = topics.has(params.get('tema')) ? params.get('tema') : 'todos';
      const requestedPage = params.get('pagina') || '';
      const numericPage = Number(requestedPage);
      page = /^[1-9]\d*$/.test(requestedPage) && Number.isSafeInteger(numericPage)
        ? numericPage
        : (params.has('q') || params.has('tema') ? 1 : staticPage);
      input.value = query;
      return ['q', 'tema', 'pagina'].some((key) => params.has(key));
    }

    function searchUrl(requestedPage = page) {
      const url = new URL(blogBase);
      // Retain harmless preview/version parameters while moving out of a static archive page.
      const currentParams = new URL(window.location.href).searchParams;
      currentParams.forEach((value, key) => {
        if (!['q', 'tema', 'pagina'].includes(key)) url.searchParams.append(key, value);
      });
      if (query) url.searchParams.set('q', query);
      if (topic !== 'todos') url.searchParams.set('tema', topic);
      if (requestedPage > 1) url.searchParams.set('pagina', String(requestedPage));
      url.hash = 'article-library';
      return url;
    }

    function writeUrl() {
      const url = searchUrl();
      if (url.href !== window.location.href) {
        window.history.replaceState(window.history.state, '', url.href);
      }
    }

    function loadIndex() {
      if (articles) return Promise.resolve(articles);
      if (!indexPromise) {
        indexPromise = fetch(indexUrl.href, { credentials: 'same-origin' })
          .then((response) => {
            if (!response.ok) throw new Error('Search index unavailable');
            return response.json();
          })
          .then((payload) => {
            if (!Array.isArray(payload.articles)) throw new Error('Invalid search index');
            if (Number.isInteger(payload.pageSize) && payload.pageSize > 0 && payload.pageSize <= 30) {
              pageSize = payload.pageSize;
            }
            featuredSlug = typeof payload.featuredSlug === 'string' ? payload.featuredSlug : '';
            articles = payload.articles
              .filter((article) => article && typeof article.slug === 'string' && article.slug && typeof article.title === 'string')
              .map((article) => ({
                ...article,
                normalizedTitle: normalize(article.title).replace(/\s+/g, ' ').trim(),
                normalizedExcerpt: normalize(article.excerpt).replace(/\s+/g, ' ').trim(),
                normalizedSearch: normalize([article.title, article.excerpt, topicLabels.get(article.topic), article.search].join(' ')),
              }));
            return articles;
          })
          .catch((error) => {
            indexPromise = undefined;
            throw error;
          });
      }
      return indexPromise;
    }

    function element(tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = String(text);
      return node;
    }

    function localAsset(value) {
      if (typeof value !== 'string' || !value) return null;
      try {
        const url = new URL(value, blogBase);
        return ['http:', 'https:'].includes(url.protocol) && url.origin === blogBase.origin ? url.href : null;
      } catch { return null; }
    }

    function makeCard(article) {
      const card = element('article', 'article-card');
      card.dataset.blogCard = '';
      card.dataset.topic = article.topic || '';
      const href = new URL(`./${article.slug.replace(/^\/+|\/+$/g, '')}/`, blogBase).href;
      const image = article.localImage || {};
      const large = localAsset(image.large);
      const thumb = localAsset(image.thumb);
      if (large) {
        const media = element('a', 'card-image');
        media.href = href;
        media.tabIndex = -1;
        media.setAttribute('aria-hidden', 'true');
        const img = element('img');
        img.src = large;
        if (thumb && Number(image.thumbWidth) > 0 && Number(image.width) > 0) {
          img.srcset = `${thumb} ${Number(image.thumbWidth)}w, ${large} ${Number(image.width)}w`;
        }
        img.sizes = '(max-width: 480px) calc(100vw - 40px), (max-width: 780px) 45vw, 370px';
        if (Number(image.width) > 0) img.width = Number(image.width);
        if (Number(image.height) > 0) img.height = Number(image.height);
        img.alt = article.imageAlt || article.title;
        img.loading = 'lazy';
        img.decoding = 'async';
        media.append(img);
        card.append(media);
      }
      const content = element('div', 'card-content');
      content.append(element('span', 'card-topic', topicLabels.get(article.topic) || 'Blog United'));
      const title = element('h3');
      const link = element('a', '', article.title);
      link.href = href;
      title.append(link);
      content.append(title);
      const meta = element('div', 'article-meta');
      const dateWrap = element('span');
      const time = element('time', '', article.dateLabel || '');
      time.dateTime = String(article.date || '').slice(0, 10);
      dateWrap.append(time);
      meta.append(dateWrap, element('span', '', `${article.reading || 1} min de leitura`));
      content.append(meta, element('p', 'card-excerpt', article.excerpt || ''));
      card.append(content);
      return card;
    }

    function updatePageLink(link, target, disabled) {
      if (!link) return;
      link.setAttribute('aria-disabled', String(disabled));
      link.tabIndex = disabled ? -1 : 0;
      if (link.tagName === 'A') {
        if (disabled) link.removeAttribute('href');
        else link.href = searchUrl(target).href;
      } else link.disabled = disabled;
    }

    function render() {
      const words = normalize(query).split(/\s+/).filter(Boolean);
      const filtered = Boolean(query) || topic !== 'todos';
      const matches = articles.filter((article) => (
        (filtered || article.slug !== featuredSlug)
        && (topic === 'todos' || article.topic === topic)
        && words.every((word) => article.normalizedSearch.includes(word))
      ));
      if (words.length) {
        const phrase = words.join(' ');
        const ranks = new Map(matches.map((article) => [article, [
          Number(article.normalizedTitle.includes(phrase)),
          Number(words.every((word) => article.normalizedTitle.includes(word))),
          words.filter((word) => article.normalizedTitle.includes(word)).length,
          words.filter((word) => article.normalizedExcerpt.includes(word)).length,
        ]]));
        matches.sort((left, right) => {
          const leftRank = ranks.get(left);
          const rightRank = ranks.get(right);
          for (let index = 0; index < leftRank.length; index += 1) {
            if (leftRank[index] !== rightRank[index]) return rightRank[index] - leftRank[index];
          }
          return 0; // Stable sorting preserves publication order for equally relevant results.
        });
      }
      pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
      page = Math.min(Math.max(1, page), pageCount);
      const fragment = document.createDocumentFragment();
      matches.slice((page - 1) * pageSize, page * pageSize).forEach((article) => fragment.append(makeCard(article)));
      grid.replaceChildren(fragment);

      filters.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.topicFilter === topic));
      });
      clearButtons.forEach((button) => { button.hidden = !filtered; });
      if (featured) featured.hidden = filtered || page !== 1;
      if (empty) empty.hidden = matches.length !== 0;
      if (pagination) pagination.hidden = pageCount === 1;
      updatePageLink(previous, page - 1, page === 1);
      updatePageLink(next, page + 1, page === pageCount);
      if (pageLabel) pageLabel.textContent = `Página ${page} de ${pageCount}`;
      if (status) {
        status.textContent = matches.length === 0
          ? 'Nenhum artigo encontrado.'
          : filtered
            ? `${matches.length} ${matches.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}. Página ${page} de ${pageCount}.`
            : `${matches.length} artigos para explorar. Página ${page} de ${pageCount}.`;
      }
      writeUrl();
    }

    async function requestRender({ scroll = false } = {}) {
      dynamicMode = true;
      const request = ++latestRequest;
      library.setAttribute('aria-busy', 'true');
      if (status) status.textContent = 'Buscando artigos…';
      try {
        await loadIndex();
        if (request !== latestRequest) return;
        render();
        if (scroll) {
          const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          library.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
          heading?.focus({ preventScroll: true });
        }
      } catch {
        if (request !== latestRequest) return;
        // A failed first fetch must not take over the working static pagination.
        if (!articles) dynamicMode = false;
        if (status) status.textContent = 'Não foi possível carregar a busca. Tente novamente.';
      } finally {
        if (request === latestRequest) library.removeAttribute('aria-busy');
      }
    }

    function search() {
      window.clearTimeout(searchTimer);
      query = input.value.trim();
      page = 1;
      requestRender();
    }

    input.addEventListener('input', () => {
      window.clearTimeout(searchTimer);
      // Invalidate an older in-flight search as soon as the text changes.
      latestRequest += 1;
      searchTimer = window.setTimeout(search, 160);
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      search();
    });
    filters.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        if (!topics.has(button.dataset.topicFilter)) return;
        window.clearTimeout(searchTimer);
        topic = button.dataset.topicFilter;
        query = input.value.trim();
        page = 1;
        requestRender();
      });
    });

    function reset(event) {
      event.preventDefault();
      window.clearTimeout(searchTimer);
      query = '';
      topic = 'todos';
      page = 1;
      input.value = '';
      requestRender();
      input.focus({ preventScroll: true });
    }
    [...clearButtons, ...resetButtons].forEach((button) => button.addEventListener('click', reset));

    function turnPage(event, direction) {
      // Keep the original crawlable links on an untouched static archive page.
      if (!dynamicMode && input.value.trim() === query) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;
      event.preventDefault();
      const currentQuery = input.value.trim();
      window.clearTimeout(searchTimer);
      if (currentQuery !== query) {
        query = currentQuery;
        page = 1;
      } else page = Math.min(Math.max(1, page + direction), pageCount);
      requestRender({ scroll: true });
    }
    previous?.addEventListener('click', (event) => turnPage(event, -1));
    next?.addEventListener('click', (event) => turnPage(event, 1));
    window.addEventListener('popstate', () => {
      window.clearTimeout(searchTimer);
      const hasSearchParams = readUrl();
      if (dynamicMode || hasSearchParams) requestRender();
    });

    // Static content and archive pagination work without fetching the full index.
    if (readUrl()) requestRender();
  }

  function setupSharing() {
    const buttons = [...document.querySelectorAll('[data-copy-link]')];
    const status = document.querySelector('[data-share-status]');
    const fallback = document.querySelector('[data-share-fallback]');

    buttons.forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        const url = button.dataset.url;
        if (!url) return;
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        try {
          if (typeof navigator.clipboard?.writeText !== 'function') {
            throw new Error('Clipboard unavailable');
          }
          await navigator.clipboard.writeText(url);
          if (fallback) fallback.hidden = true;
          if (status) status.textContent = 'Link copiado.';
        } catch {
          if (fallback) {
            fallback.value = url;
            fallback.readOnly = true;
            fallback.hidden = false;
            fallback.focus({ preventScroll: true });
            fallback.select();
          }
          if (status) {
            status.textContent = fallback
              ? 'Copie o endereço no campo abaixo.'
              : `Não foi possível copiar automaticamente. Endereço do artigo: ${url}`;
          }
        } finally {
          button.disabled = false;
          button.removeAttribute('aria-busy');
        }
      });
    });
  }

  function initialize() {
    setupLibrary();
    setupSharing();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
