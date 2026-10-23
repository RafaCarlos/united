// Build the local editorial proposal from the published WordPress snapshot.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blog = path.join(root, 'blog');
const source = JSON.parse(await fs.readFile(path.join(blog, 'content-source.json'), 'utf8'));
const articles = [...source.articles];
const release = JSON.parse(await fs.readFile(path.join(root, 'tools/united-release.json'), 'utf8'));
release.bodyFile = path.join(root, 'tools', release.bodyFile);
release.canonicalUrl = `https://unitedidiomas.com/blog/${release.slug}/`;
release.modified = release.date;
release.localImage = { large:'../assets/sala-united-editorial-v32.webp', thumb:'../assets/sala-united-editorial-v32-720.webp', width:1400, height:788, thumbWidth:720, thumbHeight:405 };
release.featuredImage = { url:release.localImage.large, alt:'Exemplo ilustrativo da sala United Class, com participantes em vídeo, chat e atividades de inglês na mesma tela' };
release.imageCaption = 'Imagem ilustrativa baseada na plataforma United Class.';
release.privateContentEvidence = { contentTextWordCount:824 };
articles.unshift(release);
// New editorial articles are separate from the preserved WordPress import.
const editorialRoot = path.join(blog, 'editorial');
let editorialRecords = [];
try { editorialRecords = JSON.parse(await fs.readFile(path.join(editorialRoot, 'articles.json'), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!Array.isArray(editorialRecords)) throw new Error('blog/editorial/articles.json must contain an array.');
const editorialArticles = editorialRecords.filter(article => {
  if (!['draft', 'local-draft', 'published'].includes(article.status)) throw new Error(`Invalid editorial status: ${article.slug}`);
  return article.status !== 'draft';
});
for (const article of editorialArticles) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug || '')) throw new Error('Editorial slug must use lowercase letters, numbers and hyphens.');
  const filename = path.resolve(editorialRoot, article.bodyFile || '');
  if (!filename.startsWith(editorialRoot + path.sep) || !filename.endsWith('.html')) throw new Error(`Invalid editorial bodyFile: ${article.slug}`);
  if (!article.id || !article.title || !article.excerpt || !article.authors?.length || !article.localImage?.large || !article.localImage?.thumb) throw new Error(`Incomplete editorial metadata: ${article.slug}`);
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(article.date || '') || !Number.isFinite(Date.parse(article.date))) throw new Error(`Invalid editorial date: ${article.slug}`);
  article.bodyFile = filename;
  article.canonicalUrl ||= `https://unitedidiomas.com/blog/${article.slug}/`;
  article.modified ||= article.date;
  article.privateContentEvidence = {contentTextWordCount:0};
  articles.push(article);
}
if (new Set(articles.map(a => a.slug)).size !== articles.length || new Set(articles.map(a => String(a.id))).size !== articles.length) throw new Error('Blog article IDs and slugs must be unique.');
articles.sort((a, b) => b.date.localeCompare(a.date));
// Keep the original WordPress source intact while using the same canonical host
// as the course pages and the production route configuration.
const publicOrigin = 'https://www.unitedidiomas.com';
const canonicalURL = value => {
  const url = new URL(value);
  return /^(www\.)?unitedidiomas\.com$/i.test(url.hostname) ? publicOrigin + url.pathname + url.search + url.hash : url.href;
};
for (const article of articles) article.canonicalUrl = canonicalURL(article.canonicalUrl);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slugify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const topics = { aprendizado: 'Aprender inglês', carreira: 'Carreira e negócios', viagens: 'Viagens e cultura', tecnologia: 'Tecnologia e IA', united:'Universo United', materiais:'Materiais de estudo' };
const topicFor = a => {
  if (a.topic && topics[a.topic]) return a.topic;
  const words = `${a.slug} ${a.title}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if ((a.categories || []).some(c=>/materiais-ricos/.test(c.slug))) return 'materiais';
  if (/united|franqui|premi|selo/.test(words)) return 'united';
  if (/negocios|carreira|reunio|trabalho|profission|corporativ|entrevista|curriculo/.test(words)) return 'carreira';
  if (/inteligencia artificial|tecnologia|(?:^|[ -])ia(?:[ -]|$)/.test(words)) return 'tecnologia';
  if (/viage|viajar|cultura|pais|mundo|internaciona|halloween|natal|filme|serie|musica/.test(words)) return 'viagens';
  return 'aprendizado';
};
const date = value => new Date(value.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
// Scheduled WordPress posts can have their last draft edit before publication.
// Preserve source dates, but do not describe a draft edit as a later update.
const publishedUpdate = article => Number.isFinite(Date.parse(article.modified)) && Date.parse(article.modified) >= Date.parse(article.date) ? article.modified : undefined;
const reading = a => Math.max(1, Math.ceil(a.privateContentEvidence.contentTextWordCount / 200));
const byUrl = new Map(articles.map(a => [decodeURIComponent(new URL(a.canonicalUrl).pathname).replace(/\/$/, ''), a]));
const { prepareContent } = await import('./blog-content.mjs');
for (const a of articles) {
  a.topic = topicFor(a);
  a.body = await prepareContent(a, { blogRoot:blog, byUrl });
  a.privateContentEvidence.contentTextWordCount = a.body.stats.outputTextWords;
  if (a.body.stats.textPreserved === false) throw new Error(`Content changed: ${a.slug}`);
}
await fs.mkdir(path.join(blog,'evidence'), {recursive:true});
await fs.writeFile(path.join(blog,'evidence/render-completeness.json'), JSON.stringify({imported:source.articles.length,localArticles:1 + editorialArticles.length,articles:articles.map(a=>({id:a.id,slug:a.slug,...a.body.stats}))},null,2));
const img = (a, prefix, priority = false, sizes = '(max-width: 780px) calc(100vw - 40px), 560px') => `<img src="${prefix}${a.localImage.large}" srcset="${prefix}${a.localImage.thumb} ${a.localImage.thumbWidth}w, ${prefix}${a.localImage.large} ${a.localImage.width}w" sizes="${sizes}" width="${a.localImage.width}" height="${a.localImage.height}" alt="${escape(a.featuredImage?.alt || a.title)}" ${priority ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async">`;
const meta = a => `<div class="article-meta"><span><time datetime="${a.date.slice(0,10)}">${date(a.date)}</time></span><span>${reading(a)} min de leitura</span></div>`;
const card = (a, prefix = '') => `<article class="article-card"><a class="card-image" href="${prefix}${a.slug}/" tabindex="-1" aria-hidden="true">${img(a, prefix, false, '(max-width: 480px) calc(100vw - 40px), (max-width: 780px) 45vw, 370px')}</a><div class="card-content"><span class="card-topic">${topics[a.topic]}</span><h3><a href="${prefix}${a.slug}/">${escape(a.title)}</a></h3>${meta(a)}<p class="card-excerpt">${escape(a.excerpt)}</p></div></article>`;
const contact = `<section class="contact-band" id="contato"><div class="wrap"><div><p class="eyebrow">Da leitura para a prática</p><h2>Seu próximo capítulo pode ser em inglês.</h2><p>Aulas ao vivo, conversação ilimitada com professores e com o Jimmy, e uma trilha de aprendizado no Live Class.</p></div></div></section>`;
const floating = `<div class="floating-contact"><a class="whatsapp-float" href="https://wa.me/5511940040658" target="_blank" rel="noopener" aria-label="Conversar com a United pelo WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 2 17.7L.4 23.5l5.9-1.6a11.8 11.8 0 0 0 5.6 1.4h.1A11.8 11.8 0 0 0 20.5 3.5ZM12 21.3a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.5.9.9-3.4-.2-.4A9.8 9.8 0 1 1 12 21.3Zm5.4-7.3c-.3-.1-1.7-.8-2-.9-.2-.1-.4-.1-.6.2-.2.3-.7.9-.9 1-.1.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.5-1.7-1.6-2-.2-.3 0-.4.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.3l1.6.6c.6.2 1.2.2 1.7.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.1-1.4-.1-.1-.3-.2-.6-.3Z"/></svg></a><button class="floating-cta" type="button" data-contact-form>Quero conhecer</button></div>`;
function shell({ title, description, canonical, rootPrefix, blogPrefix, body, schema, socialImage, socialArticle, breadcrumb }) {
  const isArticle = schema['@type'] === 'BlogPosting';
  const imageAlt = socialArticle?.featuredImage?.alt || socialArticle?.title || 'United Idiomas';
  const breadcrumbs = {'@type':'BreadcrumbList','@id':canonical + '#breadcrumb',itemListElement:breadcrumb.map((item, index)=>({'@type':'ListItem',position:index+1,...item}))};
  const structuredData = {'@context':'https://schema.org','@graph':[
    {...schema,'@id':canonical + (isArticle ? '#article' : '#webpage'),...(isArticle ? {mainEntityOfPage:{'@id':canonical+'#webpage'}} : {breadcrumb:{'@id':canonical + '#breadcrumb'}})},
    ...(isArticle ? [{'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:title,inLanguage:'pt-BR',isPartOf:{'@id':publicOrigin+'/#website'},mainEntity:{'@id':canonical+'#article'},breadcrumb:{'@id':canonical+'#breadcrumb'}}] : []),
    breadcrumbs
  ]};
  const articleMeta = isArticle ? `<meta property="article:published_time" content="${escape(schema.datePublished)}">${schema.dateModified ? `<meta property="article:modified_time" content="${escape(schema.dateModified)}">` : ''}` : '';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(canonical)}"><meta property="og:type" content="${isArticle ? 'article' : 'website'}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${escape(canonical)}"><meta property="og:image" content="${escape(socialImage)}"><meta property="og:image:width" content="${socialArticle.localImage.width}"><meta property="og:image:height" content="${socialArticle.localImage.height}"><meta property="og:image:alt" content="${escape(imageAlt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${escape(socialImage)}"><meta name="twitter:image:alt" content="${escape(imageAlt)}">${articleMeta}<meta property="og:site_name" content="United Idiomas"><meta property="og:locale" content="pt_BR"><link rel="icon" href="${rootPrefix}assets/favicon.png"><link rel="stylesheet" href="${blogPrefix}blog.css?v=1"><link rel="stylesheet" href="${rootPrefix}footer.css?v=2"><link rel="stylesheet" href="${rootPrefix}site-navigation.css?v=1"><link rel="stylesheet" href="${rootPrefix}contact-form.css?v=1"><script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g,'\\u003c')}</script></head><body id="inicio"><a class="skip-link" href="#conteudo">Ir para o conteúdo</a><header></header><dialog id="mobile-menu"></dialog><main id="conteudo">${body}</main><footer></footer>${floating}<script src="${rootPrefix}site-navigation.js?v=1" defer></script><script src="${blogPrefix}blog.js?v=1" defer></script><script src="${rootPrefix}contact-form.js?v=1" defer></script></body></html>`;
}
// Sharing and structured data use the same optimized cover as the visible page.
const socialImageFor = a => new URL(a.localImage.large, publicOrigin + '/blog/').href;
const featured = articles[0];
// The featured story has its own space; keep it searchable without repeating it in the archive.
const archiveArticles = articles.filter(a => a.slug !== featured.slug);
const pageSize = 9;
const pageCount = Math.max(1, Math.ceil(archiveArticles.length / pageSize));
const generatedPages = [];
const compactSearch = text => [...new Set(text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/\s+/))].join(' ');
const index = { pageSize, featuredSlug:featured.slug, articles:articles.map(a=>({id:a.id,slug:a.slug,title:a.title,excerpt:a.excerpt,topic:a.topic,date:a.date,dateLabel:date(a.date),reading:reading(a),search:compactSearch(a.body.text),localImage:a.localImage,imageAlt:a.featuredImage?.alt || a.title})) };
await fs.writeFile(path.join(blog,'search-index.json'), JSON.stringify(index));
for (let page = 1; page <= pageCount; page++) {
  const prefix = page === 1 ? '' : '../../';
  const rootPrefix = page === 1 ? '../' : '../../../';
  const pageArticles = archiveArticles.slice((page-1)*pageSize,page*pageSize);
  const pageHref = n => `${prefix}${n === 1 ? './' : `pagina/${n}/`}#article-library`;
  const pagination = `<nav class="pagination" aria-label="Páginas de artigos" data-blog-pagination><a data-blog-prev ${page>1?`href="${pageHref(page-1)}"`:'aria-disabled="true" tabindex="-1"'}>Anterior</a><span data-blog-page>Página ${page} de ${pageCount}</span><a data-blog-next ${page<pageCount?`href="${pageHref(page+1)}"`:'aria-disabled="true" tabindex="-1"'}>Próxima</a></nav>`;
  const featuredSection = page===1 ? `<section class="featured wrap" data-blog-featured aria-label="Artigo em destaque"><a class="featured-media" href="${featured.slug}/" tabindex="-1" aria-hidden="true">${img(featured,'',true)}</a><div class="featured-copy"><p class="eyebrow">Em destaque · ${topics[featured.topic]}</p>${meta(featured)}<h2><a href="${featured.slug}/">${escape(featured.title)}</a></h2><p class="featured-summary">${escape(featured.excerpt)}</p><a class="button" href="${featured.slug}/">Ler artigo</a></div></section>` : '';
  const canonical = `${publicOrigin}/blog/${page===1?'':`pagina/${page}/`}`;
  const description = page === 1 ? 'Artigos da United sobre aprender inglês, conversação, carreira, viagens e inteligência artificial. Encontre ideias para levar o inglês para sua vida.' : `Página ${page} do Blog United: artigos sobre aprender inglês, conversação, carreira, viagens e tecnologia. Explore o acervo e encontre sua próxima leitura.`;
  const listing = shell({title:`Blog United | Inglês, carreira, viagens e tecnologia${page===1?'':` · Página ${page}`}`,description,canonical,socialImage:socialImageFor(featured),socialArticle:featured,rootPrefix,blogPrefix:prefix,
    breadcrumb:[{name:'Início',item:publicOrigin+'/'},{name:'Blog',item:publicOrigin+'/blog/'},...(page===1?[]:[{name:`Página ${page}`,item:canonical}])],
    schema:{'@type':'CollectionPage',name:`Blog United${page===1?'':` · Página ${page}`}`,url:canonical,inLanguage:'pt-BR',isPartOf:{'@id':publicOrigin+'/#website'},mainEntity:{'@type':'ItemList',itemListElement:(page===1?[featured,...pageArticles]:pageArticles).map((a,i)=>({'@type':'ListItem',position:(page-1)*pageSize+i+1+(page===1?0:1),url:a.canonicalUrl,name:a.title}))}},
    body:`<section class="blog-intro wrap"><nav class="breadcrumb" aria-label="Você está em"><a href="${rootPrefix}home/">Início</a><span aria-hidden="true">/</span>${page===1?'<span aria-current="page">Blog</span>':`<a href="${prefix}">Blog</a><span aria-hidden="true">/</span><span aria-current="page">Página ${page}</span>`}</nav><div class="blog-intro-line"><div><p class="eyebrow">Blog United</p><h1>Mais inglês.<br><span>Mais possibilidades.</span></h1></div><p class="intro-description">Carreira, viagens, cultura e tecnologia. Ideias para aprender inglês e usá-lo nas experiências que importam para você.</p></div></section>${featuredSection}<section class="library wrap" id="article-library" data-current-page="${page}" data-blog-base="${prefix || './'}"><div class="library-heading"><div><h2 data-results-heading tabindex="-1">Artigos para o seu inglês ir além</h2><p>Explore por assunto ou encontre o que você quer aprender.</p></div><form id="blog-search" class="blog-search" role="search"><label for="search-articles">Buscar nos artigos</label><input type="search" id="search-articles" name="q" placeholder="O que você quer aprender?" autocomplete="off"><button type="submit">Buscar</button></form></div><div class="topics" role="group" aria-label="Filtrar por assunto"><button type="button" data-topic-filter="todos" aria-pressed="true">Todos</button>${Object.entries(topics).map(([key,label])=>`<button type="button" data-topic-filter="${key}" aria-pressed="false">${label}</button>`).join('')}</div><div class="search-info"><p class="search-status" data-blog-status role="status" aria-live="polite">${archiveArticles.length} artigos para explorar. Página ${page} de ${pageCount}.</p><button type="button" class="clear-search" data-blog-clear hidden>Limpar filtros</button></div><noscript><p class="no-script-note">Use a paginação para explorar todo o acervo. A busca e os filtros precisam de JavaScript.</p></noscript><div class="articles-grid">${pageArticles.map(a=>card(a,prefix)).join('')}</div><div class="empty-results" data-blog-empty hidden><h3>Vamos tentar outro assunto?</h3><p>Use uma palavra mais simples ou retire os filtros para explorar os artigos.</p><button type="button" class="button outline" data-blog-reset>Ver todos os artigos</button></div>${pagination}</section>${contact}`});
  const localFile = page===1 ? 'blog/index.html' : `blog/pagina/${page}/index.html`;
  const destination=path.join(root,localFile);
  await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,listing);
  generatedPages.push({file:localFile,key:'blog',prefix:rootPrefix});
}
for (const a of articles) {
  const related = [...articles.filter(b=>b.id!==a.id && b.topic===a.topic), ...articles.filter(b=>b.id!==a.id && b.topic!==a.topic)].slice(0,3);
  const business = a.topic === 'carreira';
  const html = shell({
    title: `${a.seoTitle || a.title} | Blog United`, description: a.excerpt, canonical:a.canonicalUrl, socialImage:socialImageFor(a), socialArticle:a, rootPrefix:'../../', blogPrefix:'../',
    breadcrumb:[{name:'Início',item:publicOrigin+'/'},{name:'Blog',item:publicOrigin+'/blog/'},{name:a.title,item:a.canonicalUrl}],
    schema: { '@type':'BlogPosting', headline:a.title, description:a.excerpt, datePublished:a.date, ...(publishedUpdate(a) ? {dateModified:publishedUpdate(a)} : {}), inLanguage:'pt-BR', url:a.canonicalUrl, mainEntityOfPage:a.canonicalUrl, image:socialImageFor(a), articleSection:topics[a.topic], isPartOf:{'@id':publicOrigin+'/#website'}, author:a.authors.map(author=>({ '@type':'Organization', name:author.name, url:canonicalURL(author.url) })), publisher:{ '@type':'EducationalOrganization', '@id':publicOrigin+'/#organization', name:'United Idiomas',url:publicOrigin+'/',logo:{'@type':'ImageObject',url:publicOrigin+'/assets/brand/united-logo-512.png',width:512,height:512} } },
    body:`<article><div class="article-heading wrap"><nav class="breadcrumb" aria-label="Você está em"><a href="../../home/">Início</a><span aria-hidden="true">/</span><a href="../">Blog</a><span aria-hidden="true">/</span><span>${topics[a.topic]}</span></nav><div class="article-title-wrap"><a class="eyebrow" href="../?tema=${a.topic}#article-library">${topics[a.topic]}</a><h1>${escape(a.title)}</h1><div class="byline"><span class="author-badge" aria-hidden="true">U</span><div class="byline-info"><strong>${escape(a.authors.map(author=>author.name).join(', '))}</strong><time datetime="${a.date.slice(0,10)}">${date(a.date)}</time> · ${reading(a)} min de leitura</div><button type="button" class="share-button" data-copy-link data-url="${escape(a.canonicalUrl)}">Copiar link</button></div><p class="share-status" data-share-status role="status" aria-live="polite"></p><input data-share-fallback hidden aria-label="Link do artigo para copiar" readonly></div></div><figure class="article-cover wrap">${img(a,'../',true,'(max-width: 780px) calc(100vw - 40px), 1160px')}</figure>${a.imageCaption ? `<p class="article-cover-caption wrap">${escape(a.imageCaption)}</p>` : ''}<div class="reading-layout wrap"><div class="article-body">${a.body.html}<div class="article-ending"><p>Continue descobrindo formas de levar o inglês para o seu dia a dia. Explore outros temas no <a href="../">Blog United</a>.</p></div></div><aside class="reading-sidebar" aria-label="Navegação do artigo"><p class="toc-label">Neste artigo</p><nav class="article-toc" aria-label="Sumário do artigo">${a.body.headings.map(h=>`<a href="#${h.id}">${escape(h.text)}</a>`).join('')}</nav><div class="sidebar-course"><p class="eyebrow">${business?'United Business':'Live Class'}</p><h2>${business?'Sua voz em um mundo de negócios.':'Inglês que faz parte da sua vida.'}</h2><p>${business?'Desenvolva seu inglês para se comunicar em situações profissionais.':'Aulas online e ao vivo, conversação e prática com o Jimmy em uma mesma jornada.'}</p><a href="${business?'../../business/':'../../'}">Conhecer o curso</a></div></aside></div></article><section class="related-section"><div class="wrap"><div class="related-heading"><h2>Continue a leitura</h2><a href="../">Todos os artigos</a></div><div class="articles-grid">${related.map(b=>card(b,'../')).join('')}</div></div></section>${contact}`
  });
  const destination = path.join(blog, a.slug);
  await fs.mkdir(destination,{ recursive:true }); await fs.writeFile(path.join(destination,'index.html'),html);
  generatedPages.push({file:`blog/${a.slug}/index.html`,key:'blog',prefix:'../../'});
}
const navigationFile=path.join(root,'navigation.json');
const navigation=JSON.parse(await fs.readFile(navigationFile,'utf8'));
navigation.pages=[...navigation.pages.filter(page=>page.key!=='blog'),...generatedPages];
await fs.writeFile(navigationFile,JSON.stringify(navigation,null,2)+'\n');
console.log(`Generated ${pageCount} archive pages and ${articles.length} article readers (${source.articles.length} imported + ${1 + editorialArticles.length} local articles).`);
