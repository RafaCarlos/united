"""Apply approved media encodings, responsive loading, fonts and ordered CSS bundles."""
from pathlib import Path
from lxml import html,etree
from urllib.parse import urlsplit,urljoin,unquote
from hashlib import sha256
from PIL import Image
import json,re,importlib.util
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'dist'
IMAGES=json.loads((ROOT/'seo/image-optimization.json').read_text())
VIDEOS=json.loads((ROOT/'seo/video-optimization.json').read_text())
META=json.loads((ROOT/'seo/metadata.json').read_text())
RESPONSIVE=json.loads((ROOT/'seo/responsive-images.json').read_text())
RESPONSIVE_PATHS={path:row for key,row in RESPONSIVE.items()
 for path in [key,row['source']['path'],*[v['path'] for v in row['variants']]]}
CODE_SPEC=importlib.util.spec_from_file_location('page_code',ROOT/'scripts/optimize-page-code.py')
PAGE_CODE=importlib.util.module_from_spec(CODE_SPEC);CODE_SPEC.loader.exec_module(PAGE_CODE)
css_report={}
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
def responsive(value,route='/'):
 path=local(value,route)
 if not path:return None
 key=str(path.relative_to(D))
 row=RESPONSIVE_PATHS.get(key)
 if row:return row
 # A new encoding replaces content hashes. Resolve the stable asset family so
 # existing HTML can be rebuilt after the old generated files are removed.
 for row in RESPONSIVE.values():
  current=Path(row['default_path'])
  family=re.sub(r'-\d+w-[a-f0-9]{12}\.webp$','',current.name)
  if Path(key).parent==current.parent and re.fullmatch(re.escape(family)+r'-\d+w-[a-f0-9]{12}\.webp',Path(key).name):return row
 return None
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
  # Native video posters have no srcset. Keep a static optimized image so the
  # parser never downloads a full poster followed by a late JavaScript swap.
  poster=responsive(v.get('poster',''),route)
  if poster and poster['usage']=='video-poster':v.set('poster','/'+poster['default_path'])
 # The desktop SVG teasers use the same artwork as the portrait banners.
 # Reuse the optimized full-size asset while preserving SVG crop/geometry.
 for item in d.xpath('//image[@href]'):
  row=responsive(item.get('href'),route)
  if row:item.set('href','/'+row['default_path'])
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
   # Native loading keeps the active campaign available without a JS image loader.
   # The first banner is always eager; later mobile panels load as they become visible.
   img.set('loading','eager' if img.xpath('ancestor::*[@id="banner-institucional"]') else 'lazy')
   for source in img.getparent().xpath('./source'):
    row=responsive(source.get('srcset','').split(',')[0].strip().split()[0],route)
    if row:
     source.set('srcset',row['srcset']);source.set('sizes',row['contexts']['hero']['sizes'])
  else:
   row=responsive(img.get('src',''),route)
   if row:
    img.set('src','/'+row['default_path']);img.set('srcset',row['srcset'])
    img.set('sizes',row.get('contexts',{}).get('body',{}).get('sizes',row['sizes']))
 # Preload only what can become the first hero image on this device.
 for e in head.xpath('./link[@rel="preload"]'):head.remove(e)
 if route=='/':
  for name,media in [('institucional-wide','(min-width:769px)'),('institucional','(max-width:768px)')]:
   row=RESPONSIVE['assets/banners/'+name+'.webp']
   etree.SubElement(head,'link',rel='preload',**{'as':'image','href':'/'+row['default_path'],'imagesrcset':row['srcset'],'imagesizes':row['contexts']['hero']['sizes'],'type':'image/webp','media':media,'fetchpriority':'high'})
 elif route=='/cursos/':
  first_video=d.xpath('//video[@poster]')[0]
  etree.SubElement(head,'link',rel='preload',**{'as':'image','href':first_video.get('poster'),'type':'image/webp','fetchpriority':'high'})
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
   absolute_url=urljoin(href,value);row=responsive(absolute_url)
   return 'url('+quote+('/'+row['default_path'] if row else absolute_url)+quote+')'
  css=re.sub(r'url\(([\"\']?)(.*?)\1\)',absolute,css)
  chunks.append('/* '+href+' */\n'+css)
 if route=='/':
  # This decorative background is 100% of the viewport width. Smaller screens
  # must not always receive its 1924px desktop file. Keep a plain-url fallback.
  bg=RESPONSIVE['assets/images/bg-cursos.png']
  variants={v['width']:'/'+v['path'] for v in bg['variants']}
  for width,densities in [(1280,[1280,1924]),(768,[768,1280,1924]),(480,[480,768,1280])]:
   candidates=','.join('url("'+variants[w]+'") '+str(i+1)+'x' for i,w in enumerate(densities))
   chunks.append('@media(max-width:'+str(width)+'px){.about-home{background-image:url("'+variants[densities[min(1,len(densities)-1)]]+'");background-image:image-set('+candidates+')}}')
 used_classes={c for value in d.xpath('//@class') for c in value.split()}
 combined,css_report[route]=PAGE_CODE.optimize_animations('\n'.join(chunks),used_classes)
 digest=sha256(combined.encode()).hexdigest()[:12]
 bundle=D/'assets/css'/('page-'+('home' if route=='/' else route.strip('/'))+'-'+digest+'.css');bundle.write_text(combined)
 for e in links:head.remove(e)
 etree.SubElement(head,'link',rel='stylesheet',href='/'+str(bundle.relative_to(D)))
 p.write_text('<!doctype html>\n'+html.tostring(d,encoding='unicode',method='html'))
 print(route,'CSS',len(styles),'→1; images/media/font optimized')
inputs_path.write_text(json.dumps(inputs,indent=2)+'\n')
(ROOT/'seo/css-optimization.json').write_text(json.dumps(css_report,indent=2)+'\n')
# Remove obsolete generated bundles after all pages refer to the new ones.
used=''.join((D/r.strip('/')/'index.html' if r!='/' else D/'index.html').read_text() for r in META)
for p in (D/'assets/css').glob('page-*.css'):
 if p.name not in used:p.unlink()
