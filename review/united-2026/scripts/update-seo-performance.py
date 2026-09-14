"""Final, repeatable pass after older preview builders. Never enable indexing on this private preview."""
from pathlib import Path
from lxml import html, etree
from hashlib import sha256
from urllib.parse import urlsplit, urljoin
from collections import Counter
import json,re,html as escape_html
ROOT=Path(__file__).resolve().parents[1]; DIST=ROOT/'dist'
META=json.loads((ROOT/'seo/metadata.json').read_text())
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
for filename in ['media-runtime.js','seo-performance.css']:(DIST/filename).write_bytes((ROOT/'src'/filename).read_bytes())
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
 for e in head.xpath('./title|./meta[@name="description" or @name="keywords" or @property or starts-with(@name,"twitter:")]|./link[@rel="canonical"]|./script[@type="application/ld+json"]'):e.getparent().remove(e)
 title=etree.SubElement(head,'title');title.text=meta['title']
 url=BASE+route
 tags=[{'name':'description','content':meta['description']},{'property':'og:type','content':'website'},{'property':'og:locale','content':'pt_BR'},{'property':'og:site_name','content':'United Idiomas'},{'property':'og:title','content':meta['title']},{'property':'og:description','content':meta['description']},{'property':'og:url','content':url},{'property':'og:image','content':BASE+'/assets/images/logo-united-idiomas.png'},{'name':'twitter:card','content':'summary'},{'name':'twitter:title','content':meta['title']},{'name':'twitter:description','content':meta['description']}]
 for attrs in tags:etree.SubElement(head,'meta',attrs)
 etree.SubElement(head,'link',rel='canonical',href=url)
 page={'@type':meta['type'],'@id':url+'#webpage','url':url,'name':meta['title'],'description':meta['description'],'inLanguage':'pt-BR','isPartOf':{'@id':BASE+'/#website'},'about':{'@id':ORG}}
 graph=[organization,{'@type':'WebSite','@id':BASE+'/#website','url':BASE+'/','name':'United Idiomas','inLanguage':'pt-BR','publisher':{'@id':ORG}},page]
 if route=='/cursos/':
  courses=[('Live Class','Curso de inglês online e ao vivo com trilha educacional de 18 meses, conversação ilimitada e horários flexíveis.','#live-class'),('United Business','Curso de inglês para comunicação em reuniões, apresentações e negócios.','#united-business')]
  for name,desc,anchor in courses:graph.append({'@type':'Course','@id':url+anchor,'name':name,'description':desc,'url':url+anchor,'inLanguage':'pt-BR','provider':{'@id':ORG}})
  page['hasPart']=[{'@id':url+a} for _,_,a in courses]
 if route=='/':
  h=d.get_element_by_id('liveclass-intro-title');h.tag='h1'
  section=h.getparent()
  for el in section.xpath('.//p'):
   if 'Aulas online e ao vivo.' in el.text_content():inner(el,'Curso de inglês online e ao vivo, com conversação ilimitada e um ecossistema completo para transformar aprendizado em confiança.')
  for a in d.xpath('//a[normalize-space(text())="VEJA MAIS SOBRE O CURSO"]'):inner(a,'Conheça o curso de inglês Live Class')
 elif route=='/quem-somos/':
  h=d.xpath('//main//h1')[0];inner(h,'Há mais de 17 anos, uma escola de inglês que conecta pessoas e oportunidades.')
  for h in d.xpath('//main//h2'):
   if '100 mil' in h.text_content():inner(h,'Mais de 150 mil alunos em nossa história. Inglês que faz parte da vida.')
 elif route=='/cursos/':
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
  new=[('faq-escolher','Como escolher o melhor curso de inglês para mim?','Compare a modalidade das aulas, a duração da trilha, as oportunidades de conversação e a flexibilidade dos horários. O melhor curso de inglês para você combina seus objetivos com uma rotina de estudos possível de manter. Conheça as propostas do Live Class e do United Business.'),('faq-18-meses','Como funciona o inglês em 18 meses?','O Live Class tem uma trilha educacional de 18 meses, com aulas online e ao vivo e recursos de prática entre os encontros. Consulte a equipe para entender o percurso indicado ao seu nível e a frequência de estudos prevista.'),('faq-online','O curso online de inglês tem aulas ao vivo?','Sim. O Live Class combina aulas online e ao vivo, conversação ilimitada, storytelling com personagens exclusivos e conteúdos On Demand. Com o Jimmy, a prática pode continuar mesmo depois da aula.')]
  article=d.xpath('//main//article')[0]
  for ident,q,a in new:
   existing=d.xpath('//*[@id="'+ident+'"]')
   if existing:existing[0].getparent().remove(existing[0])
   block=etree.SubElement(article,'div',{'class':'question','id':ident})
   b=etree.SubElement(block,'button',{'type':'button','class':'faq-toggle','aria-expanded':'false','aria-controls':ident+'-answer','id':ident+'-question'});b.text=q
   answer=etree.SubElement(block,'div',{'class':'text','id':ident+'-answer','aria-labelledby':ident+'-question'});etree.SubElement(answer,'p').text=a
  # Derive the question index from the actual content so new search entries stay navigable.
  indexes=d.xpath('//ul[li/a[@data-faq-id]]')
  for index in indexes:
   for child in list(index):index.remove(child)
   for block in article.xpath('./div[contains(concat(" ",normalize-space(@class)," ")," question ")]'):
    b=block.find('button');li=etree.SubElement(index,'li')
    link=etree.SubElement(li,'a',href='#'+block.get('id'),**{'data-faq-id':block.get('id')});link.text=b.text_content()
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
 # Same content metadata for integration into the official PHP head, without preview robots.
 fragments=[f'<title>{escape_html.escape(meta["title"])}</title>']+[html.tostring(el,encoding='unicode') for el in head.xpath('./meta[@name="description" or @property or starts-with(@name,"twitter:")]|./link[@rel="canonical"]|./script[@type="application/ld+json"]')]
 (prod/('home-head.html' if route=='/' else route.strip('/')+'-head.html')).write_text('\n'.join(fragments)+'\n')
 # Load local scripts in order after parsing; remove repeated runtime tags on rerun.
 for old in d.xpath('//script[contains(@src,"media-runtime.js")]'):old.getparent().remove(old)
 for script in d.xpath('//script[@src]'):
  script.set('defer','defer')
  parsed=urlsplit(script.get('src'))
  if not parsed.scheme and not parsed.netloc:
   path=urljoin(route,parsed.path);asset=DIST/path.lstrip('/')
   if asset.is_file():script.set('src',path+'?v='+digest(asset))
 videos=d.xpath('//video')
 for i,v in enumerate(videos):
  v.attrib.pop('autoplay',None);v.attrib.pop('controls',None)
  v.set('preload','none');v.set('playsinline','');v.set('webkit-playsinline','');v.set('muted','');v.set('loop','');v.set('data-managed-video','')
  v.set('disablepictureinpicture','');v.set('disableremoteplayback','');v.set('controlslist','nodownload nofullscreen noremoteplayback')
  if not v.get('aria-label'):v.set('aria-label',{'/cursos/':['Aulas online de inglês Live Class','Conversação e prática de inglês','Inglês para negócios'],'/quem-somos/':['Conheça a United Idiomas']}.get(route,['Cena do curso'])[i])
  # HTML source is a void tag: keep its fallback text/links as siblings, never nested.
  for source in v.findall('source'):
   for child in list(source):source.remove(child);v.append(child)
 if videos:etree.SubElement(d.find('body'),'script',src='/media-runtime.js?v='+digest(DIST/'media-runtime.js'),defer='defer')
 for old in head.xpath('./link[contains(@href,"seo-performance.css")]'):head.remove(old)
 etree.SubElement(head,'link',rel='stylesheet',href='/seo-performance.css?v='+digest(DIST/'seo-performance.css'))
 for link in head.xpath('./link[contains(@href,"liveclass-intro.css")]'):link.set('href','/liveclass-intro.css?v='+digest(DIST/'liveclass-intro.css'))
 p.write_text('<!doctype html>\n'+html.tostring(d,encoding='unicode',method='html'))
 print('SEO and media:',route)
# These files are for the real domain only, deliberately outside the private dist output.
(prod/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+BASE+'/sitemap.xml\n')
(prod/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('  <url><loc>'+BASE+r+'</loc></url>\n' for r in META)+'</urlset>\n')
