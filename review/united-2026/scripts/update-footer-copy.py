"""Apply shared recognition copy and copyright without rebuilding approved sections."""
from pathlib import Path
from lxml import html, etree

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
COPY = 'Compromisso com a qualidade e com a sua experiência de aprendizado.'
COPYRIGHT = '© United 2026. Todos os direitos reservados.'

(DIST / 'footer-refinement.css').write_bytes((ROOT / 'src/footer-refinement.css').read_bytes())
for route in ['index.html', 'cursos/index.html', 'quem-somos/index.html', 'faq/index.html']:
    path = DIST / route
    page = html.document_fromstring(path.read_text())
    bar = page.get_element_by_id('reconhecimento')
    heading = bar.find('h3')
    for child in list(heading):
        heading.remove(child)
    heading.text = COPY
    for old in bar.xpath('./p[@class="footer-copyright"]'):
        bar.remove(old)
    etree.SubElement(bar, 'p', {'class': 'footer-copyright'}).text = COPYRIGHT
    path.write_text('<!DOCTYPE html>\n' + html.tostring(page, encoding='unicode'))
print('Recognition copy and United 2026 copyright updated on all four routes.')
