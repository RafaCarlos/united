"""Conservative, viewport-independent critical CSS for the Home.

The complete stylesheet is still delivered unchanged in rule order. This helper
duplicates its critical subset in the HTML; it never purges the full stylesheet.
Select all rules that may affect the header, every hero state, the mobile menu,
and the whole first content section. Keep contact/RD sources in full because
their DOM is created after load and can open before the external CSS arrives.
No rule is selected from a single browser's coverage or one screen size.
"""
from copy import deepcopy
import gzip
import tinycss2
from lxml import etree


CRITICAL_STYLE_ID = 'united-home-critical'
FALLBACK_ATTRIBUTE = 'data-united-home-css'
COMPLETE_SOURCES = {
    '/shared-header.css', '/contact-preview.css',
    '/rdstation-form.css', '/assets/css/contact-forms.css',
    # Some offscreen desktop images are lazy, but display:none is what prevents
    # their mobile requests. Those responsive rules must precede image layout,
    # even when their section itself is outside the first-viewport CSS scope.
    '/responsive-home.css',
}
# preview.css also contains absolutely positioned, below-fold Jimmy artwork.
# Select its hero rules by DOM scope below; including that file wholesale while
# omitting the artwork's base ancestors would position it against the viewport.
RUNTIME_CLASSES = {
    'active', 'fixed', 'open', 'united-menu-open', 'preview-compact-header',
    'contact-preview-ready', 'contact-preview-open', 'contact-section-in-view',
    'rd-whatsapp-open', 'contact-actions', 'contact-launcher',
    'contact-whatsapp', 'banner-whatsapp',
}


def _rules(css):
    rules = tinycss2.parse_stylesheet(css, skip_whitespace=True, skip_comments=False)
    if any(rule.type == 'error' for rule in rules):
        raise ValueError('CSS parse error; refusing to generate critical CSS.')
    return rules


def _tokens(tokens):
    """Collapse formatting only, preserving string/URL contents and CSS math.

    Every whitespace token remains whitespace (one space). In particular,
    descendant selectors, custom properties and calc +/- keep their separators.
    The serializer restores separators required between adjacent CSS tokens.
    """
    result = []
    for original in tokens:
        if original.type == 'comment':
            continue
        token = deepcopy(original)
        if token.type == 'whitespace':
            token.value = ' '
        for attribute in ('content', 'arguments'):
            nested = getattr(token, attribute, None)
            if nested is not None:
                setattr(token, attribute, _tokens(nested))
        result.append(token)
    return result


def compact_css(css):
    """Format a stylesheet compactly without merging rules or changing values."""
    result = []
    for rule in _rules(css):
        if rule.type == 'comment':
            # Retain license comments in the full artifact.
            if rule.value.startswith('!'):
                result.append(tinycss2.serialize([rule]))
            continue
        if getattr(rule, 'prelude', None) is not None:
            rule.prelude = _tokens(rule.prelude)
        if getattr(rule, 'content', None) is not None:
            rule.content = _tokens(rule.content)
        result.append(tinycss2.serialize([rule]))
    return ''.join(result)


def _critical_identifiers(document):
    roots = document.xpath(
        '/html/body/header|//*[@id="inicio"]|//*[@id="curso"]|'
        '//*[@id="united-mobile-menu"]'
    )
    if not document.xpath('//*[@id="inicio" and contains(concat(" ",normalize-space(@class)," ")," united-preview-hero ")]'):
        raise ValueError('Expected Home hero missing; review critical CSS scope.')
    if not document.xpath('//*[@id="curso"]'):
        raise ValueError('Expected first Home section missing; review critical CSS scope.')
    classes, ids = set(RUNTIME_CLASSES), set()
    for root in roots:
        for element in root.iter():
            classes.update(element.get('class', '').split())
            if element.get('id'):
                ids.add(element.get('id'))
    return classes, ids


def _may_match(tokens, classes, ids):
    """Exclude only selectors with an impossible outer class/ID requirement.

    Comma-separated alternatives are independent. Function and attribute
    contents are deliberately not used to exclude rules: :not(), :is(), :has(),
    focus, hover and other runtime states must remain possible before JS runs.
    A mixed selector list is retained in full, in its original order.
    """
    alternatives = [[]]
    for token in tokens:
        if token.type == 'literal' and token.value == ',':
            alternatives.append([])
        else:
            alternatives[-1].append(token)
    for alternative in alternatives:
        required_classes, required_ids = set(), set()
        for index, token in enumerate(alternative):
            if token.type == 'hash' and token.is_identifier:
                required_ids.add(token.value)
            if (token.type == 'literal' and token.value == '.' and
                    index + 1 < len(alternative) and alternative[index + 1].type == 'ident'):
                required_classes.add(alternative[index + 1].value)
        if required_classes <= classes and required_ids <= ids:
            return True
    return False


def extract_critical_css(css, document):
    classes, ids = _critical_identifiers(document)

    def select(rules, source=None):
        result = []
        for rule in rules:
            if rule.type == 'comment':
                value = rule.value.strip()
                if value.startswith('/') and value.endswith('.css'):
                    source = value
                continue
            if rule.type == 'qualified-rule':
                if source in COMPLETE_SOURCES or _may_match(rule.prelude, classes, ids):
                    result.append(tinycss2.serialize([rule]))
            elif rule.type == 'at-rule':
                if rule.lower_at_keyword in ('media', 'supports', 'container'):
                    nested = tinycss2.parse_rule_list(rule.content, skip_whitespace=True, skip_comments=False)
                    if any(item.type == 'error' for item in nested):
                        raise ValueError('Nested CSS parse error in critical stylesheet.')
                    content = select(nested, source)
                    if content:
                        result.append('@' + rule.at_keyword + tinycss2.serialize(rule.prelude) + '{' + content + '}')
                else:
                    # Font faces, keyframes, layer ordering and unknown at-rules
                    # are preserved; guessing their runtime use is unsafe.
                    result.append(tinycss2.serialize([rule]))
        return ''.join(result)

    critical = compact_css(select(_rules(css)))
    return critical, {
        'strategy': 'inline-critical-plus-complete-async-stylesheet',
        'critical_bytes': len(critical.encode()),
        'critical_gzip9_bytes': len(gzip.compress(critical.encode(), compresslevel=9)),
        'complete_runtime_sources': sorted(COMPLETE_SOURCES),
        'scope': ['header', 'all-hero-states', 'mobile-menu', 'first-content-section', 'contact-and-rd'],
    }


def attach_home_styles(head, critical, bundle_href):
    """Idempotently attach early styles and a full, non-JS fallback.

    The complete stylesheet follows the critical subset so the final cascade is
    exactly the original cascade, even after resize, rotation or modal opening.
    media=print downloads without blocking screen rendering. It starts during
    HTML parsing, not on a later timer or interaction.
    """
    for element in head.xpath('./style[@id="' + CRITICAL_STYLE_ID + '"]|./noscript[@' + FALLBACK_ATTRIBUTE + ']'):
        head.remove(element)
    style = etree.SubElement(head, 'style', id=CRITICAL_STYLE_ID)
    style.text = critical
    etree.SubElement(head, 'link', rel='stylesheet', href=bundle_href, media='print',
                     onload="this.onload=null;this.media='all'", **{'data-united-css': 'complete'})
    fallback = etree.SubElement(head, 'noscript', **{FALLBACK_ATTRIBUTE: ''})
    etree.SubElement(fallback, 'link', rel='stylesheet', href=bundle_href)
