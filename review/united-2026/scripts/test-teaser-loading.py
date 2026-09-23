"""Build-time teaser contracts; no rebuild, network requests or dist mutations."""
import ast
from pathlib import Path
import unittest
from lxml import etree, html

ROOT = Path(__file__).resolve().parents[1]
# The build script runs its pipeline at module scope. Load only this pure DOM
# transform to exercise its real implementation without rebuilding the site.
tree = ast.parse((ROOT / 'scripts/optimize-static-assets.py').read_text())
transform = next(node for node in tree.body if isinstance(node, ast.FunctionDef)
                 and node.name == 'optimize_teaser_images')
EMPTY = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='


class TeaserLoadingContracts(unittest.TestCase):
    def setUp(self):
        self.version = 'new'
        self.calls = []

        def responsive(value, route='/'):
            self.calls.append((value, route))
            for name in ('institucional', 'liveclass', 'jimmy'):
                if name in value:
                    return {'default_path': f'assets/banners/{name}-{self.version}.webp'}
            return None

        namespace = {'etree': etree, 'responsive': responsive, 'EMPTY': EMPTY}
        exec(compile(ast.Module(body=[transform], type_ignores=[]),
                     'optimize-static-assets.py', 'exec'), namespace)
        self.optimize = namespace['optimize_teaser_images']
        # Real approved crops, independent of whether dist has been rebuilt.
        self.doc = html.fromstring('''<html><body>
          <svg class="teaser-visual" viewBox="435 405 460 825" preserveAspectRatio="xMidYMid slice">
            <defs><linearGradient id="fade0"><stop offset="0" stop-color="#081d35"/></linearGradient></defs>
            <image href="assets/banners/institucional-old.webp" width="1122" height="1402"/>
            <rect x="435" y="405" width="460" height="825" fill="url(#fade0)"/>
          </svg>
          <svg class="teaser-visual" viewBox="330 408 515 825" preserveAspectRatio="xMidYMid slice">
            <image href="assets/banners/liveclass-old.webp" width="1122" height="1402"/>
          </svg>
          <svg class="teaser-visual" viewBox="300 445 630 800" preserveAspectRatio="xMidYMid slice">
            <image href="assets/banners/jimmy-old.webp" width="1122" height="1402"/>
          </svg>
          <svg class="other-art"><image href="assets/banners/jimmy-old.webp" width="1122" height="1402"/></svg>
        </body></html>''')

    def test_mobile_fallback_has_no_remote_candidate_and_desktop_needs_no_script(self):
        self.optimize(self.doc)
        pictures = self.doc.xpath('//picture[@data-teaser-picture]')
        self.assertEqual(len(pictures), 3)
        self.assertEqual(len(self.doc.xpath('//script')), 0)
        for picture in pictures:
            sources = picture.findall('source')
            self.assertEqual(len(sources), 1)
            self.assertEqual(sources[0].get('media'), '(min-width:769px)')
            self.assertEqual(sources[0].get('type'), 'image/webp')
            self.assertTrue(sources[0].get('srcset').endswith('-new.webp'))
            image = picture.find('img')
            self.assertEqual(image.get('src'), EMPTY)
            self.assertIsNone(image.get('srcset'))
            self.assertEqual(image.get('alt'), '')
            self.assertEqual(image.get('fetchpriority'), 'low')

    def test_crop_gradient_order_and_full_art_coordinates_are_unchanged(self):
        svg = self.doc.xpath('//svg')[0]
        attrs = dict(svg.attrib)
        gradient = etree.tostring(svg.find('defs'))
        overlay = etree.tostring(svg.find('rect'))
        self.optimize(self.doc)
        self.assertEqual(dict(svg.attrib), attrs)
        self.assertEqual(etree.tostring(svg.find('defs')), gradient)
        self.assertEqual(etree.tostring(svg.find('rect')), overlay)
        self.assertEqual([child.tag for child in svg], ['defs', 'foreignObject', 'rect'])
        frame = svg.find('foreignObject')
        self.assertEqual((frame.get('width'), frame.get('height')), ('1122', '1402'))
        picture = frame.find('picture')
        self.assertEqual(picture.get('xmlns'), 'http://www.w3.org/1999/xhtml')
        self.assertIn('width:100%;height:100%', picture.find('img').get('style'))
        self.assertEqual(len(self.doc.xpath('//svg[@class="other-art"]/image')), 1)

    def test_serialized_rebuild_updates_hashes_without_duplicate_elements(self):
        self.optimize(self.doc)
        reparsed = html.fromstring(html.tostring(self.doc))
        self.version = 'newer'
        self.optimize(reparsed, '/nested/')
        self.assertEqual(len(reparsed.xpath('//picture[@data-teaser-picture]')), 3)
        self.assertEqual(len(reparsed.xpath('//foreignobject')), 3)
        self.assertTrue(all(source.get('srcset').endswith('-newer.webp')
                            for source in reparsed.xpath('//picture/source')))
        self.assertTrue(any(route == '/nested/' for _, route in self.calls))
        once = html.tostring(reparsed)
        self.optimize(reparsed, '/nested/')
        self.assertEqual(html.tostring(reparsed), once)

    def test_unreviewed_geometry_fails_instead_of_stretching_the_art(self):
        self.doc.xpath('//image')[0].set('width', '600')
        with self.assertRaisesRegex(ValueError, 'teaser geometry'):
            self.optimize(self.doc)


if __name__ == '__main__':
    unittest.main()
