"""Apply only shared navigation; do not rebuild approved page sections."""
from pathlib import Path
import re, hashlib
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
home=(DIST/'index.html').read_text()
header=re.search(r'<header\b.*?</header>',home,re.S).group()
header=re.sub(r'^<header[^>]*>', '<header class="united-header">', header)
header=header.replace('href="#inicio"','href="/"').replace('src="assets/','src="/assets/')
header=header.replace('href="#united-full"','href="/#united-full"')
header=header.replace('<nav>', '<nav aria-label="Menu principal">') if 'aria-label="Menu principal"' not in header else header
header=re.sub(r'\s*<a[^>]*class="button-contato anchor".*?</a>', '', header, flags=re.S)
header=re.sub(r'<a[^>]*class="open-menu".*?</a>|<button[^>]*class="open-menu".*?</button>', '<button type="button" class="open-menu" aria-label="Abrir menu" aria-expanded="false" aria-controls="united-mobile-menu"><span></span><span></span><span></span></button>', header, flags=re.S)
header=header.replace('target="_blank">', 'target="_blank" rel="noopener">')
for label,icon in [('Facebook','facebook'),('Instagram','instagram'),('LinkedIn','linkedin')]:
 header=re.sub(r'(<a[^>]*)(>\s*<img[^>]*icon-header-'+icon+r'\.png)',lambda m:m[1]+' aria-label="'+label+'"'+m[2] if 'aria-label' not in m[1] else m[0],header)
logo=re.search(r'<a[^>]*class="logo".*?</a>',header,re.S).group()
socials=re.search(r'<ul class="socials">.*?</ul>',header,re.S).group()
menu=f'''<div class="menu-mobile united-mobile-menu" id="united-mobile-menu" role="dialog" aria-modal="true" aria-label="Menu de navegação" aria-hidden="true">
  <div class="header">{logo}<button type="button" class="close-menu" aria-label="Fechar menu"><span aria-hidden="true">×</span></button></div>
  <div class="student-access"><p>Já é aluno?</p><a class="button-area" href="https://www.unitedon.com.br/student/" target="_blank" rel="noopener">Área do Aluno <span aria-hidden="true">↗</span></a></div>
  <nav aria-label="Menu principal no celular"><ul>
    <li><a href="/quem-somos/">Quem somos</a></li>
    <li><a href="/cursos/">Cursos</a><div class="mobile-course-links"><a href="/cursos/#live-class">Live Class</a><a href="/cursos/#united-business">Business</a><a href="/#united-full">Full</a></div></li>
    <li><a href="/faq/">FAQ</a></li>
    <li><a href="https://www.unitedidiomas.com/blog/" target="_blank" rel="noopener">Blog</a></li>
    <li><a href="#contato">Quero conhecer</a></li>
  </ul></nav>
  {socials}
</div>'''
(ROOT/'src/shared-header.html').write_text(header+'\n'+menu+'\n')
for filename in ['shared-header.css','shared-header.js']:
 (DIST/filename).write_bytes((ROOT/'src'/filename).read_bytes())
csshash=hashlib.sha256((DIST/'shared-header.css').read_bytes()).hexdigest()[:12]
jshash=hashlib.sha256((DIST/'shared-header.js').read_bytes()).hexdigest()[:12]
for route in ['index.html','cursos/index.html','quem-somos/index.html','faq/index.html']:
 p=DIST/route;s=p.read_text()
 s=re.sub(r'<header\b.*?</header>',lambda _:header,s,count=1,flags=re.S)
 s=re.sub(r'<div class="menu-mobile[^\"]*".*?(?=<main\b)',lambda _:menu+'\n',s,count=1,flags=re.S)
 s=re.sub(r'<link[^>]+href="/?shared-header\.css[^\"]*"[^>]*>','',s)
 s=re.sub(r'<script[^>]+src="/?shared-header\.js[^\"]*"[^>]*></script>','',s)
 s=s.replace('</head>',f'<link rel="stylesheet" href="/shared-header.css?v={csshash}"></head>')
 s=s.replace('</body>',f'<script src="/shared-header.js?v={jshash}" defer></script></body>')
 p.write_text(s)
 print('Updated navigation:',route)
