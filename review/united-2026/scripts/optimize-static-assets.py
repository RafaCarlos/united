"""Apply approved media encodings, responsive loading, fonts and ordered CSS bundles."""
from pathlib import Path
from lxml import html,etree
from urllib.parse import urlsplit,urljoin,unquote
from hashlib import sha256
from PIL import Image
import json,re
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'dist'
IMAGES=json.loads((ROOT/'seo/image-optimization.json').read_text())
VIDEOS=json.loads((ROOT/'seo/video-optimization.json').read_text())
META=json.loads((ROOT/'seo/metadata.json').read_text())
EMPTY='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
def hashfile(p):return sha256(p.read_bytes()).hexdigest()[:12]
def local(url,route='/'):
 u=urlsplit(url)
 if u.scheme or u.netloc:return None
 return D/urljoin(route,unquote(u.path)).lstrip('/')
def imageurl(value,route='/'):
 if value.startswith('data:'):return value
 if value in IMAGES:return '/'+IMAGES[value]['path']
 path=local(value,route)
 if path:
  key=str(path.relative_to(D));row=IMAGES.get(key)
  if row:return '/'+row['path']
  if key in [v['path'] for v in IMAGES.values()]:return '/'+key
 return value
# Preserve individual source styles for subsequent targeted changes; bundles are disposable output.
for parent in [ROOT/'src',D]:
 for p in parent.rglob('*.css'):
  if p.name.startswith('page-'):continue
  s=p.read_text()
  for old,row in IMAGES.items():s=s.replace(Path(old).name,Path(row['path']).name)
  s=s.replace('Manrope-Regular.ttf','Manrope-Regular.woff2').replace('Manrope-Bold.ttf','Manrope-Bold.woff2').replace("format('truetype')","format('woff2')")
  p.write_text(s)
inputs_path=ROOT/'seo/css-inputs.json'
inputs=json.loads(inputs_path.read_text()) if inputs_path.exists() else {}
for route in META:
 p=D/route.strip('/')/'index.html' if route!='/' else D/'index.html';d=html.fromstring(p.read_bytes());head=d.find('head')
 for e in d.xpath('//*[@src or @href or @poster]'):
  for attr in ['src','href','poster']:
   if e.get(attr):e.set(attr,imageurl(e.get(attr),route))
 for v in d.xpath('//video'):
  source=v.find('source');value=source.get('src') if source is not None else v.get('src')
  row=VIDEOS.get(value) or VIDEOS.get((value or '').lstrip('/')) or next((x for x in VIDEOS.values() if '/'+x['path']==value),None)
  if row:
   source.set('src','/'+row['path']);v.set('poster','/'+row['poster'])
   # Original display ratio matters for non-square-pixel encodings.
   v.set('width',str(row['original']['width']));v.set('height',str(row['original']['height']))
   for a in v.xpath('.//a'):a.set('href','/'+row['path'])
 for img in d.xpath('//img'):
  path=local(img.get('src',''),route)
  if path and path.is_file():
   try:
    with Image.open(path) as im:img.set('width',str(im.width));img.set('height',str(im.height))
   except Exception:pass
  img.set('decoding','async')
  if not img.xpath('ancestor::header|ancestor::*[contains(concat(" ",normalize-space(@class)," ")," united-preview-hero ")]'):
   img.set('loading','lazy')
  # Only the relevant crop is requested for each screen size.
  cls=img.get('class','')
  if cls in ['scenery-wide','full-art']:
   parent=img.getparent()
   if parent.tag!='picture':
    source_url=img.get('src');picture=etree.Element('picture',{'class':'wide-picture' if cls=='scenery-wide' else 'portrait-picture'})
    parent.replace(img,picture)
    etree.SubElement(picture,'source',media='(min-width:769px)' if cls=='scenery-wide' else '(max-width:768px)',srcset=source_url,type='image/webp')
    picture.append(img);img.set('src',EMPTY)
   img.set('fetchpriority','high' if img.xpath('ancestor::*[@id="banner-institucional"]') else 'low')
 # Preload only what can become the first hero image on this device.
 for e in head.xpath('./link[@rel="preload"]'):head.remove(e)
 if route=='/':
  for name,media in [('institucional-wide','(min-width:769px)'),('institucional','(max-width:768px)')]:
   etree.SubElement(head,'link',rel='preload',**{'as':'image','href':'/assets/banners/'+name+'.webp','type':'image/webp','media':media,'fetchpriority':'high'})
 etree.SubElement(head,'link',rel='preload',**{'as':'font','href':'/assets/fonts/Manrope-Bold.woff2','type':'font/woff2','crossorigin':'anonymous'})
 links=head.xpath('./link[@rel="stylesheet"]')
 originals=[e.get('href').split('?')[0] for e in links if '/page-' not in e.get('href','')]
 if originals:inputs[route]=list(dict.fromkeys(inputs.get(route,[])+[urljoin(route,s) for s in originals])) if any('/page-' in e.get('href','') for e in links) else [urljoin(route,s) for s in originals]
 styles=inputs[route]
 if '/seo-performance.css' not in styles:styles.append('/seo-performance.css')
 chunks=[]
 for href in styles:
  css=local(href).read_text()
  def absolute(match):
   quote=match.group(1);value=match.group(2).strip()
   if value.startswith(('data:','http:','https:','//','#')):return match.group(0)
   return 'url('+quote+urljoin(href,value)+quote+')'
  css=re.sub(r'url\(([\"\']?)(.*?)\1\)',absolute,css)
  chunks.append('/* '+href+' */\n'+css)
 combined='\n'.join(chunks);digest=sha256(combined.encode()).hexdigest()[:12]
 bundle=D/'assets/css'/('page-'+('home' if route=='/' else route.strip('/'))+'-'+digest+'.css');bundle.write_text(combined)
 for e in links:head.remove(e)
 etree.SubElement(head,'link',rel='stylesheet',href='/'+str(bundle.relative_to(D)))
 p.write_text('<!doctype html>\n'+html.tostring(d,encoding='unicode',method='html'))
 print(route,'CSS',len(styles),'→1; images/media/font optimized')
inputs_path.write_text(json.dumps(inputs,indent=2)+'\n')
# Remove obsolete generated bundles after all pages refer to the new ones.
used=''.join((D/r.strip('/')/'index.html' if r!='/' else D/'index.html').read_text() for r in META)
for p in (D/'assets/css').glob('page-*.css'):
 if p.name not in used:p.unlink()
