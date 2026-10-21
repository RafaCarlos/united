// Read-only page audit. Writes only its JSON report under private source evidence.
// Usage: node tools/audit-blog-complete.mjs [target-site-root]
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetRoot = path.resolve(process.argv[2] || sourceRoot);
const sourceBlog = path.join(sourceRoot, 'blog');
const manifest = JSON.parse(await fs.readFile(path.join(sourceBlog, 'content-source.json'), 'utf8'));
const release = JSON.parse(await fs.readFile(path.join(sourceRoot, 'tools/united-release.json'), 'utf8'));
const navigation = JSON.parse(await fs.readFile(path.join(sourceRoot, 'navigation.json'), 'utf8'));
const report = { target: targetRoot, auditedAt: new Date().toISOString(), counts: {}, errors: [], warnings: [], articles: [], archives: [] };
const failure = (file, check, details) => report.errors.push({ file, check, details });
const warning = (file, check, details) => report.warnings.push({ file, check, details });
const norm = value => String(value || '').replace(/\s+/g, ' ').trim();
const schemaOfType = (document, type) => [...document.querySelectorAll('script[type="application/ld+json"]')]
  .flatMap(node => { const value = JSON.parse(node.textContent); return value['@graph'] || [value]; }).find(node => node['@type'] === type);
const canonicalHost = value => value.replace(/^https:\/\/(?:www\.)?unitedidiomas\.com(?=\/)/, 'https://www.unitedidiomas.com');
const blocks = new Set('P H1 H2 H3 H4 H5 H6 UL OL LI BLOCKQUOTE PRE FIGURE FIGCAPTION TABLE THEAD TBODY TFOOT TR TH TD CAPTION DL DT DD DIV SECTION ARTICLE HR BR'.split(' '));
function text(node) {
  if (node.nodeType === 3) return node.nodeValue;
  const result = [...node.childNodes].map(text).join('');
  return blocks.has(node.tagName) ? ` ${result} ` : result;
}
function sourceDocument(html) {
  const dom = new JSDOM('<!doctype html><body></body>');
  dom.window.document.body.innerHTML = html;
  const walk = dom.window.document.createTreeWalker(dom.window.document.body, dom.window.NodeFilter.SHOW_TEXT);
  for (let node = walk.nextNode(); node; node = walk.nextNode()) {
    node.nodeValue = node.nodeValue.replace(/\[\s*\/?\s*(?:et_pb_[a-z0-9_]+|caption)(?:\s[^\]]*)?\]/gi, '');
  }
  return dom;
}
function tableSignature(table) {
  return {
    caption: norm(table.querySelector('caption')?.textContent),
    rows: [...table.querySelectorAll('tr')].map(row => [...row.children].map(cell => ({
      tag: cell.tagName, text: norm(text(cell)), colspan: cell.getAttribute('colspan'), rowspan: cell.getAttribute('rowspan'),
    }))),
  };
}
function firstDifference(a, b) {
  let offset = 0;
  while (offset < Math.min(a.length, b.length) && a[offset] === b[offset]) offset += 1;
  return { offset, expected: a.slice(Math.max(0, offset - 70), offset + 120), actual: b.slice(Math.max(0, offset - 70), offset + 120) };
}

