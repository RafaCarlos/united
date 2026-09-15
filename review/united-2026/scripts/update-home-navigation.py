"""Remove duplicate contact CTAs and retain page navigation throughout home content."""
from pathlib import Path
from lxml import html

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
for name in ['contact-preview.js', 'site-refinement.js', 'footer-refinement.css']:
    (DIST / name).write_bytes((ROOT / 'src' / name).read_bytes())

path = DIST / 'index.html'
page = html.document_fromstring(path.read_text())
for section_id in ['liveclass-conceito', 'jimmy-united-idiomas', 'ondemand', 'united-business', 'united-full']:
    section = page.get_element_by_id(section_id)
    for button in section.xpath('.//a[@href="#contato"]'):
        button.getparent().remove(button)
for nav in page.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," lateral-bar ")]'):
    nav.set('role', 'navigation')
    nav.set('aria-label', 'Navegação da página')
path.write_text('<!DOCTYPE html>\n' + html.tostring(page, encoding='unicode'))
print('Home contact actions simplified; side navigation remains visible through the content.')
