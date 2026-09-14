"""Apply the approved-site contact comparison without reconstructing other sections."""
from pathlib import Path
from lxml import html
ROOT=Path(__file__).resolve().parents[1]
for name in ['contact-preview.js','contact-preview.css','preview.js']:
 (ROOT/'dist'/name).write_bytes((ROOT/'src'/name).read_bytes())
for route in ['', 'cursos', 'quem-somos', 'faq']:
 p=ROOT/'dist'/route/'index.html';d=html.fromstring(p.read_bytes())
 # Retain the existing, real WhatsApp destination in #contato only.
 for a in d.xpath('//footer//a[contains(@href,"whatsapp.com/")]'):
  li=a.xpath('ancestor::li[1]');node=li[0] if li else a;node.getparent().remove(node)
 p.write_text('<!doctype html>\n'+html.tostring(d,encoding='unicode',method='html'))
print('Single persistent CTA; WhatsApp retained in the contact section on four pages.')
