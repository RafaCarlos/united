"""Refresh only the Live Class home intro and the interior Jimmy section."""
from pathlib import Path
from copy import deepcopy
from hashlib import sha256
from lxml import html, etree

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
home = html.document_fromstring((dist/'index.html').read_text())
about = home.xpath('//*[@id="curso"]')[0]
for child in list(about):
    if child.get('id') != 'diferenciais':
        about.remove(child)
about.insert(0, html.fromstring((root/'src/liveclass-intro.html').read_text()))
courses = html.document_fromstring((dist/'cursos/index.html').read_text())
old_jimmy = courses.xpath('//*[@id="jimmy-united-idiomas"]')[0]
new_jimmy = deepcopy(home.xpath('//*[@id="jimmy-united-idiomas"]')[0])
new_jimmy.set('class','ia-united jimmy-current')
for image in new_jimmy.xpath('.//img'):
    image.set('src','/' + image.get('src').lstrip('/'))
old_jimmy.getparent().replace(old_jimmy,new_jimmy)
for name in ['liveclass-intro.css','jimmy-current.css','site-refinement.js']:
    (dist/name).write_bytes((root/'src'/name).read_bytes())
for doc,path in [(home,dist/'index.html'),(courses,dist/'cursos/index.html')]:
    for name in ['jimmy-current.css','liveclass-intro.css']:
        for old in doc.xpath('//link[contains(@href,"'+name+'")]'):
            old.getparent().remove(old)
        etree.SubElement(doc.find('head'),'link',rel='stylesheet',href='/'+name+'?v='+sha256((dist/name).read_bytes()).hexdigest()[:12])
    for script in doc.xpath('//script[contains(@src,"site-refinement.js")]'):
        script.set('src','/site-refinement.js?v='+sha256((dist/'site-refinement.js').read_bytes()).hexdigest()[:12])
    path.write_text('<!DOCTYPE html>\n'+html.tostring(doc,encoding='unicode'))
print('Live Class intro and current Jimmy applied to the preview.')
