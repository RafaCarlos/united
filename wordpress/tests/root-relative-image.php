<?php
/** Standalone regression test: no WordPress bootstrap, database changes or HTTP calls. */
define('ABSPATH', __DIR__ . '/');
function get_post($post) { return $post; }
function post_password_required($post) { return false; }
function has_post_thumbnail($post) { return false; }
function home_url($path = '') { return $GLOBALS['test_home'] . $path; }
function wp_parse_url($url) { return parse_url($url); }
function wp_http_validate_url($url) { return filter_var($url, FILTER_VALIDATE_URL); }
function attachment_url_to_postid($url) { return 0; }
function esc_url($url) { return htmlspecialchars($url, ENT_QUOTES, 'UTF-8'); }
function esc_attr($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }

$plugin = defined('UB26_TEST_PLUGIN') ? UB26_TEST_PLUGIN : dirname(__DIR__) . '/united-blog';
require $plugin . '/templates/helpers.php';

$cases = array(
    array('https://unitedidiomas.com/blog', '/blog/wp-content/uploads/capa.webp', 'https://unitedidiomas.com/blog/wp-content/uploads/capa.webp'),
    array('https://unitedidiomas.com/blog', '/blog/wp-content/uploads/capa.webp?v=2&amp;size=large#foto', 'https://unitedidiomas.com/blog/wp-content/uploads/capa.webp?v=2&size=large#foto'),
    array('https://example.test:8443/blog', '/media/capa.webp?width=800', 'https://example.test:8443/media/capa.webp?width=800'),
    array('http://example.test/blog', '/blog/wp-content/capa.webp', 'http://example.test/blog/wp-content/capa.webp'),
    array('https://unitedidiomas.com/blog', 'https://cdn.example.test/capa.webp?v=3', 'https://cdn.example.test/capa.webp?v=3'),
);
foreach ($cases as $index => $case) {
    $GLOBALS['test_home'] = $case[0];
    $post = (object) array('post_content' => '<p><img src="' . $case[1] . '" alt="Capa do artigo"></p>');
    $html = ub26_image($post);
    preg_match('/\bsrc="([^"]+)"/', $html, $match);
    $actual = isset($match[1]) ? html_entity_decode($match[1], ENT_QUOTES, 'UTF-8') : '';
    if ($actual !== $case[2]) {
        throw new RuntimeException('Image URL case ' . ($index + 1) . ': ' . $actual);
    }
}
echo "PASS: 5 image URL cases, preserving origin, port, path, query and fragment.\n";
