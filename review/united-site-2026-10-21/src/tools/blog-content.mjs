// Prepare complete local article bodies without executing the imported markup.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const allowed = new Set('P Q CITE H2 H3 H4 H5 H6 UL OL LI STRONG B EM I U S DEL INS SUP SUB MARK SMALL ABBR A BR HR BLOCKQUOTE PRE CODE FIGURE FIGCAPTION IMG PICTURE SOURCE TABLE THEAD TBODY TFOOT TR TH TD CAPTION COLGROUP COL DL DT DD DIV SPAN SECTION ARTICLE TIME DETAILS SUMMARY VIDEO AUDIO TRACK'.split(' '));
const prohibited = 'script,style,iframe,object,embed,form,input,button,textarea,select,option,link,meta,base,template,svg,math';
const allowedClasses = new Set(['article-resource', 'article-media', 'article-table']);
const blockTags = new Set('P H1 H2 H3 H4 H5 H6 UL OL LI BLOCKQUOTE PRE FIGURE FIGCAPTION TABLE THEAD TBODY TFOOT TR TH TD CAPTION DL DT DD DIV SECTION ARTICLE HR BR'.split(' '));
const normalize = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const slugify = value => normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const safeId = value => Boolean(value && !/[\s\x00-\x1f\x7f<>"'`]/.test(value));
const localHostname = hostname => /^(?:www\.)?unitedidiomas\.com$/i.test(hostname);
const decode = value => { try { return decodeURIComponent(value); } catch { return value; } };

function readableText(node) {
  if (node.nodeType === 3) return node.nodeValue;
  const text = [...node.childNodes].map(readableText).join('');
  return blockTags.has(node.tagName) ? ` ${text} ` : text;
}

function urlOf(value, base, protocols = ['http:', 'https:']) {
  if (!value || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) return null;
  try {
    const url = new URL(value.trim(), base);
    return protocols.includes(url.protocol) ? url : null;
  } catch { return null; }
}

function imageKey(value, base) {
  const url = urlOf(value, base);
  return url ? `${url.hostname.replace(/^www\./, '').toLowerCase()}${decode(url.pathname)}` : value;
}

function imageAliases(image) {
  return [image.originalUrl, image.sourceUrl, image.localImage?.sourceUrl, ...(image.sourceUrls || [])].filter(Boolean);
}

function validDimension(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0 && Number(value) <= 100000;
}

function localAsset(value) {
  return typeof value === 'string' && /^[a-z0-9._/-]+$/i.test(value) && !value.startsWith('/') && !value.split('/').includes('..')
    ? `../${value.replace(/^\.\//, '')}` : null;
}

/** a.bodyFile is an authored absolute path; imported evidence paths are blog-relative. */
export async function prepareContent(a, { blogRoot, byUrl = new Map() } = {}) {
  if (!blogRoot) throw new Error('prepareContent requires blogRoot');
  const filename = a.bodyFile || path.join(blogRoot, a.privateContentEvidence.html);
  const original = await fs.readFile(filename, 'utf8');
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
  const doc = dom.window.document;
  doc.body.innerHTML = original;
  const base = a.canonicalUrl || 'https://unitedidiomas.com/blog/';
  const stats = {
    sourceImages: doc.querySelectorAll('img').length, outputImages: 0,
    sourceTables: doc.querySelectorAll('table').length, outputTables: 0,
    duplicateCoverImagesRemoved: 0, removedCoverSources: [], imagesLocalized: 0,
    imagesExternal: 0, imagesAuthoredLocal: 0, imagesWithoutSafeSource: 0,
    h1Demoted: 0, shortcodesRemoved: 0, unsafeElementsRemoved: 0,
    unsafeAttributesRemoved: 0, unsafeLinksUnwrapped: 0, internalLinksRewritten: 0,
    fragmentIdsPreserved: 0, duplicateIdsRenamed: 0,
  };
  try {
    // Only known formatting wrappers are stripped; ordinary bracketed prose stays.
    const walker = doc.createTreeWalker(doc.body, dom.window.NodeFilter.SHOW_TEXT);
    for (let textNode = walker.nextNode(); textNode; textNode = walker.nextNode()) {
      textNode.nodeValue = textNode.nodeValue.replace(/\[\s*\/?\s*(?:et_pb_[a-z0-9_]+|caption)(?:\s[^\]]*)?\]/gi, () => {
        stats.shortcodesRemoved += 1;
        return '';
      });
    }
    const sourceText = normalize(readableText(doc.body));
    stats.sourceTextWords = sourceText ? sourceText.split(' ').length : 0;
    for (const element of [...doc.querySelectorAll(prohibited)]) {
      if (!element.isConnected) continue;
      stats.unsafeElementsRemoved += 1;
      element.remove();
    }
    for (const heading of [...doc.querySelectorAll('h1')]) {
      const replacement = doc.createElement('h2');
      for (const attribute of [...heading.attributes]) replacement.setAttribute(attribute.name, attribute.value);
      replacement.append(...heading.childNodes);
      heading.replaceWith(replacement);
      stats.h1Demoted += 1;
    }

    const mediaLookup = new Map();
    for (const media of a.inlineMedia || []) {
      for (const alias of imageAliases(media)) mediaLookup.set(imageKey(alias, base), media);
    }
    const coverAliases = new Set([a.featuredImage?.url, a.localImage?.sourceUrl,
      ...Object.values(a.featuredImage?.sizes || {}).map(size => size.url)].filter(Boolean).map(url => imageKey(url, base)));
    const coverId = Number(a.featuredImage?.id || a.originalFeaturedMediaId || 0);
    const hasCover = Boolean(a.localImage?.large || a.featuredImage?.url);
    for (const image of [...doc.querySelectorAll('img')]) {
      const originalSrc = image.getAttribute('src') || image.getAttribute('data-src') || image.getAttribute('data-lazy-src');
      const media = mediaLookup.get(imageKey(originalSrc, base));
      const wpId = Number((image.className.match(/(?:^|\s)wp-image-(\d+)(?:\s|$)/) || [])[1] || 0);
      const duplicateCover = hasCover && ((coverId && wpId === coverId)
        || (a.localImage?.large && media?.localImage?.large === a.localImage.large)
        || coverAliases.has(imageKey(originalSrc, base)));
      if (duplicateCover && stats.duplicateCoverImagesRemoved === 0) {
        stats.duplicateCoverImagesRemoved += 1;
        stats.removedCoverSources.push(originalSrc);
        image.remove();
        continue;
      }
      const local = media?.localImage;
      if (local?.large && localAsset(local.large) && validDimension(local.width) && validDimension(local.height)) {
        image.setAttribute('src', localAsset(local.large));
        const variants = new Map([[Number(local.width), localAsset(local.large)]]);
        if (local.thumb && localAsset(local.thumb) && validDimension(local.thumbWidth)) variants.set(Number(local.thumbWidth), localAsset(local.thumb));
        image.setAttribute('srcset', [...variants].sort((x, y) => x[0] - y[0]).map(([width, url]) => `${url} ${width}w`).join(', '));
        image.setAttribute('sizes', '(max-width: 780px) calc(100vw - 40px), 760px');
        image.setAttribute('width', String(local.width));
        image.setAttribute('height', String(local.height));
        stats.imagesLocalized += 1;
      } else {
        const url = urlOf(originalSrc, base);
        if (!url) {
          // Keep any alternate text if a source is unsafe or unavailable.
          const alt = image.getAttribute('alt');
          image.replaceWith(alt ? doc.createTextNode(alt) : '');
          stats.imagesWithoutSafeSource += 1;
          continue;
        }
        const authoredRelative = a.bodyFile && !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(originalSrc);
        image.setAttribute('src', authoredRelative ? originalSrc : url.href);
        if (authoredRelative) stats.imagesAuthoredLocal += 1;
        else stats.imagesExternal += 1;
        const srcset = image.getAttribute('srcset');
        if (srcset) {
          const candidates = srcset.split(',').flatMap(candidate => {
            const match = candidate.trim().match(/^(\S+)\s+([\d.]+[wx])$/);
            const candidateUrl = match && urlOf(match[1], base);
            return candidateUrl ? [`${a.bodyFile ? match[1] : candidateUrl.href} ${match[2]}`] : [];
          });
          if (candidates.length) image.setAttribute('srcset', candidates.join(', '));
          else image.removeAttribute('srcset');
        }
      }
      image.setAttribute('alt', image.getAttribute('alt')?.trim() ? image.getAttribute('alt') : 'Imagem do artigo');
      image.setAttribute('loading', 'lazy');
      image.setAttribute('decoding', 'async');
      image.className = 'article-media';
    }

    const lookupArticle = url => {
      const pathname = url.pathname.replace(/\/+$/, '');
      for (const key of [decode(pathname), pathname, url.href.replace(/#.*$/, '').replace(/\/+$/, '')]) {
        const article = byUrl instanceof Map ? byUrl.get(key) : byUrl[key];
        if (article) return article;
      }
      if (url.searchParams.has('p')) {
        const values = byUrl instanceof Map ? byUrl.values() : Object.values(byUrl);
        for (const article of values) if (String(article.id) === url.searchParams.get('p')) return article;
      }
      return null;
    };
    for (const anchor of [...doc.querySelectorAll('a')]) {
      const href = anchor.getAttribute('href');
      if (!href) continue; // Named fragment anchors are retained below.
      const url = urlOf(href, base, ['https:', 'http:', 'mailto:', 'tel:']);
      if (!url) {
        anchor.replaceWith(...anchor.childNodes);
        stats.unsafeLinksUnwrapped += 1;
        continue;
      }
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        if (href.trim().startsWith('#')) anchor.setAttribute('href', href.trim());
        else if (a.bodyFile && !/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href.trim())) {
          // Authored release links already describe the local reader's routes.
          anchor.setAttribute('href', href);
        }
        else if (localHostname(url.hostname)) {
          const related = lookupArticle(url);
          if (related?.slug) {
            const query = url.searchParams.has('p') ? '' : url.search;
            anchor.setAttribute('href', `../${related.slug}/${query}${url.hash}`);
            stats.internalLinksRewritten += 1;
          } else if (url.pathname === '/') {
            anchor.setAttribute('href', `../../home/${url.search}${url.hash}`);
            stats.internalLinksRewritten += 1;
          } else if (/^\/blog\/?$/.test(url.pathname) && !url.search) {
            anchor.setAttribute('href', `../${url.hash}`);
            stats.internalLinksRewritten += 1;
          } else if (/^\/quero-ser-aluno\/?$/.test(url.pathname) && !url.search && !url.hash) {
            // The current contact adapter handles this exact legacy enrollment destination.
            anchor.setAttribute('href', '#contato');
            stats.internalLinksRewritten += 1;
          }
        }
      }
    }

    const ids = new Set();
    const originalIds = new Set([...doc.querySelectorAll('[id]')].map(el => el.id).filter(safeId));
    for (const element of [...doc.body.querySelectorAll('*')]) {
      if (!element.isConnected) continue;
      if (!allowed.has(element.tagName)) {
        element.replaceWith(...element.childNodes);
        continue;
      }
      const tag = element.tagName;
      const attrs = new Set(['id', 'lang', 'dir']);
      if (tag === 'A') ['href', 'target', 'rel', 'title', 'name'].forEach(attr => attrs.add(attr));
      if (tag === 'IMG') ['src', 'srcset', 'sizes', 'width', 'height', 'alt', 'loading', 'decoding', 'title'].forEach(attr => attrs.add(attr));
      if (['TH', 'TD'].includes(tag)) ['colspan', 'rowspan', 'headers', 'abbr'].forEach(attr => attrs.add(attr));
      if (tag === 'TH') attrs.add('scope');
      if (['COL', 'COLGROUP'].includes(tag)) attrs.add('span');
      if (tag === 'OL') ['start', 'reversed', 'type'].forEach(attr => attrs.add(attr));
      if (tag === 'LI') attrs.add('value');
      if (tag === 'TIME') attrs.add('datetime');
      if (tag === 'ABBR') attrs.add('title');
      if (tag === 'BLOCKQUOTE') attrs.add('cite');
      if (['VIDEO', 'AUDIO'].includes(tag)) ['src', 'controls', 'preload', 'poster'].forEach(attr => attrs.add(attr));
      if (tag === 'SOURCE') ['src', 'srcset', 'type', 'media', 'sizes'].forEach(attr => attrs.add(attr));
      if (tag === 'TRACK') ['src', 'kind', 'srclang', 'label', 'default'].forEach(attr => attrs.add(attr));
      for (const attribute of [...element.attributes]) {
        if (attribute.name === 'class') {
          const classes = attribute.value.split(/\s+/).filter(value => allowedClasses.has(value));
          if (classes.length) element.className = classes.join(' ');
          else element.removeAttribute('class');
        } else if (!attrs.has(attribute.name)) {
          if (/^on/i.test(attribute.name) || ['style', 'srcdoc'].includes(attribute.name)) stats.unsafeAttributesRemoved += 1;
          element.removeAttribute(attribute.name);
        }
      }
      for (const attribute of ['width', 'height', 'colspan', 'span']) {
        if (element.hasAttribute(attribute) && !validDimension(element.getAttribute(attribute))) element.removeAttribute(attribute);
      }
      if (element.hasAttribute('rowspan') && !/^\d{1,5}$/.test(element.getAttribute('rowspan'))) element.removeAttribute('rowspan');
      if (element.hasAttribute('scope') && !['row', 'col', 'rowgroup', 'colgroup'].includes(element.getAttribute('scope'))) element.removeAttribute('scope');
      if (element.hasAttribute('dir') && !['ltr', 'rtl', 'auto'].includes(element.getAttribute('dir'))) element.removeAttribute('dir');
      for (const attribute of ['cite', ...(tag !== 'IMG' ? ['src', 'poster'] : [])]) {
        if (element.hasAttribute(attribute) && !urlOf(element.getAttribute(attribute), base)) element.removeAttribute(attribute);
      }
      if (tag === 'SOURCE' && element.hasAttribute('srcset')) {
        const valid = element.getAttribute('srcset').split(',').filter(candidate => {
          const match = candidate.trim().match(/^(\S+)\s+[\d.]+[wx]$/);
          return match && urlOf(match[1], base);
        });
        if (valid.length) element.setAttribute('srcset', valid.join(', '));
        else element.removeAttribute('srcset');
      }
      if (['AUDIO', 'VIDEO'].includes(tag)) {
        element.setAttribute('controls', '');
        element.setAttribute('preload', 'none');
      }
      if (tag === 'A') {
        if (element.getAttribute('target') === '_blank') element.setAttribute('rel', 'noopener');
        else { element.removeAttribute('target'); element.removeAttribute('rel'); }
        if (!element.id && safeId(element.getAttribute('name'))) element.id = element.getAttribute('name');
        element.removeAttribute('name');
      }
      if (element.id) {
        if (!safeId(element.id)) element.removeAttribute('id');
        else if (ids.has(element.id)) {
          const baseId = element.id;
          let suffix = 2;
          while (ids.has(`${baseId}-${suffix}`) || originalIds.has(`${baseId}-${suffix}`)) suffix += 1;
          element.id = `${baseId}-${suffix}`;
          stats.duplicateIdsRenamed += 1;
        } else stats.fragmentIdsPreserved += 1;
        if (element.id) ids.add(element.id);
      }
    }
    // Empty wrappers left by a duplicate cover are removed without dropping prose.
    for (const element of [...doc.querySelectorAll('a,p,figure,div,span')].reverse()) {
      if (element.isConnected && !element.id && !element.textContent.trim()
        && !element.querySelector('img,table,hr,br,video,audio,source,track')) element.remove();
    }
    for (const span of [...doc.querySelectorAll('span')]) {
      if (!span.attributes.length) span.replaceWith(...span.childNodes);
    }
    for (const figure of doc.querySelectorAll('figure')) figure.classList.add('article-media');
    for (const table of doc.querySelectorAll('table')) {
      if (table.parentElement?.classList.contains('article-table')) continue;
      const wrapper = doc.createElement('div');
      wrapper.className = 'article-table';
      table.replaceWith(wrapper);
      wrapper.append(table);
    }
    const headings = [];
    for (const heading of doc.querySelectorAll('h2,h3,h4,h5,h6')) {
      if (!heading.id) {
        const baseId = slugify(heading.textContent) || 'secao';
        let id = baseId, suffix = 2;
        while (ids.has(id)) id = `${baseId}-${suffix++}`;
        heading.id = id;
        ids.add(id);
      }
      if (heading.tagName === 'H2') headings.push({ id: heading.id, text: normalize(heading.textContent) });
    }
    const text = normalize(readableText(doc.body));
    stats.outputTextWords = text ? text.split(' ').length : 0;
    stats.outputImages = doc.querySelectorAll('img').length;
    stats.outputTables = doc.querySelectorAll('table').length;
    stats.textPreserved = sourceText === text;
    return { html: doc.body.innerHTML, text, headings, stats };
  } finally { dom.window.close(); }
}
