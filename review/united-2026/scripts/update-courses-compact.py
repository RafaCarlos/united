"""Compact only Business/Full home sections, preserving approved surrounding work."""
from pathlib import Path
from hashlib import sha256
import shutil
from lxml import html, etree

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
doc = html.document_fromstring((dist/'index.html').read_text())
for section_id, template in [('united-business','course-business-compact.html'),('united-full','course-full-compact.html')]:
    old = doc.xpath('//*[@id="'+section_id+'"]')[0]
    new = html.fromstring((root/'src'/template).read_text())
    old.getparent().replace(old, new)
name = 'courses-compact.css'
(dist/name).write_bytes((root/'src'/name).read_bytes())
for old in doc.xpath('//link[contains(@href,"courses-compact.css")]'):
    old.getparent().remove(old)
etree.SubElement(doc.find('head'),'link',rel='stylesheet',href=name+'?v='+sha256((dist/name).read_bytes()).hexdigest()[:12])
(dist/'index.html').write_text('<!DOCTYPE html>\n'+html.tostring(doc,encoding='unicode'))
print('Local Business and United Full summaries updated.')

# Shared refinements and one current ABF seal on every preview route.
shared = ['footer-refinement.css', 'site-refinement.js']
for name in shared:
    shutil.copyfile(root/'src'/name, dist/name)
for route in ['index.html', 'cursos/index.html', 'quem-somos/index.html', 'faq/index.html']:
    page = html.document_fromstring((dist/route).read_text())
    for image in page.xpath('//footer//img[contains(@src,"selo-excelencia-franchising-united-preto")]'):
        item = image.xpath('ancestor::li[1]')[0]
        item.getparent().remove(item)
    for image in page.xpath('//footer//img[contains(@src,"selo-excelencia-franchising-united") or contains(@src,"selo-abf-2026-azul")]'):
        image.set('src', '/assets/images/selo-abf-2026-azul.png')
        image.set('alt', 'Selo de Excelência em Franchising ABF 2026 — United Idiomas')
        image.set('width', '130')
        image.set('height', '130')
    for name in shared:
        attr, tag = ('href','link') if name.endswith('.css') else ('src','script')
        for element in page.xpath('//'+tag+'[contains(@'+attr+',"'+name+'")]'):
            element.set(attr, '/' + name + '?v=' + sha256((dist/name).read_bytes()).hexdigest()[:12])
    (dist/route).write_text('<!DOCTYPE html>\n'+html.tostring(page,encoding='unicode'))
print('Shared footer updated with the official blue ABF 2026 seal.')
