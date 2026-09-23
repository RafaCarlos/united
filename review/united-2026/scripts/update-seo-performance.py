"""Build production SEO in dist. Use export-production.py --mode preview for review copies."""
from pathlib import Path
from lxml import html, etree
from hashlib import sha256
from urllib.parse import urlsplit, urljoin, urlencode
from collections import Counter
import json,re,html as escape_html
ROOT=Path(__file__).resolve().parents[1]; DIST=ROOT/'dist'
META=json.loads((ROOT/'seo/metadata.json').read_text())
COPY=json.loads((ROOT/'seo/content.json').read_text())
BASE='https://www.unitedidiomas.com'
ORG=BASE+'/#organization'
def digest(p):return sha256(p.read_bytes()).hexdigest()[:12]
def inner(el,text):
 for child in list(el):el.remove(child)
 el.text=text
# Replace the legacy media controller with the maintained local enhancement.
bundle=DIST/'assets/js/dist/scripts.js';js=bundle.read_text()
js=re.sub(r'/\* Progressive enhancement: native controls and source URLs also work without JS\. \*/.*?\}\(window, document\)\);', '/* Video playback is maintained in /media-runtime.js. */',js,flags=re.S)
js=js.replace(r'/^#faq-\d+$/',r'/^#faq-[a-z0-9-]+$/')
bundle.write_text(js)
for filename in ['media-runtime.js','seo-performance.css','rdstation-form.css','rdstation-form.js','rdstation-whatsapp.js','contact-preview.css','preview.css','preview.js','site-polish.css']:(DIST/filename).write_bytes((ROOT/'src'/filename).read_bytes())
# Existing CSS targets H2 in the approved campaign. Preserve its appearance after semantic H1 correction.
for filename in ['liveclass-intro.css']:
 p=ROOT/'src'/filename;s=p.read_text();s=re.sub(r'(?<![\w,-])h2(?![\w-])',':is(h1,h2)',s);p.write_text(s);(DIST/filename).write_text(s)
organization={'@type':'EducationalOrganization','@id':ORG,'name':'United Idiomas','url':BASE+'/',
 'logo':{'@type':'ImageObject','url':BASE+'/assets/images/logo-united-idiomas.png'},
 'sameAs':['https://www.instagram.com/unitedidiomas/','https://www.facebook.com/unitedinstitute/','https://br.linkedin.com/company/united-institute','https://www.youtube.com/@unitedidiomas']}
