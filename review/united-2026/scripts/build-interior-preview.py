"""Extend the approved static preview using the original interior-page structure.

Requires lxml. Only the public units list is taken from the live DOM snapshot;
the PHP reference files retain their original source for repeatable assembly.
"""
from copy import deepcopy
from hashlib import sha256
from pathlib import Path
import json
import re
from lxml import html, etree
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
HOME = DIST / 'index.html'


def class_xpath(name):
    return 'contains(concat(" ",normalize-space(@class)," ")," ' + name + ' ")'


def asset_url(name):
    return '/' + name + '?v=' + sha256((DIST / name).read_bytes()).hexdigest()[:12]


def stylesheet(doc, name):
    for old in doc.xpath('//link[@rel="stylesheet"]'):
        if old.get('href', '').split('?')[0].lstrip('/') == name:
            old.getparent().remove(old)
    etree.SubElement(doc.find('head'), 'link', rel='stylesheet', href=asset_url(name))


def footer_structure(doc):
    footer = doc.find('.//footer')
    footer.set('id', 'rodape')
    old_reach = footer.xpath('.//*[' + class_xpath('unidades-footer') + ']')[0]
    reach = html.fromstring((ROOT / 'src/footer-reach.html').read_text())
    old_reach.getparent().replace(old_reach, reach)
    footer.find('./div[@class="bar"]').set('id', 'reconhecimento')
    for i, toggle in enumerate(footer.xpath('.//*[' + class_xpath('open-item') + ']')):
        toggle.tag = 'button'
        toggle.attrib.pop('href', None)
        toggle.set('type', 'button')
        toggle.set('aria-expanded', 'false')
        target = toggle.getnext()
        target.set('id', 'footer-contact-' + str(i + 1))
        toggle.set('aria-controls', target.get('id'))


def local_links(doc, route):
    for a in doc.xpath('//a[@href]'):
        value = a.get('href')
        value = re.sub(r'^https?://(?:www\.)?unitedidiomas\.com/', '/', value)
        if value.lstrip('/').startswith(('cursos/', 'quem-somos/', 'faq/')):
            value = '/' + value.lstrip('/')
            if route and value.startswith('/' + route + '/#'):
                value = '#' + value.split('#', 1)[1]
            a.set('href', value)
            a.attrib.pop('target', None)
        elif value == '#united-full' and route:
            a.set('href', '/#united-full')
        elif route and 'logo' in a.get('class', '').split():
            a.set('href', '/')


def refine_lower_sections(doc):
    old = doc.xpath('//section[' + class_xpath('avaliacoes') + ']')[0]
    section = html.fromstring('<section class="avaliacoes reviews-section" id="resultados"><div class="reviews-heading"><h2>Resultados reais e comprovados.</h2><div class="reviews-controls"><button type="button" data-review-prev aria-label="Depoimentos anteriores" aria-controls="reviews-track">←</button><button type="button" data-review-next aria-label="Próximos depoimentos" aria-controls="reviews-track">→</button></div></div><div class="reviews-track" id="reviews-track" tabindex="0" aria-label="Depoimentos de alunos"></div><p class="reviews-status" aria-live="polite"></p></section>')
    track = section.find('./div[@id="reviews-track"]')
    for number, review in enumerate(json.loads((ROOT / 'src/reference/reviews.json').read_text())):
        if not review['text']:
            continue  # The final original screenshot contains only a truncated name.
        card = etree.SubElement(track, 'figure', {'class': 'review-card'})
        stars = etree.SubElement(card, 'p', {'class': 'review-stars', 'aria-label': '5 de 5 estrelas'})
        stars.text = '★★★★★'
        quote = etree.SubElement(card, 'blockquote', id='review-text-' + str(number + 1))
        quote.text = review['text']
        if len(review['text']) > 220:
            more = etree.SubElement(card, 'button', {'type':'button','class':'review-read-more','aria-expanded':'false','aria-controls':quote.get('id')})
            more.text = 'Ler mais'
        caption = etree.SubElement(card, 'figcaption')
        caption.text = review['name']
        link = etree.SubElement(caption, 'a', {'class':'review-source','href':'/assets/images/' + review['image'],'target':'_blank','rel':'noopener'})
        link.text = 'Ver avaliação original'
    old.getparent().replace(old, section)
    contact = doc.find('.//section[@id="contato"]')
    contact.find('./div/div[@class="text"]/h2').text = 'Seja aluno da United.'
    contact.find('./div/div[@class="text"]/p').text = 'Conheça os cursos e encontre o melhor formato para a sua rotina.'
    contact.find('./div/div[@class="formulario"]/h2').text = 'Vamos conversar?'
    contact.xpath('.//button[@type="submit"]')[0].text = 'Quero conhecer'


for name in ['footer-refinement.css', 'interior-preview.css', 'preview.css', 'contact-preview.css', 'contact-preview.js', 'site-polish.css', 'preview.js', 'site-refinement.js']:
    (DIST / name).write_bytes((ROOT / 'src' / name).read_bytes())

home = html.document_fromstring(HOME.read_text())
footer_structure(home)
refine_lower_sections(home)
local_links(home, '')
stylesheet(home, 'footer-refinement.css')
stylesheet(home, 'site-polish.css')
for name in ['assets/css/style.css', 'preview.css', 'contact-preview.css']:
    for link in home.xpath('//link[@rel="stylesheet"]'):
        if link.get('href','').split('?')[0].lstrip('/') == name:
            link.set('href', asset_url(name))
for script in home.xpath('//script[@src]'):
    if script.get('src', '').split('?')[0].lstrip('/') == 'preview.js':
        script.set('src', asset_url('preview.js'))
