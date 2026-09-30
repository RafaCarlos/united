"""Validate critical CSS safety, responsive states and rebuild behavior."""
from pathlib import Path
import importlib.util
import unittest
from lxml import html
import tinycss2

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('home_critical_css', ROOT / 'scripts/home-critical-css.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def document():
    return html.fromstring('''<html><head></head><body><header class="united-header">
        <button class="open-menu">Menu</button></header>
        <div id="united-mobile-menu" class="united-mobile-menu"></div>
        <main><section id="inicio" class="united-preview-hero">
        <div class="preview-panel active"><img class="full-art"></div></section>
        <section id="curso" class="about-home"><h1>Inglês</h1></section>
        <section class="unrelated"><p>Unchanged below-fold content</p></section></main>
        </body></html>''')


def rule_structure(css):
    """Compare rule order/values while ignoring formatting between nested rules."""
    result = []
    for rule in tinycss2.parse_stylesheet(css, skip_comments=True, skip_whitespace=True):
        prelude = tinycss2.serialize(rule.prelude).strip()
        content = tinycss2.serialize(rule.content).strip() if rule.content is not None else None
        if rule.type == 'at-rule' and rule.lower_at_keyword in ('media', 'supports', 'container'):
            result.append((rule.lower_at_keyword, prelude, rule_structure(content)))
        else:
            result.append((rule.type, prelude, content))
    return result


class CriticalCSSContracts(unittest.TestCase):
    def critical(self, css):
        return module.extract_critical_css(css, document())[0]

    def delivered_home(self):
        doc = html.fromstring((ROOT / 'dist/index.html').read_bytes())
        styles = doc.xpath('/html/head/style[@id="united-home-critical"]')
        links = doc.xpath('/html/head/link[@rel="stylesheet"]')
        self.assertEqual(len(styles), 1, 'The delivered Home needs one inline critical stylesheet')
        self.assertEqual(len(links), 1, 'The delivered Home needs one complete stylesheet')
        self.assertTrue(styles[0].text and styles[0].text.strip())
        bundle = ROOT / 'dist' / links[0].get('href').lstrip('/')
        self.assertTrue(bundle.is_file(), 'The complete stylesheet must exist in the delivery')
        return doc, styles[0].text, bundle.read_text()

    def test_final_bundle_is_not_purged_and_order_is_preserved(self):
        css = '.unrelated { color: red } .united-header { color: blue } .unrelated { color: green }'
        compact = module.compact_css(css)
        rules = tinycss2.parse_stylesheet(compact, skip_whitespace=True, skip_comments=True)
        self.assertEqual([tinycss2.serialize(r.prelude).strip() for r in rules],
                         ['.unrelated', '.united-header', '.unrelated'])
        self.assertNotIn('.unrelated', self.critical(css))

    def test_responsive_and_dynamic_hero_menu_rules_remain(self):
        css = '''@media (min-width:769px){.preview-panel.active{width:60%}}
            @media (max-width:768px){.united-mobile-menu.open{display:flex}}
            @media (orientation:landscape){.preview-panel:not(.active){display:none}}
            @media (prefers-reduced-motion:reduce){.preview-panel{transition:none}}'''
        output = self.critical(css)
        for value in ['min-width:769px', 'max-width:768px', 'orientation:landscape',
                      'prefers-reduced-motion:reduce', '.open', ':not(.active)']:
            self.assertIn(value, output)

    def test_first_content_section_and_global_font_reset_are_critical(self):
        css = '@font-face{font-family:Manrope;src:url(/font.woff2)}:root{--blue:#012858}body{margin:0}.about-home{min-height:600px}'
        self.assertEqual(self.critical(css), css)

    def test_runtime_rd_contact_sources_remain_in_full(self):
        css = '''/* /rdstation-form.css */
            .rd-whatsapp-popup input[hidden]{display:none}
            @media(max-width:768px){.rd-form-runtime input{font-size:16px}}
            /* /contact-preview.css */
            .contact-preview-dialog[open]{display:flex}
            /* /footer-refinement.css */
            .unrelated-footer{padding:20px}'''
        output = self.critical(css)
        self.assertIn('.rd-whatsapp-popup', output)
        self.assertIn('font-size:16px', output)
        self.assertIn('.contact-preview-dialog[open]', output)
        self.assertNotIn('.unrelated-footer', output)

    def test_responsive_desktop_image_is_hidden_before_the_full_css_loads(self):
        # This real lazy image is outside the critical DOM roots. Without its
        # mobile display rule, Chrome requests the 148KB desktop decoration
        # before the asynchronous stylesheet has arrived.
        css = '/* /responsive-home.css */\n' + (ROOT / 'src/responsive-home.css').read_text()
        output = self.critical(css)
        matching = []
        for rule in tinycss2.parse_stylesheet(output, skip_comments=True, skip_whitespace=True):
            if rule.type != 'at-rule' or rule.lower_at_keyword != 'media':
                continue
            if tinycss2.serialize(rule.prelude).strip() != '(max-width:1024px)':
                continue
            for nested in tinycss2.parse_rule_list(rule.content, skip_comments=True, skip_whitespace=True):
                if nested.type == 'qualified-rule' and tinycss2.serialize(nested.prelude).strip() == '.plataforma .content .video-content>img':
                    matching.append(tinycss2.serialize(nested.content))
        self.assertEqual(matching, ['display:none'])
        # Preserve the same source's desktop/mobile rule order and overrides;
        # don't turn the condition into unconditional hiding.
        self.assertEqual(rule_structure(output), rule_structure(module.compact_css(css)))

    def test_mobile_contact_bar_geometry_is_critical_before_runtime_creation(self):
        css = '/* /contact-preview.css */\n' + (ROOT / 'src/contact-preview.css').read_text()
        output = self.critical(css)
        for selector in ['html[data-contact-presentation="bar"] .contact-actions',
                         'html[data-contact-presentation="bar"] .contact-launcher']:
            self.assertIn(selector, output)
        self.assertIn('padding:10px 16px max(12px,env(safe-area-inset-bottom))', output)
        self.assertEqual(rule_structure(output), rule_structure(module.compact_css(css)))

    def test_below_fold_absolute_artwork_does_not_enter_without_its_ancestors(self):
        css = '''/* /preview.css */
            .preview-panel.active{display:block}
            .art-shell{position:relative}
            #jimmy-united-idiomas .content figure img{position:absolute;top:-52%;left:-25%}
            .features:has(#jimmy-united-idiomas)::after{display:none}'''
        output = self.critical(css)
        self.assertIn('.preview-panel.active', output)
        self.assertNotIn('#jimmy-united-idiomas', output)
        self.assertNotIn('top:-52%', output)

    def test_selector_alternatives_and_functions_are_conservative(self):
        css = '''.unrelated,.united-header:hover{color:red}
            :is(.unrelated,.united-header):focus-visible{outline:2px solid}
            .united-header:has(.future-menu-state){display:flex}'''
        output = self.critical(css)
        self.assertIn('.unrelated,.united-header:hover', output)
        self.assertIn(':is(', output)
        self.assertIn(':has(.future-menu-state)', output)

    def test_fonts_animations_and_unknown_at_rules_are_kept(self):
        css = '@keyframes dynamic{from{opacity:0}to{opacity:1}}@layer widgets{.future-widget{color:red}}'
        self.assertEqual(self.critical(css), css)

    def test_compacting_preserves_descendants_math_strings_and_comments_boundary(self):
        css = '''/*! license */
            .a :hover { width: calc(100% - 24px); --pair: 1 2;
                content: "two   spaces"; background:url("a  b.png");
                height: var(--unknown, 20px); padding: 1/**/px }
            .a:hover { width: min(100%, 20px) }'''
        output = module.compact_css(css)
        for value in ['/*! license */', '.a :hover', '.a:hover', 'calc(100% - 24px)',
                      '--pair: 1 2', '"two   spaces"', '"a  b.png"', '1/**/px']:
            self.assertIn(value, output)
        self.assertEqual(module.compact_css(output), output)

    def test_head_critical_fallback_and_complete_css_share_the_same_bundle(self):
        doc = document()
        head = doc.find('head')
        module.attach_home_styles(head, 'body{margin:0}', '/assets/css/page-home-abc.css')
        self.assertEqual(head.xpath('./style/@id'), ['united-home-critical'])
        self.assertEqual(head.xpath('./link/@media'), ['print'])
        self.assertIn("this.media='all'", head.xpath('./link/@onload')[0])
        self.assertEqual(head.xpath('./link/@href'), head.xpath('./noscript/link/@href'))
        self.assertEqual(head[0].tag, 'style')
        # The caller replaces the single external link before every rebuild.
        for link in head.xpath('./link'):
            head.remove(link)
        module.attach_home_styles(head, 'body{margin:0}', '/assets/css/page-home-def.css')
        self.assertEqual(len(head.xpath('./style')), 1)
        self.assertEqual(len(head.xpath('./noscript')), 1)
        self.assertEqual(head.xpath('./link/@href'), ['/assets/css/page-home-def.css'])

    def test_missing_hero_or_first_section_fails_closed(self):
        with self.assertRaises(ValueError):
            module.extract_critical_css('body{margin:0}', html.fromstring('<html><body></body></html>'))

    def test_current_home_keeps_all_required_components_and_reduces_critical_bytes(self):
        # Inspect the actual delivery, not a fresh extraction from the compact
        # bundle: that bundle no longer has the source-boundary comments used
        # to preserve CSS for dynamically created contact and RD controls.
        _, output, full = self.delivered_home()
        for selector in ['.united-preview-hero', '.preview-panel', '.preview-tabs',
                         '.united-mobile-menu', '.button-area', '.about-home']:
            self.assertIn(selector, output)
        self.assertLess(len(output.encode()), len(full.encode()) * .60)
        self.assertFalse(any(rule.type == 'error' for rule in tinycss2.parse_stylesheet(output)))

    def test_delivered_inline_styles_keep_runtime_contact_and_safari_rules_in_order(self):
        _, critical, full = self.delivered_home()
        # These controls can open before the asynchronous CSS arrives. Compare
        # complete source rules (including media conditions and declarations),
        # rather than finding only a class name that could survive a bad purge.
        for filename in ('shared-header.css', 'contact-preview.css', 'rdstation-form.css',
                         'responsive-home.css'):
            expected = rule_structure(module.compact_css((ROOT / 'src' / filename).read_text()))
            self.assertTrue(expected)
            for label, css in (('inline', critical), ('complete', full)):
                with self.subTest(source=filename, delivery=label):
                    delivered = iter(rule_structure(css))
                    for rule in expected:
                        self.assertTrue(any(candidate == rule for candidate in delivered),
                                        f'Missing or reordered {filename} rule in {label}: {rule[:2]}')

    def test_delivered_noscript_fallback_loads_the_same_complete_screen_styles(self):
        doc, _, _ = self.delivered_home()
        head = doc.find('head')
        critical = head.xpath('./style[@id="united-home-critical"]')[0]
        complete = head.xpath('./link[@rel="stylesheet"]')[0]
        fallbacks = head.xpath('./noscript[@data-united-home-css]/link[@rel="stylesheet"]')
        self.assertEqual(len(fallbacks), 1)
        fallback = fallbacks[0]
        self.assertEqual(fallback.get('href'), complete.get('href'))
        self.assertIn(fallback.get('media'), (None, 'all', 'screen'),
                      'JavaScript-disabled visitors must receive screen styles')
        self.assertNotIn('disabled', fallback.attrib)
        self.assertEqual(complete.get('media'), 'print')
        self.assertEqual(complete.get('onload'), "this.onload=null;this.media='all'")
        self.assertNotIn('disabled', complete.attrib)
        self.assertLess(head.index(critical), head.index(complete))
        self.assertLess(head.index(complete), head.index(fallback.getparent()))


if __name__ == '__main__':
    unittest.main()