let editorial = [];
try { editorial = JSON.parse(await fs.readFile(path.join(sourceBlog, 'editorial/articles.json'), 'utf8')).filter(a => a.status !== 'draft').map(a => ({...a, editorial:true})); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const files = [...manifest.articles.map(a => ({ ...a, imported: true })), release, ...editorial];
let originalWords = 0, renderedWords = 0, originalImages = 0, bodyImages = 0, originalTables = 0, renderedTables = 0;
for (const article of files) {
  const file = `blog/${article.slug}/index.html`;
  const source = article.imported
    ? await fs.readFile(path.join(sourceBlog, article.privateContentEvidence.html), 'utf8')
    : await fs.readFile(path.join(article.editorial ? path.join(sourceBlog, 'editorial') : path.join(sourceRoot, 'tools'), article.bodyFile), 'utf8');
  const sourceDom = sourceDocument(source), rawBody = sourceDom.window.document.body;
  const actualDom = new JSDOM(await fs.readFile(path.join(targetRoot, file), 'utf8'));
  const doc = actualDom.window.document, rendered = doc.querySelector('.article-body')?.cloneNode(true);
  if (!rendered) { failure(file, 'article-body', 'Missing'); actualDom.window.close(); sourceDom.window.close(); continue; }
  rendered.querySelector('.article-ending')?.remove();
  const expectedText = norm(text(rawBody)), actualText = norm(text(rendered));
  if (expectedText !== actualText) failure(file, 'full-text-parity', firstDifference(expectedText, actualText));
  const sourceTableData = [...rawBody.querySelectorAll('table')].map(tableSignature);
  const targetTableData = [...rendered.querySelectorAll('table')].map(tableSignature);
  if (JSON.stringify(sourceTableData) !== JSON.stringify(targetTableData)) failure(file, 'table-parity', { expected: sourceTableData, actual: targetTableData });
  if (rendered.querySelector('h1')) failure(file, 'body-heading-level', 'Body H1 was not demoted');
  for (const tag of ['h4', 'h5', 'h6', 'pre', 'q', 'small', 'figcaption']) {
    const expected = rawBody.querySelectorAll(tag).length, actual = rendered.querySelectorAll(tag).length;
    if (expected !== actual) failure(file, 'semantic-element-preservation', { tag, expected, actual });
  }
  const ids = new Set();
  for (const element of doc.querySelectorAll('[id]')) {
    if (ids.has(element.id)) failure(file, 'duplicate-id', element.id);
    ids.add(element.id);
  }
  for (const link of doc.querySelectorAll('.article-toc a[href^="#"]')) {
    if (!doc.getElementById(decodeURIComponent(link.hash.slice(1)))) failure(file, 'toc-fragment', link.getAttribute('href'));
  }
  const schema = schemaOfType(doc, 'BlogPosting');
  if (article.imported) {
    const expectedAuthorNames = article.authors.map(author => author.name);
    if (doc.querySelector('link[rel="canonical"]').getAttribute('href') !== canonicalHost(article.canonicalUrl)) failure(file, 'canonical', doc.querySelector('link[rel="canonical"]').getAttribute('href'));
    const expectedModified = Date.parse(article.modified) >= Date.parse(article.date) ? article.modified : undefined;
    if (schema.datePublished !== article.date || schema.dateModified !== expectedModified) failure(file, 'source-dates', { expected: [article.date, expectedModified], actual: [schema.datePublished, schema.dateModified] });
    if (JSON.stringify(schema.author.map(author => author.name)) !== JSON.stringify(expectedAuthorNames)) failure(file, 'source-authors', schema.author);
    if (norm(doc.querySelector('.byline-info strong')?.textContent) !== expectedAuthorNames.join(', ')) failure(file, 'visible-author', doc.querySelector('.byline-info strong')?.textContent);
    if (doc.querySelector('.byline-info time')?.getAttribute('datetime') !== article.date.slice(0, 10)) failure(file, 'visible-date', doc.querySelector('.byline-info time')?.outerHTML);
  }
  for (const [field, value] of [['og:image', doc.querySelector('meta[property="og:image"]')?.content], ['schema.image', schema.image]]) {
    if (typeof value === 'string' && !/^https?:\/\//.test(value)) warning(file, 'relative-social-image', { field, value });
  }
  const sourceImages = rawBody.querySelectorAll('img').length, outputImages = rendered.querySelectorAll('img').length;
  if (article.imported && (sourceImages - outputImages < 0 || sourceImages - outputImages > 1)) failure(file, 'body-image-count', { sourceImages, outputImages });
  const sourceWords = expectedText ? expectedText.split(' ').length : 0, outputWords = actualText ? actualText.split(' ').length : 0;
  if (article.imported) { originalWords += sourceWords; renderedWords += outputWords; originalImages += sourceImages; bodyImages += outputImages; originalTables += sourceTableData.length; renderedTables += targetTableData.length; }
  report.articles.push({ slug: article.slug, imported: Boolean(article.imported), sourceWords, outputWords, sourceImages, outputImages, tables: targetTableData.length, textParity: expectedText === actualText });
  sourceDom.window.close(); actualDom.window.close();
}

const expectedSlugs = new Set(files.map(a => a.slug));
const occurrences = new Map();
let archiveCards = 0, featuredArticles = 0;
const archives = navigation.pages.filter(page => /^blog\/(?:index\.html|pagina\/\d+\/index\.html)$/.test(page.file));
for (const archive of archives) {
  const dom = new JSDOM(await fs.readFile(path.join(targetRoot, archive.file), 'utf8'));
  const doc = dom.window.document;
  const slugs = [];
  for (const link of doc.querySelectorAll('#article-library > .articles-grid > .article-card h3 a')) {
    const destination = path.resolve(path.dirname(path.join(targetRoot, archive.file)), link.getAttribute('href'));
    const relative = path.relative(path.join(targetRoot, 'blog'), destination).replace(/\/$/, '');
    if (!expectedSlugs.has(relative)) failure(archive.file, 'archive-unknown-article', relative);
    occurrences.set(relative, (occurrences.get(relative) || 0) + 1);
    archiveCards += 1;
    slugs.push(relative);
  }
  for (const link of doc.querySelectorAll('[data-blog-featured] h2 a')) {
    const destination = path.resolve(path.dirname(path.join(targetRoot, archive.file)), link.getAttribute('href'));
    const relative = path.relative(path.join(targetRoot, 'blog'), destination).replace(/\/$/, '');
    if (!expectedSlugs.has(relative)) failure(archive.file, 'featured-unknown-article', relative);
    occurrences.set(relative, (occurrences.get(relative) || 0) + 1);
    featuredArticles += 1;
  }
  const pageNumber = archive.file === 'blog/index.html' ? 1 : Number(archive.file.match(/pagina\/(\d+)/)[1]);
  for (const [selector, delta] of [['[data-blog-prev]', -1], ['[data-blog-next]', 1]]) {
    const link = doc.querySelector(selector), requested = pageNumber + delta;
    if (requested >= 1 && requested <= archives.length && !link?.getAttribute('href')) failure(archive.file, 'native-pagination-link', selector);
  }
  const schema = schemaOfType(doc, 'CollectionPage');
  const visibleArticles = slugs.length + doc.querySelectorAll('[data-blog-featured] h2 a').length;
  if (schema.mainEntity.itemListElement.length !== visibleArticles) failure(archive.file, 'item-list-count', schema.mainEntity.itemListElement.length);
  const socialImage = doc.querySelector('meta[property="og:image"]')?.content;
  if (!/^https?:\/\//.test(socialImage || '')) warning(archive.file, 'relative-social-image', { field: 'og:image', value: socialImage });
  report.archives.push({ file: archive.file, page: pageNumber, cards: slugs.length, slugs });
  dom.window.close();
}
for (const slug of expectedSlugs) if (occurrences.get(slug) !== 1) failure(`blog/${slug}/index.html`, 'native-archive-coverage', occurrences.get(slug) || 0);
report.counts = { navigationPages: navigation.pages.length, imported: manifest.articles.length, localArticles: 1 + editorial.length, archivePages: archives.length, archiveCards, featuredArticles, distinctArchivedReaders: occurrences.size, originalWords, renderedWords, originalImages, bodyImages, duplicateCoversRemoved: originalImages - bodyImages, originalTables, renderedTables };
const label = targetRoot === sourceRoot ? 'source' : 'build';
const destination = path.join(sourceBlog, 'evidence', `blog-complete-${label}-audit.json`);
await fs.writeFile(destination, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ counts: report.counts, errors: report.errors, warnings: report.warnings, report: destination }, null, 2));
process.exitCode = report.errors.length ? 1 : 0;
