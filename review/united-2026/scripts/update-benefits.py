"""Replace the old home benefits carousel; preserve all approved page sections."""
from hashlib import sha256
from pathlib import Path
from lxml import html, etree

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
path = DIST / 'index.html'
doc = html.document_fromstring(path.read_text())
target = doc.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," carousel-steps ") or @id="diferenciais"]')[0]
target.getparent().replace(target, html.fromstring((ROOT / 'src/benefits.html').read_text()))
for name in ['benefits.css', 'benefits.js']:
    content = (ROOT / 'src' / name).read_bytes()
    (DIST / name).write_bytes(content)
    url = '/' + name + '?v=' + sha256(content).hexdigest()[:12]
    for element in doc.xpath('//link[@href] | //script[@src]'):
        if (element.get('href') or element.get('src')).split('?')[0].lstrip('/') == name:
            element.getparent().remove(element)
    if name.endswith('.css'):
        etree.SubElement(doc.find('head'), 'link', rel='stylesheet', href=url)
    else:
        etree.SubElement(doc.find('body'), 'script', src=url)
path.write_text('<!DOCTYPE html>\n' + html.tostring(doc, encoding='unicode'))
print('Home benefits updated; all other sections preserved.')
