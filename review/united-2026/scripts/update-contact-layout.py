"""Install the official RD contact form without reconstructing other sections."""
from pathlib import Path
from lxml import html, etree
import json
ROOT=Path(__file__).resolve().parents[1]
(ROOT/'dist/obrigado').mkdir(exist_ok=True)
(ROOT/'dist/obrigado/index.html').write_bytes((ROOT/'src/rdstation-thanks.html').read_bytes())
SDK='https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js'
for name in ['contact-preview.js','contact-preview.css','preview.js','rdstation-form.js','rdstation-form.css']:
 (ROOT/'dist'/name).write_bytes((ROOT/'src'/name).read_bytes())
for route in ['', 'cursos', 'quem-somos', 'faq']:
 p=ROOT/'dist'/route/'index.html';d=html.fromstring(p.read_bytes())
 # A single official embed is shared by the inline contact area and the dialog.
 existing=d.xpath('//*[@data-rd-contact]|//form[@id="formLead"]')
 if len(existing)!=1:raise ValueError(f'{route}: expected exactly one contact form mount')
 existing[0].getparent().replace(existing[0],html.fragment_fromstring((ROOT/'src/rdstation-form.html').read_text()))
 for old in d.xpath('//div[contains(concat(" ",normalize-space(@class)," ")," fixed-bar ")]'):
  old.getparent().remove(old)
 for old in d.xpath('//script[contains(@src,"rdstation-forms.min.js") or contains(@src,"rdstation-form.js")]'):
  old.getparent().remove(old)
 contact=d.xpath('//script[contains(@src,"contact-preview.js")]')[0]
 parent=contact.getparent();position=parent.index(contact)
 parent.insert(position,etree.Element('script',src=SDK,defer='defer',id='rdstation-forms-sdk'))
 parent.insert(position+1,etree.Element('script',src='/rdstation-form.js',defer='defer'))
 # Retain the existing, real WhatsApp destination in #contato only.
 for a in d.xpath('//footer//a[contains(@href,"whatsapp.com/")]'):
  li=a.xpath('ancestor::li[1]');node=li[0] if li else a;node.getparent().remove(node)
 p.write_text('<!doctype html>\n'+html.tostring(d,encoding='unicode',method='html'))
inputs_path=ROOT/'seo/css-inputs.json';inputs=json.loads(inputs_path.read_text())
for styles in inputs.values():
 if '/rdstation-form.css' not in styles:styles.append('/rdstation-form.css')
inputs_path.write_text(json.dumps(inputs,indent=2)+'\n')
comparison=ROOT/'dist/comparar-contato/index.html'
comparison.write_text(comparison.read_text().replace('Os formulários desta prévia não enviam dados.','Os formulários estão conectados ao RD Station e enviam contatos reais.'))
print('Official RD form installed once per page; contact dialog shares the same form.')
