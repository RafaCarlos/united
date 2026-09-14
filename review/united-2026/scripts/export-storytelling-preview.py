"""Create a portable, unpublished HTML home with its local images and video."""
from pathlib import Path
import argparse
import base64
import mimetypes
import re
from urllib.parse import urlsplit, unquote
from lxml import html, etree

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
parser = argparse.ArgumentParser()
parser.add_argument('--filename', default='United-Previa-Personagens-3D.html')
parser.add_argument('--anchor', default='live-class')
parser.add_argument('--page', choices=['index.html','cursos/index.html','quem-somos/index.html','faq/index.html'], default='index.html')
args = parser.parse_args()
if Path(args.filename).name != args.filename or not re.fullmatch(r'[A-Za-z0-9-]+', args.anchor):
    raise ValueError('Use a filename and a simple local anchor.')
destination = root.parent / 'entregas-preview' / args.filename
doc = html.document_fromstring((dist/args.page).read_text())
cache = {}

def local_path(value, base):
    clean = unquote(urlsplit(value).path)
    path = (dist / clean.lstrip('/')) if clean.startswith('/') else (base / clean)
    path = path.resolve()
    if not path.is_relative_to(dist) or not path.is_file():
        raise ValueError('Missing preview asset: ' + str(path))
    return path

def embedded(value, base=dist):
    if not value or value.startswith(('#','data:','http:','https:','mailto:','tel:','javascript:')):
        return value
    path = local_path(value, base)
    if path not in cache:
        mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
        cache[path] = 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()
    return cache[path]

for link in doc.xpath('//link[@rel="stylesheet"]'):
    path = local_path(link.get('href'), dist)
    css = re.sub(r'url\(\s*([\'"]?)(.*?)\1\s*\)', lambda m: 'url("' + embedded(m[2].strip(), path.parent) + '")', path.read_text())
    style = etree.Element('style')
    style.text = css
    link.getparent().replace(link, style)

for element in doc.iter():
    if not isinstance(element.tag, str) or element.tag == 'script':
        continue
    for attr in ['src','poster']:
        if element.get(attr):
            element.set(attr, embedded(element.get(attr)))
    if element.tag in ('image','link'):
        for attr in ['href','xlink:href']:
            if element.get(attr):
                element.set(attr, embedded(element.get(attr)))

for script in doc.xpath('//script[@src]'):
    path = local_path(script.get('src'), dist)
    script.attrib.pop('src')
    code = path.read_text()
    # The floating WhatsApp icon is inserted dynamically by the contact script.
    code = code.replace('/assets/images/whatsapp.svg', embedded('/assets/images/whatsapp.svg'))
    script.text = re.sub(r'</script', r'<\\/script', code, flags=re.I)

for anchor in doc.xpath('//a[@href]'):
    href = anchor.get('href')
    if href.startswith('assets/') or href.startswith('/assets/'):
        anchor.set('href', embedded(href))
    elif href.startswith('/'):
        anchor.set('href', 'https://united-previa-banners-setembro.gutomarani524.chatgpt.site' + href)

start = etree.SubElement(doc.find('body'), 'script')
start.text = "if(!location.hash)location.hash='" + args.anchor + "';"
destination.parent.mkdir(exist_ok=True)
destination.write_text('<!DOCTYPE html>\n'+html.tostring(doc, encoding='unicode'))
print(str(destination))
print('Embedded assets:', len(cache), 'HTML bytes:', destination.stat().st_size)
