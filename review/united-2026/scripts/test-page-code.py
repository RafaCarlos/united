"""Guard CSS behavior and boundaries; requires tinycss2 and lxml."""
from pathlib import Path
import importlib.util
import unittest
from lxml import html
import tinycss2

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('page_code', ROOT / 'scripts/optimize-page-code.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class AnimationContracts(unittest.TestCase):
    def setUp(self):
        self.css = (ROOT / 'dist/assets/css/style.css').read_text()

    def test_pages_keep_every_declared_animation_class(self):
        for route in ('', 'cursos/', 'quem-somos/', 'faq/'):
            with self.subTest(route=route):
                doc = html.fromstring((ROOT / 'dist' / route / 'index.html').read_bytes())
                classes = {value for item in doc.xpath('//*[@class]') for value in item.get('class').split()}
                output, report = module.optimize_animations(self.css, classes)
                for name in classes:
                    if '.' + name + '{' in self.css:
                        self.assertIn('.' + name + '{', output)
                self.assertIn('.animated{', output)
                self.assertIn('prefers-reduced-motion', output)
                self.assertGreater(report['bytes_before'] - report['bytes_after'], 50000)
                self.assertFalse(any(rule.type == 'error' for rule in tinycss2.parse_stylesheet(output)))

    def test_vendor_widget_and_general_rules_remain(self):
        extra = '\n#rd-form .select2-container.is-invalid{color:red} .contact-preview-open dialog{display:block}'
        output, _ = module.optimize_animations(self.css + extra, set())
        self.assertTrue(output.endswith(extra))
        self.assertIn('.slick-slider{', output)

    def test_external_animation_reference_preserves_prefixed_frames(self):
        extra = '\n.dynamic-widget{animation:bounceOut 2s}'
        output, _ = module.optimize_animations(self.css + extra, set())
        self.assertIn('@keyframes bounceOut{', output)
        self.assertIn('@-webkit-keyframes bounceOut{', output)

    def test_css_without_reviewed_collection_is_untouched(self):
        css = '.rd-container:hover { color: red }'
        self.assertEqual(module.optimize_animations(css, set())[0], css)

    def test_changed_slick_dependency_fails_closed(self):
        original = (ROOT / 'dist/assets/js/dist/scripts.js').read_text()
        with self.assertRaises(ValueError):
            module.core_source(original.replace('Version: 1.8.0', 'Version: 2.0.0'))


if __name__ == '__main__':
    unittest.main()
