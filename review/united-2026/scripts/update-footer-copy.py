"""Apply shared recognition copy and copyright without rebuilding approved sections."""
from pathlib import Path
from lxml import html, etree

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
COPY = 'Compromisso com a qualidade e com a sua experiência de aprendizado.'
COPYRIGHT = '© United 2026. Todos os direitos reservados.'
FOOTER_WHATSAPP = 'https://wa.me/5511958575315'
CONTACTS = [('parcerias', 'Parcerias & Convênios'), ('franquias', 'Seja um Franqueado')]

(DIST / 'footer-refinement.css').write_bytes((ROOT / 'src/footer-refinement.css').read_bytes())
for route in ['index.html', 'cursos/index.html', 'quem-somos/index.html', 'faq/index.html']:
    path = DIST / route
    page = html.document_fromstring(path.read_text())
    for key, label in CONTACTS:
        controls = page.xpath('//footer//*[self::button or self::a][normalize-space()=$label or @data-footer-whatsapp=$key]', label=label, key=key)
        if len(controls) != 1:
            raise ValueError(f'{route}: expected one footer contact for {label}')
        old = controls[0].getparent()
        item = etree.Element('div', {'class': 'footer-whatsapp-item'})
        link = etree.SubElement(item, 'a', {'class': 'footer-whatsapp-link', 'data-footer-whatsapp': key,
            'href': FOOTER_WHATSAPP, 'target': '_blank', 'rel': 'noopener noreferrer',
            'title': 'WhatsApp +55 11 95857-5315'})
        link.text = label
        etree.SubElement(link, 'span', {'aria-hidden': 'true'}).text = '↗'
        old.getparent().replace(old, item)
    bar = page.get_element_by_id('reconhecimento')
    heading = bar.find('h3')
    for child in list(heading):
        heading.remove(child)
    heading.text = COPY
    for old in bar.xpath('./p[@class="footer-copyright"]'):
        bar.remove(old)
    etree.SubElement(bar, 'p', {'class': 'footer-copyright'}).text = COPYRIGHT
    path.write_text('<!DOCTYPE html>\n' + html.tostring(page, encoding='unicode'))
print('Footer contact destinations, recognition copy and copyright updated on all four routes.')
