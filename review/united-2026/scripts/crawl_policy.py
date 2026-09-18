"""Validate this package's intentionally small, universal robots policy.

This is not a general REP parser. Extra user-agent groups, wildcard/end-anchor
rules and encoded/non-ASCII rule paths require an explicit policy review. Plain
prefix matching follows Google's specificity rule; Allow wins an equal match.
"""
import re
from urllib.parse import urlsplit


SITEMAPS = {
    'https://www.unitedidiomas.com/sitemap.xml',
    'https://unitedidiomas.com/blog/sitemap_index.xml',
}
PUBLIC_PATHS = (
    '/', '/cursos/', '/quem-somos/', '/faq/', '/blog/',
    '/blog/wp-content/', '/blog/wp-includes/', '/assets/',
    '/blog/wp-admin/admin-ajax.php',
    '/review/', '/review/united-2026/dist/', '/comparar-contato/',
)
UNRESERVED = frozenset('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~')


def policy(text):
    agents, rules, sitemaps = [], [], []
    for original in text.splitlines():
        line = original.split('#', 1)[0].strip()
        if not line:
            continue
        key, separator, value = line.partition(':')
        if not separator:
            raise ValueError(f'Linha inválida em robots.txt: {line}')
        key, value = key.strip().lower(), value.strip()
        if key == 'user-agent':
            agents.append(value)
        elif key in ('allow', 'disallow'):
            if agents != ['*']:
                raise ValueError('Robots de produção exige um único grupo User-agent: *.')
            if (not value.startswith('/') or not value.isascii()
                    or any(char in value for char in '*$%?')
                    or any(char.isspace() for char in value)):
                raise ValueError('Regra de robots exige prefixo de caminho ASCII literal; revisar outra sintaxe.')
            rules.append((value, key == 'allow'))
        elif key == 'sitemap':
            sitemaps.append(value)
        else:
            raise ValueError(f'Diretiva de robots não suportada pelo contrato: {key}')
    if agents != ['*']:
        raise ValueError('Robots de produção exige um único grupo User-agent: *.')
    return rules, sitemaps


def permits(rules, url):
    parsed = urlsplit(url)
    path = parsed.path or '/'
    if parsed.query:
        path += '?' + parsed.query
    # REP compares unreserved ASCII escapes to their literal representation.
    # Reserved escapes such as %2F stay encoded, preserving path boundaries.
    path = re.sub(r'%([0-9a-fA-F]{2})', lambda match:
                  chr(int(match[1], 16)) if chr(int(match[1], 16)) in UNRESERVED
                  else match[0].upper(), path)
    matches = [(len(prefix), allow)
               for prefix, allow in rules if path.startswith(prefix)]
    return max(matches, default=(0, True))[1]


def validate_production_robots(text, public_paths=()):
    """Raise ValueError on crawl conflicts; call with every exported public file."""
    rules, sitemaps = policy(text)
    if set(sitemaps) != SITEMAPS or len(sitemaps) != len(SITEMAPS):
        raise ValueError('Robots deve declarar uma vez os sitemaps comercial e WordPress oficiais.')
    for url in (*PUBLIC_PATHS, *sitemaps, *public_paths):
        if not permits(rules, url):
            raise ValueError(f'Robots de produção impede rastreamento público: {url}')
    # Only the existing WordPress administration may be restricted. This guards
    # unseen posts/assets too, beyond the concrete URLs passed by the exporter.
    for prefix, allow in rules:
        if not allow and not prefix.startswith('/blog/wp-admin/'):
            raise ValueError(f'Bloqueio fora da administração WordPress precisa de revisão: {prefix}')
    if permits(rules, '/blog/wp-admin/') or permits(rules, '/blog/wp-admin/index.php'):
        raise ValueError('Robots de produção deve restringir a administração WordPress.')