prod=ROOT/'seo/production';prod.mkdir(exist_ok=True)
for route,meta in META.items():
 p=DIST/route.strip('/')/'index.html' if route!='/' else DIST/'index.html'
 d=html.fromstring(p.read_bytes());d.set('lang','pt-BR');head=d.find('head')
 # The final stylesheet resets these values too. Establish the page origin
 # before its download so the UA's 8px body margin cannot become an early layout.
 for old in head.xpath('./style[@data-united-base]'):head.remove(old)
 base_style=etree.Element('style',{'data-united-base':''});base_style.text='html,body{margin:0;padding:0}'
 head.insert(0,base_style)
 for e in head.xpath('./title|./meta[@name="description" or @name="keywords" or @name="robots" or @name="googlebot" or @property or starts-with(@name,"twitter:")]|./link[@rel="canonical"]|./script[@type="application/ld+json"]'):e.getparent().remove(e)
 for e in d.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," preview-mark ")]'):e.getparent().remove(e)
 etree.SubElement(head,'meta',name='robots',content='index,follow,max-image-preview:large')
 title=etree.SubElement(head,'title');title.text=meta['title']
 url=BASE+route
 tags=[{'name':'description','content':meta['description']},{'property':'og:type','content':'website'},{'property':'og:locale','content':'pt_BR'},{'property':'og:site_name','content':'United Idiomas'},{'property':'og:title','content':meta['title']},{'property':'og:description','content':meta['description']},{'property':'og:url','content':url},{'property':'og:image','content':BASE+'/assets/images/logo-united-idiomas.png'},{'name':'twitter:card','content':'summary'},{'name':'twitter:title','content':meta['title']},{'name':'twitter:description','content':meta['description']}]
 for attrs in tags:etree.SubElement(head,'meta',attrs)
 etree.SubElement(head,'link',rel='canonical',href=url)
 page={'@type':meta['type'],'@id':url+'#webpage','url':url,'name':meta['title'],'description':meta['description'],'inLanguage':'pt-BR','isPartOf':{'@id':BASE+'/#website'},'about':{'@id':ORG}}
 graph=[organization,{'@type':'WebSite','@id':BASE+'/#website','url':BASE+'/','name':'United Idiomas','inLanguage':'pt-BR','publisher':{'@id':ORG}},page]
 if route!='/':
  page['breadcrumb']={'@id':url+'#breadcrumb'}
  graph.append({'@type':'BreadcrumbList','@id':url+'#breadcrumb','itemListElement':[
   {'@type':'ListItem','position':1,'name':'United Idiomas','item':BASE+'/'},
   {'@type':'ListItem','position':2,'name':meta['name'],'item':url}]})
 if route=='/cursos/':
  courses=[('Live Class','Curso de inglês online e ao vivo com trilha educacional de 18 meses, conversação ilimitada e horários flexíveis.','#live-class'),('United Business','Curso de inglês para comunicação em reuniões, apresentações e negócios.','#united-business')]
  for name,desc,anchor in courses:graph.append({'@type':'Course','@id':url+anchor,'name':name,'description':desc,'url':url+anchor,'inLanguage':'pt-BR','provider':{'@id':ORG}})
  page['hasPart']=[{'@id':url+a} for _,_,a in courses]
 if route=='/':
  # These are interactive banner groups, not independently distributable articles.
  for panel in d.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," preview-panel ")]'):
   panel.tag='div'
  # Remove inherited inline placement so CSS also works before JavaScript runs.
  for link in d.xpath('//a[contains(concat(" ",normalize-space(@class)," ")," banner-whatsapp ")]'):
   style=';'.join(part for part in link.get('style','').split(';') if part.strip() and part.split(':',1)[0].strip().lower() not in ('position','z-index'))
   if style:link.set('style',style)
   else:link.attrib.pop('style',None)
  h=d.get_element_by_id('liveclass-intro-title');h.tag='h1'
  inner(h,COPY['home_heading'][0]);etree.SubElement(h,'br').tail='\n'+COPY['home_heading'][1]
  etree.SubElement(h,'br').tail='\n';etree.SubElement(h,'span').text=COPY['home_heading'][2]
  inner(d.xpath('//p[@class="liveclass-intro-description"]')[0],COPY['home_intro'])
  inner(d.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," benefit-speaking ")]/p')[0],COPY['speaking_benefit'])
  inner(d.xpath('//*[@id="storytelling"]//div[@class="text"]/p')[0],COPY['storytelling'])
  inner(d.xpath('//*[@id="live-class"]//div[@class="texts"]/h3')[0],COPY['platform_heading'])
  inner(d.xpath('//p[@class="ondemand-intro"]')[0],COPY['ondemand_intro'])
  for card in d.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," benefit-card ")]'):
   if 'On Demand' in card.find('h3').text_content():inner(card.find('p'),COPY['ondemand_benefit'])
  for a in d.xpath('//a[normalize-space(text())="VEJA MAIS SOBRE O CURSO"]'):inner(a,'Conheça o curso de inglês Live Class')
 elif route=='/quem-somos/':
  h=d.xpath('//main//h1')[0];inner(h,'Há mais de 17 anos, uma escola de inglês que conecta pessoas e oportunidades.')
  for h in d.xpath('//main//h2'):
   if '100 mil' in h.text_content():inner(h,'Mais de 150 mil alunos em nossa história. Inglês que faz parte da vida.')
  methodology=d.xpath('//*[@id="metodologia-digital"]|//main//p[contains(text(),"Inglês real, sem decoreba")]')[0]
  methodology.set('id','metodologia-digital');inner(methodology,COPY['methodology'])
  unit_slugs={'Cornélio Procópio':'cornelio-procopio','Ipiranga':'ipiranga','Maringá':'maringa','Osasco':'osasco','Santo Amaro':'santo-amaro','Tatuapé':'tatuape'}
  locations=[]
  for box in d.get_element_by_id('unidades-hibridas').xpath('.//div[@class="box"]'):
   name=box.find('h3').text_content().strip();ident='unidade-'+unit_slugs[name]
   box.set('id',ident)
   address=box.find('address').text_content().strip()
   for old in box.xpath('.//a[@data-unit-map]'):old.getparent().remove(old)
   phone=box.xpath('./a[contains(@href,"wa.me/")]')[0];phone.set('rel','noopener noreferrer')
   maps='https://www.google.com/maps/search/?'+urlencode({'api':'1','query':address+', '+name+', Brasil'})
   address_element=box.find('address');inner(address_element,'')
   link=etree.SubElement(address_element,'a',href=maps,target='_blank',rel='noopener noreferrer',**{'class':'unit-map-link','data-unit-map':'','aria-label':'Ver endereço da unidade '+name+' no mapa: '+address});link.text=address
   # Only data already displayed in the unit cards: no invented city, coordinates or hours.
   location={'@type':'Place','@id':url+'#'+ident,'name':'United Idiomas — '+name,'url':url+'#'+ident,'address':address,'telephone':'+'+phone.get('href').rsplit('/',1)[-1],'hasMap':maps}
   graph.append(location);locations.append({'@id':location['@id']})
  page['mainEntity']={'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i+1,'item':place} for i,place in enumerate(locations)]}
 elif route=='/cursos/':
  # The first visible video/poster must not wait for WOW or a third-party script.
  for banner in d.xpath('//*[@id="live-class"]/div[@class="top"]/div[contains(concat(" ",normalize-space(@class)," ")," banner ")]'):
   banner.set('class',' '.join(c for c in banner.get('class','').split() if c not in ('wow','fadeIn','animated')))
  h=d.xpath('//main//h1')[0];inner(h,'')
  context=etree.SubElement(h,'span',{'class':'course-title-context'});context.text='Curso de inglês online e ao vivo';context.tail=' Live Class'
  intro=d.xpath('//*[@id="live-class"]/div[@class="top"]/div[@class="text wow fadeIn"]/p')[0]
  inner(intro,'O ');emphasis=etree.SubElement(intro,'strong');emphasis.text='Live Class';emphasis.tail=COPY['courses_intro'].removeprefix('O Live Class')
  for heading in d.get_element_by_id('ondemand').xpath('.//li/h2'):
   if 'Conteúdo on-demand' in heading.text_content() or 'United OnDemand opcional' in heading.text_content():
    inner(heading,'United OnDemand opcional: ');emphasis=etree.SubElement(heading,'strong');emphasis.text='inglês para viagens, negócios';emphasis.tail=' e temas atuais.'
  for heading in d.xpath('//main//h4'):
   if heading.text_content().strip()=='O que você irá aprender:':
    heading.tag='h3'
    heading.set('class', (heading.get('class','')+' business-topics-heading').strip())
  for el in d.xpath('//main//p'):
   if 'melhor Master Business' in el.text_content():inner(el,'Um curso de inglês para reuniões, apresentações, negociações e outros desafios profissionais.')
 elif route=='/faq/':
  inner(d.xpath('//main//h1')[0],'Tire suas dúvidas sobre nossos cursos de inglês')
  for h in d.xpath('//main//h3'):
   if h.text_content().strip()=='Iniciando na United':h.tag='h2'
  updates={4:'A metodologia combina aulas ao vivo e prática do idioma. Sua evolução depende do nível inicial, da frequência e da dedicação aos estudos.',6:'O United Full reúne o Live Class e o Master Business em uma jornada de 24 meses: uma base para a comunicação do dia a dia e a aplicação do inglês no ambiente profissional.',13:'O Business é voltado à comunicação profissional. A equipe avalia seu nível de inglês para indicar a trilha adequada.',14:'O United Business oferece a opção de certificação internacional mediante avaliação TOEIC. Consulte a equipe para conhecer as condições e o percurso recomendado.'}
  for n,text in updates.items():inner(d.get_element_by_id(f'faq-{n}-answer'),text)
  article=d.xpath('//main//article')[0]
  for entry in COPY['faq_additions']:
   ident,q,a=entry['id'],entry['question'],entry['answer']
   existing=d.xpath('//*[@id="'+ident+'"]')
   if existing:existing[0].getparent().remove(existing[0])
   block=etree.SubElement(article,'div',{'class':'question','id':ident})
   b=etree.SubElement(block,'button',{'type':'button','class':'faq-toggle','aria-expanded':'false','aria-controls':ident+'-answer','id':ident+'-question'});b.text=q
   answer=etree.SubElement(block,'div',{'class':'text','id':ident+'-answer','aria-labelledby':ident+'-question'});etree.SubElement(answer,'p').text=a
   links=etree.SubElement(answer,'p',{'class':'faq-course-links'})
   for i,(href,label) in enumerate(entry['links']):
    link=etree.SubElement(links,'a',href=href);link.text=label
    if i<len(entry['links'])-1:link.tail=' · '
  # Derive the question index from the actual content so new search entries stay navigable.
  indexes=d.xpath('//ul[li/a[@data-faq-id]]')
  for index in indexes:
   for child in list(index):index.remove(child)
   for block in article.xpath('./div[contains(concat(" ",normalize-space(@class)," ")," question ")]'):
    b=block.find('button');li=etree.SubElement(index,'li')
    link=etree.SubElement(li,'a',href='#'+block.get('id'),**{'data-faq-id':block.get('id')});link.text=b.text_content()
 if route in ('/','/cursos/'):
  inner(d.xpath('//*[@id="jimmy-united-idiomas"]//div[@class="text"]/p[not(@class)]')[0],COPY['jimmy'])
 # Link directly to the WordPress canonical host, preserving any query/fragment.
 for icon in d.xpath('//img[contains(@src,"icon-button-whatsapp.png")]|//a[contains(concat(" ",normalize-space(@class)," ")," banner-whatsapp ")]/img'):
  icon.set('src','/assets/images/icon-button-whatsapp.svg');icon.set('width','22');icon.set('height','22')
 for link in d.xpath('//a[@href]'):
  parsed=urlsplit(link.get('href'))
  if parsed.netloc=='www.unitedidiomas.com' and parsed.path.rstrip('/')=='/blog':
   link.set('href',parsed._replace(scheme='https',netloc='unitedidiomas.com',path='/blog/').geturl())
 # Old inline SVG icons reused gradient IDs. Keep each paint reference within its own SVG.
 counts=Counter(d.xpath('//*[@id]/@id'))
 for n,svg in enumerate(d.xpath('//svg')):
  for node in svg.xpath('.//*[@id]'):
   old=node.get('id')
   if counts[old]>1:
    new=old+'-instance-'+str(n);node.set('id',new)
    for element in svg.iter():
     for attr,value in list(element.attrib.items()):
      if attr!='id':element.set(attr,value.replace('url(#'+old+')','url(#'+new+')') if value!='#'+old else '#'+new)
 schema=etree.SubElement(head,'script',{'type':'application/ld+json'});schema.text=json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False,separators=(',',':'))
 # Production metadata; the preview exporter replaces robots in its separate output.
 fragments=[f'<title>{escape_html.escape(meta["title"])}</title>']+[html.tostring(el,encoding='unicode') for el in head.xpath('./meta[@name="robots" or @name="description" or @property or starts-with(@name,"twitter:")]|./link[@rel="canonical"]|./script[@type="application/ld+json"]')]
 (prod/('home-head.html' if route=='/' else route.strip('/')+'-head.html')).write_text('\n'.join(fragments)+'\n')
 # Keep the account loader async and the remaining scripts in order after parsing.
 for old in d.xpath('//script[contains(@src,"media-runtime.js")]'):old.getparent().remove(old)
 if route in ('/','/cursos/','/faq/'):
  # These routes use native review/benefit tracks and have no Slick carousel.
  for old in d.xpath('//script[contains(@src,"responsive-home.js")]'):old.getparent().remove(old)
  for legacy in d.xpath('//script[contains(@src,"/js/dist/scripts.js")]'):
   legacy.set('src','/assets/js/dist/scripts-core.js')
  if not (DIST/'assets/js/dist/scripts-core.js').is_file():
   raise ValueError('Run scripts/optimize-page-code.py before rebuilding page metadata.')
 for script in d.xpath('//script[@src]'):
  if script.get('src')=='https://d335luupugsy2.cloudfront.net/js/loader-scripts/ee4f0815-8266-4fb5-ba25-416836b02312-loader.js':
   script.set('async','async');script.attrib.pop('defer',None)
  else:
   script.set('defer','defer');script.attrib.pop('async',None)
  parsed=urlsplit(script.get('src'))
  if not parsed.scheme and not parsed.netloc:
   path=urljoin(route,parsed.path);asset=DIST/path.lstrip('/')
   if asset.is_file():script.set('src',path+'?v='+digest(asset))
 videos=d.xpath('//video')
 for i,v in enumerate(videos):
  v.attrib.pop('autoplay',None);v.attrib.pop('controls',None)
  v.set('preload','none');v.set('playsinline','');v.set('webkit-playsinline','');v.set('muted','');v.set('loop','');v.set('data-managed-video','')
  # Native lazy loading also defers below-the-fold posters in supporting browsers.
  # Keep the first visible video on the course/institutional pages eager.
  v.set('loading','eager' if route in ('/cursos/','/quem-somos/') and i==0 else 'lazy')
  v.set('disablepictureinpicture','');v.set('disableremoteplayback','');v.set('controlslist','nodownload nofullscreen noremoteplayback')
  if not v.get('aria-label'):v.set('aria-label',{'/cursos/':['Aulas online de inglês Live Class','Conversação e prática de inglês','Inglês para negócios'],'/quem-somos/':['Conheça a United Idiomas']}.get(route,['Cena do curso'])[i])
  # HTML source is a void tag: keep its fallback text/links as siblings, never nested.
  for source in v.findall('source'):
   for child in list(source):source.remove(child);v.append(child)
 if videos:etree.SubElement(d.find('body'),'script',src='/media-runtime.js?v='+digest(DIST/'media-runtime.js'),defer='defer')
 # Native UI is independent of RD: do not make opening menus/contact dialogs
 # wait for the third-party SDK. Keep the SDK ahead of its form initializer.
 sdk=d.xpath('//script[@id="rdstation-forms-sdk"]')
 if sdk:
  anchor=sdk[0]
  independent={'rdstation-whatsapp.js','contact-preview.js','site-refinement.js','shared-header.js','media-runtime.js'}
  for script in d.xpath('//script[@src]'):
   if Path(urlsplit(script.get('src')).path).name in independent:anchor.addprevious(script)
 for old in head.xpath('./link[contains(@href,"seo-performance.css")]'):head.remove(old)
 etree.SubElement(head,'link',rel='stylesheet',href='/seo-performance.css?v='+digest(DIST/'seo-performance.css'))
 for link in head.xpath('./link[contains(@href,"liveclass-intro.css")]'):link.set('href','/liveclass-intro.css?v='+digest(DIST/'liveclass-intro.css'))
 p.write_text('<!doctype html>\n'+html.tostring(d,encoding='unicode',method='html'))
 print('SEO and media:',route)
# The reviewed production robots is the source of truth; never overwrite its policy here.
# WordPress owns its automatically updated sitemap. Keep both discoverable.
(prod/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('  <url><loc>'+BASE+r+'</loc></url>\n' for r in META)+'</urlset>\n')
for name in ('robots.txt','sitemap.xml'):(DIST/name).write_bytes((prod/name).read_bytes())
