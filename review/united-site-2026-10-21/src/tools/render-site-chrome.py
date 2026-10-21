"""Render the local navigation/footer into HTML, so links never depend on JS.

Run from any directory. Only local proposal pages listed in navigation.json are modified.
"""
from pathlib import Path
import argparse
import json
import re

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / 'navigation.json').read_text())
ONDEMAND_URL = 'https://unitedondemand.com.br/'


def ondemand_link(content, label='United OnDemand'):
    return f'<a href="{ONDEMAND_URL}" target="_blank" rel="noopener" aria-label="{label} (abre em nova aba)">{content}</a>'


def render(page):
    prefix, key = page['prefix'], page['key']
    route = lambda name: prefix + CONFIG['routes'][name]
    current = lambda name: ' aria-current="page"' if name == key else ''
    logo = f'<a class="brand" href="{route("home")}" aria-label="United — página inicial"><img src="{prefix}assets/logo-united.webp" width="258" height="164" alt="United"></a>'
    student = f'<a class="student" href="{CONFIG["student"]}" target="_blank" rel="noopener">Área do aluno</a>'
    student_header = f'<a class="student" href="{CONFIG["student"]}" target="_blank" rel="noopener" aria-label="Área do aluno" aria-describedby="student-access-caption"><span id="student-access-caption" class="student-caption">Aulas ao vivo</span>Área do aluno</a>'
    courses = ''.join(f'<a href="{route(c["key"])}"{current(c["key"])}><strong>{c["label"]}</strong><span>{c["description"]}</span></a>' for c in CONFIG['courses'])
    course_pills = ''.join(f'<a href="{route(c["key"])}"{current(c["key"])}>{c["label"]}</a>' for c in CONFIG['courses'])
    ondemand_footer = ondemand_link('OnDemand · inglês no seu ritmo', 'OnDemand · inglês no seu ritmo')
    course_active = ' data-current-course' if key in ('live', 'business', 'full') else ''
    nav = f'<a href="{route("home")}"{current("home")}>Início</a><a href="{route("about")}"{current("about")}>Quem somos</a><details class="site-courses"{course_active}><summary>Cursos</summary><div class="site-course-menu">{courses}</div></details><a href="{route("faq")}"{current("faq")}>FAQ</a><a href="{route("blog")}"{current("blog")}>Blog</a><a href="#contato" data-contact-form>Contato</a>'
    header = f'''<header class="header site-header"><div class="wrap nav">{logo}<nav class="desktop-nav" aria-label="Navegação principal">{nav}</nav>{student_header}<button class="menu-button" type="button" aria-expanded="false" aria-haspopup="dialog" aria-controls="mobile-menu" aria-label="Abrir menu"><span></span><span></span><span></span></button></div></header>'''
    social = ''.join(f'<li><a href="{url}" target="_blank" rel="noopener" aria-label="{label}"><img src="{prefix}assets/icon-menu-{name}.webp" width="{width}" height="{height}" alt=""></a></li>' for label, name, url, width, height in [('Facebook','facebook','https://www.facebook.com/unitedinstitute/',15,25),('Instagram','instagram','https://www.instagram.com/unitedidiomas/',24,24),('LinkedIn','linkedin','https://br.linkedin.com/company/united-institute',25,24)])
    managed = ' data-site-menu-managed' if key in ('home', 'faq', 'blog') else ''
    mobile = f'''<dialog id="mobile-menu" class="mobile-menu site-mobile-menu" aria-label="Menu de navegação"{managed}><div class="mobile-menu-top">{logo}<button type="button" class="dialog-close mobile-menu-close" aria-label="Fechar menu"><span aria-hidden="true">×</span></button></div><div class="mobile-student-access"><p>Já é aluno?</p>{student}</div><nav aria-label="Menu principal no celular"><ul class="mobile-menu-links"><li><a href="{route("home")}"{current("home")}>Início</a></li><li><a href="{route("about")}"{current("about")}>Quem somos</a></li><li><span class="mobile-course-label">Cursos</span><div class="mobile-course-links">{course_pills}</div></li><li><a href="{route("faq")}"{current("faq")}>FAQ</a></li><li><a href="{route("blog")}"{current("blog")}>Blog</a></li><li><a href="#contato" data-contact-form>Contato</a></li></ul></nav><ul class="mobile-menu-socials" aria-label="Redes sociais">{social}</ul></dialog>'''
    footer = f'''<footer id="rodape" class="site-footer"><div class="wrap"><div class="site-footer-main"><div class="site-footer-brand">{logo}<p>Inglês para a vida.<br>E para os seus próximos passos.</p><div class="site-footer-socials" aria-label="Redes sociais da United"><a href="https://www.instagram.com/unitedidiomas/" target="_blank" rel="noopener">Instagram</a><a href="https://www.facebook.com/unitedinstitute/" target="_blank" rel="noopener">Facebook</a><a href="https://br.linkedin.com/company/united-institute" target="_blank" rel="noopener">LinkedIn</a><a href="https://www.youtube.com/@unitedidiomas" target="_blank" rel="noopener">YouTube</a></div></div><div class="site-footer-links"><nav aria-label="Cursos da United"><h2>Cursos</h2>{ondemand_footer}<a href="{route("live")}">Live Class · inglês online e ao vivo</a><a href="{route("business")}">Business · inglês para negócios</a><a href="{route("full")}">Full · Live Class + Business</a></nav><nav aria-label="Conheça a United"><h2>A United</h2><a href="{route("home")}">Página inicial</a><a href="{route("about")}">Quem somos</a><a href="{route("about")}#unidades">Nossas unidades</a><a href="{route("faq")}">Perguntas frequentes</a><a href="{route("blog")}"{current("blog")}>Blog</a><a href="https://www.reclameaqui.com.br/empresa/united-idiomas/" target="_blank" rel="noopener">United no Reclame Aqui</a></nav><nav aria-label="Atendimento da United"><h2>Atendimento</h2><a href="#contato" data-contact-form>Formulário de contato</a><a href="{CONFIG["whatsapp"]}" target="_blank" rel="noopener">WhatsApp · fale com a United</a><a href="{CONFIG["headOffice"]}">Head Office · (11) 3078-2346</a><a href="{CONFIG["student"]}" target="_blank" rel="noopener">Área do aluno</a><a href="{CONFIG["partnerships"]}" target="_blank" rel="noopener">Parcerias &amp; Convênios</a><a href="{CONFIG["partnerships"]}" target="_blank" rel="noopener">Seja um franqueado</a></nav></div></div><div class="site-footer-bottom"><span>© United 2026.</span><span>Todos os direitos reservados.</span><a href="#inicio">Voltar ao topo</a></div></div></footer>'''
    return header, mobile, footer


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--blog-only', action='store_true', help='Update only blog templates and readers')
options = parser.parse_args()
for page in CONFIG['pages']:
    if options.blog_only and page['key'] != 'blog':
        continue
    path = ROOT / page['file']
    html = path.read_text()
    header, mobile, footer = render(page)
    html, count = re.subn(r'<header\b[\s\S]*?</header>', lambda _: header, html, count=1)
    if count != 1:
        raise RuntimeError(f'Header missing in {path}')
    if page['key'] == 'home' and 'id="united-mobile-menu"' in html:
        # Original Home mobile menu immediately precedes main.
        html, count = re.subn(r'<div\b[^>]*id="united-mobile-menu"[\s\S]*?(?=<main\b)', lambda _: mobile + ' ', html, count=1)
    else:
        html, count = re.subn(r'<dialog\b[^>]*id="mobile-menu"[\s\S]*?</dialog>', lambda _: mobile, html, count=1)
    if count != 1:
        raise RuntimeError(f'Mobile menu missing in {path}')
    html, count = re.subn(r'<footer\b[\s\S]*?</footer>', lambda _: footer, html, count=1)
    if count != 1:
        raise RuntimeError(f'Footer missing in {path}')
    if 'site-navigation.css' not in html:
        html = html.replace('</head>', f'<link rel="stylesheet" href="{page["prefix"]}site-navigation.css?v=1">\n</head>')
    if 'site-navigation.js' not in html:
        html = html.replace('</body>', f'<script src="{page["prefix"]}site-navigation.js?v=1" defer></script>\n</body>')
    for script in ('rdstation-whatsapp.js', 'rdstation-account.js'):
        if script not in html:
            html = html.replace('</body>', f'<script src="{page["prefix"]}{script}?v=20261021" defer></script>\n</body>')
    html = html.replace('footer.css?v=1', 'footer.css?v=2')
    path.write_text(html)
    print(page['file'])
