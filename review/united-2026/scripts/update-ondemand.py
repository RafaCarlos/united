"""Update only the home OnDemand section using the supplied September 2026 PDF."""
from pathlib import Path
from lxml import html, etree

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
path = DIST / 'index.html'
page = html.document_fromstring(path.read_text())
old = page.get_element_by_id('ondemand')
old.getparent().replace(old, html.fromstring((ROOT / 'src/ondemand-current.html').read_text()))
(DIST / 'ondemand-current.css').write_bytes((ROOT / 'src/ondemand-current.css').read_bytes())
for old in page.xpath('//link[contains(@href,"ondemand-current.css")]'):
    old.getparent().remove(old)
etree.SubElement(page.find('head'), 'link', rel='stylesheet', href='/ondemand-current.css')
path.write_text('<!DOCTYPE html>\n' + html.tostring(page, encoding='unicode'))
print('OnDemand updated with supplied artwork/copy; original animation classes retained.')