for script in home.xpath('//script[contains(@src,"site-refinement.js")]'):
    script.getparent().remove(script)
etree.SubElement(home.find('body'), 'script', src=asset_url('site-refinement.js'))
HOME.write_text('<!DOCTYPE html>\n' + html.tostring(home, encoding='unicode'))

header = deepcopy(home.find('.//header'))
mobile_menu = deepcopy(home.find('.//div[@class="menu-mobile"]'))
footer = deepcopy(home.find('.//footer'))
fixed_bar = deepcopy(home.find('.//div[@class="fixed-bar"]'))
contact = deepcopy(home.find('.//section[@id="contato"]'))
testimonials = deepcopy(home.xpath('//section[' + class_xpath('avaliacoes') + ']')[0])

for route, title in [('cursos', 'Live Class e Business'), ('quem-somos', 'Quem Somos'), ('faq', 'Perguntas frequentes')]:
    if route == 'faq':
        main = html.fromstring('<main role="main"></main>')
        faq = html.fromstring((ROOT / 'src/reference/faq-live.html').read_text())
        faq.find('./div[@class="top"]/div/h2').tag = 'h1'
        faq.xpath('.//button[@id="btnBuscar"]')[0].set('type', 'submit')
        faq.xpath('.//input[@id="busca"]')[0].set('aria-label', 'Buscar nas perguntas frequentes')
        for question in faq.xpath('.//div[@class="question"]'):
            qid = 'faq-' + question.get('id')
            question.set('id', qid)
            button = question.find('./a')
            button.tag = 'button'
            button.attrib.clear()
            button.attrib.update({'type':'button','class':'faq-toggle','aria-expanded':'false','aria-controls':qid+'-answer','id':qid+'-question'})
            answer = question.find('./div[@class="text"]')
            answer.set('id', qid+'-answer')
            answer.set('aria-labelledby', qid+'-question')
        for a in faq.xpath('.//aside//a'):
            qid = 'faq-' + a.attrib.pop('data-id')
            a.set('href', '#' + qid)
            a.set('data-faq-id', qid)
        empty = etree.SubElement(faq.find('.//article'), 'p', {'class':'faq-empty','hidden':'','role':'status'})
        empty.text = 'Nenhuma pergunta encontrada. Tente outro termo.'
        main.append(faq)
    else:
        raw = (ROOT / 'src' / 'reference' / (route + '.php')).read_text()
        raw = re.sub(r'<\?php.*?\?>', '', raw, flags=re.S)
        source = html.document_fromstring(raw)
        main = source.find('.//main')
    if route == 'quem-somos':
        snapshot = json.loads((ROOT / 'src/reference/quem-somos-live.json').read_text())
        live = html.fromstring(snapshot['main'])
        selector = './/div[' + class_xpath('unidades-hibridas') + ']'
        units = deepcopy(live.xpath(selector)[0])
        units.set('id', 'unidades-hibridas')
        for node in units.iter():
            node.attrib.pop('style', None)
        old_units = main.xpath(selector)[0]
        old_units.getparent().replace(old_units, units)
    main.append(deepcopy(testimonials))
    main.append(deepcopy(contact))

    doc = html.document_fromstring('<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"></head><body class="interior-preview"></body></html>')
    etree.SubElement(doc.find('head'), 'title').text = title + ' — United Idiomas · prévia'
    for name in ['assets/css/style.css', 'assets/css/contact-forms.css', 'theme.css', 'interior-preview.css', 'responsive-home.css', 'contact-preview.css', 'footer-refinement.css', 'site-polish.css']:
        stylesheet(doc, name)
    body = doc.find('body')
    wrapper = etree.SubElement(body, 'div', {'class': 'header-interno'})
    wrapper.append(deepcopy(header))
    body.append(deepcopy(mobile_menu))
    body.append(main)
    body.append(deepcopy(footer))
    body.append(deepcopy(fixed_bar))
    mark = etree.SubElement(body, 'div', {'class': 'preview-mark'})
    mark.text = 'PRÉVIA · UNITED'
    for name in ['assets/js/dist/scripts.js', 'preview.js', 'responsive-home.js', 'contact-preview.js', 'site-refinement.js']:
        etree.SubElement(body, 'script', src=asset_url(name))
    for node in doc.iter():
        if not isinstance(node.tag, str):
            continue
        for attr in ['src', 'poster']:
            value = node.get(attr, '')
            if value.startswith('assets/videos/'):
                node.set(attr, 'https://www.unitedidiomas.com/' + value)
            elif value in ['assets/images/img-curso-03.png', 'assets/images/img-curso-04.png', 'assets/images/img-curso-05.png']:
                # Original large course illustrations are served by the public site.
                node.set(attr, 'https://www.unitedidiomas.com/' + value)
            elif value.startswith('assets/'):
                node.set(attr, '/' + value)
        if node.tag == 'video':
            node.set('preload', 'metadata')
        if node.tag == 'img':
            node.set('decoding', 'async')
            src = node.get('src', '').split('?')[0]
            known = {'img-curso-03.png': (1920, 1388), 'img-curso-04.png': (1920, 687), 'img-curso-05.png': (1501, 455)}
            size = known.get(src.rsplit('/', 1)[-1])
            local = DIST / src.lstrip('/')
            if size is None and local.is_file():
                with Image.open(local) as picture:
                    size = picture.size
            if size:
                node.set('width', str(size[0]))
                node.set('height', str(size[1]))
    local_links(doc, route)
    directory = DIST / route
    directory.mkdir(exist_ok=True)
    (directory / 'index.html').write_text('<!DOCTYPE html>\n' + html.tostring(doc, encoding='unicode'))
    print('Updated:', route)

print('Shared footer and local navigation refreshed.')
