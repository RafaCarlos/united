"""Conservative page code helpers; never modifies HTML or the legacy input bundle.

Build dependency: tinycss2==1.4.0 for CSS parsing; esbuild==0.25.12 for JS.
Example: PYTHONPATH=/path/to/python-deps python scripts/optimize-page-code.py
    --esbuild /path/to/node_modules/.bin/esbuild

Pipeline API: optimize_animations(css_text, used_classes) -> (css_text, report).
Pass the full class set of the route. Only the delimited Animate.css collection
is reduced. General selectors, runtime widget CSS and all common helpers remain.
"""
from pathlib import Path
from hashlib import sha256
import argparse
import gzip
import json
import os
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CORE_ROUTES = ('/', '/cursos/', '/faq/')
SLICK_MARKER = '/*\n     _ _'
SLICK_END = '/*! WOW - v1.1.3'
SLICK_SHA256 = 'f663d724dedd27990e72cdfdef3093a60b4f10716561a2f74c63368d90f892a3'
CAROUSELS = ('carousel-steps', 'carousel-mb', 'carousel-methodology', 'carousel-vitrine', 'masonry')


def core_source(legacy):
    """Remove the reviewed vendor block and guard the five existing call sites.

    Fail closed if the upstream bundle changes: a maintainer must audit a new
    Slick version or changed initialization before authorizing this transform.
    jQuery, mask, WOW, RD globals and all other code remain in place.
    """
    start = legacy.index(SLICK_MARKER)
    end = legacy.index(SLICK_END, start)
    slick = legacy[start:end]
    if sha256(slick.encode()).hexdigest() != SLICK_SHA256:
        raise ValueError('Slick vendor block changed; review dependencies before generating the core bundle.')
    result = legacy[:start] + legacy[end:]
    for name in CAROUSELS:
        call = "$('." + name + "').slick({"
        if result.count(call) != 1:
            raise ValueError('Unexpected carousel initialization: ' + name)
        result = result.replace(call, "structure.carousel('." + name + "', {")
    original = 'var structure = {\n    init: function() {'
    if result.count(original) != 1:
        raise ValueError('Unexpected structure entry point.')
    guarded = '''var structure = {
    carousel: function(selector, options) {
        var elements = $(selector);
        if (elements.length && typeof $.fn.slick === 'function') {
            elements.slick(options);
        }
    },
    init: function() {'''
    return result.replace(original, guarded)


def optimize_animations(css_text, used_classes):
    """Reduce only named animation rules inside the reviewed collection.

    Keeps unknown/complex selectors rather than inferring whether they are used.
    Keeps keyframes referenced anywhere in retained CSS, including declarations
    outside the animation collection and prefixed declarations/keyframes.
    """
    import tinycss2
    used_classes = set(used_classes)
    rules = tinycss2.parse_stylesheet(css_text, skip_whitespace=False, skip_comments=False)
    if any(rule.type == 'error' for rule in rules):
        raise ValueError('CSS parse error; refusing to reduce animations.')
    starts = [i for i, rule in enumerate(rules) if rule.type == 'comment' and 'animate.css - https://animate.style/' in rule.value]
    if not starts:
        return css_text, {'removed_animation_classes': [], 'removed_keyframes': [], 'bytes_before': len(css_text.encode()), 'bytes_after': len(css_text.encode())}
    if len(starts) != 1:
        raise ValueError('Ambiguous Animate.css boundary.')
    start = starts[0]
    end = next((i for i in range(start + 1, len(rules)) if rules[i].type == 'qualified-rule' and tinycss2.serialize(rules[i].prelude).strip() == 'body'), None)
    if end is None:
        raise ValueError('Missing reviewed Animate.css end boundary.')

    def frame_name(rule):
        if rule.type != 'at-rule' or rule.lower_at_keyword not in ('keyframes', '-webkit-keyframes'):
            return None
        tokens = [token for token in rule.prelude if token.type not in ('whitespace', 'comment')]
        if len(tokens) != 1 or tokens[0].type not in ('ident', 'string'):
            raise ValueError('Unexpected keyframe name.')
        return tokens[0].value

    names = {frame_name(rule) for rule in rules[start:end]} - {None}
    removed_classes = set()
    kept = []
    for index, rule in enumerate(rules):
        if start <= index < end and rule.type == 'qualified-rule':
            selector = tinycss2.serialize(rule.prelude).strip()
            match = re.fullmatch(r'\.([A-Za-z_][A-Za-z0-9_-]*)', selector)
            if match and match[1] in names and match[1] not in used_classes:
                removed_classes.add(match[1])
                continue
        kept.append((index, rule))

    def identifiers(tokens):
        for token in tokens:
            if token.type in ('ident', 'string'):
                yield token.value
            for attr in ('content', 'arguments'):
                nested = getattr(token, attr, None)
                if nested is not None:
                    yield from identifiers(nested)

    referenced = set()
    for _, rule in kept:
        # Keyframes do not count as uses of themselves. Inspect all other rule
        # contents, including media queries, variables and runtime states.
        if frame_name(rule) is None and getattr(rule, 'content', None) is not None:
            referenced.update(set(identifiers(rule.content)) & names)
    removed_frames = set()
    output = []
    for index, rule in kept:
        name = frame_name(rule)
        if start <= index < end and name is not None and name not in referenced:
            removed_frames.add(name)
            continue
        output.append(rule)
    optimized = tinycss2.serialize(output)
    return optimized, {
        'removed_animation_classes': sorted(removed_classes),
        'removed_keyframes': sorted(removed_frames),
        'bytes_before': len(css_text.encode()),
        'bytes_after': len(optimized.encode()),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--esbuild', default=os.environ.get('UNITED_ESBUILD') or shutil.which('esbuild'))
    args = parser.parse_args()
    if not args.esbuild:
        parser.error('Pass --esbuild pointing to esbuild 0.25.12.')
    version = subprocess.check_output([args.esbuild, '--version'], text=True).strip()
    if version != '0.25.12':
        parser.error('This build was validated with esbuild 0.25.12; found ' + version)
    source = ROOT / 'dist/assets/js/dist/scripts.js'
    legacy = source.read_text()
    core = core_source(legacy)
    result = subprocess.run([args.esbuild, '--minify', '--legal-comments=inline', '--target=es2017', '--loader=js'], input=core, capture_output=True, text=True, check=True)
    output = ROOT / 'dist/assets/js/dist/scripts-core.js'
    output.write_text('/*! United core: jQuery 3.1.1, jQuery Mask 1.13.8 and WOW 1.1.3 retained; legacy Slick loads on Quem Somos. */\n' + result.stdout)
    report = {
        'source': str(source.relative_to(ROOT)), 'output': str(output.relative_to(ROOT)),
        'source_sha256': sha256(source.read_bytes()).hexdigest(), 'output_sha256': sha256(output.read_bytes()).hexdigest(),
        'bytes_before': source.stat().st_size, 'bytes_after': output.stat().st_size,
        'gzip9_before': len(gzip.compress(source.read_bytes(), compresslevel=9)),
        'gzip9_after': len(gzip.compress(output.read_bytes(), compresslevel=9)),
        'core_routes': CORE_ROUTES, 'required_omission': 'responsive-home.js on core routes',
        'preserved_full_bundle_route': '/quem-somos/', 'esbuild': version,
    }
    (ROOT / 'seo/page-code-optimization.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
