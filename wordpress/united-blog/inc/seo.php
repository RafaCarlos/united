<?php
if (!defined('ABSPATH')) { exit; }
function ub26_has_seo_plugin() {
    return defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION')
        || defined('SEOPRESS_VERSION') || defined('THE_SEO_FRAMEWORK_VERSION')
        || class_exists('The_SEO_Framework\\Load');
}
add_filter('document_title_parts', function ($parts) {
    if (ub26_active() && !ub26_has_seo_plugin() && (is_home() || is_front_page())) {
        $parts['title'] = 'Blog United | Inglês, carreira, viagens e tecnologia';
        unset($parts['tagline'], $parts['site']);
    }
    return $parts;
});
add_action('wp_head', function () {
    if (!ub26_active() || ub26_has_seo_plugin()) { return; }
    $single = is_singular('post');
    $post = $single ? get_queried_object() : null;
    if ($post && post_password_required($post)) { return; }
    $title = wp_get_document_title();
    $description = $single ? ub26_excerpt($post) : ub26_listing()['description'];
    $url = $single ? get_permalink($post) : get_pagenum_link(max(1, (int) get_query_var('paged'), (int) get_query_var('page')), false);
    $query = array(); parse_str((string) wp_parse_url($url, PHP_URL_QUERY), $query);
    $tracking = array_filter(array_keys($query), function ($key) {
        return strpos($key, 'utm_') === 0 || in_array($key, array('united_blog_preview', 'gclid', 'fbclid', 'msclkid', 'dclid', '_wpnonce'), true);
    });
    $url = remove_query_arg($tracking, $url);
    $image = $single && has_post_thumbnail($post) ? get_the_post_thumbnail_url($post, 'full') : ub26_asset('images/logo-united.webp');
    // WordPress core owns singular canonical; SEO plugins own all tags when installed.
    if (!is_singular() && !is_search()) { echo '<link rel="canonical" href="' . esc_url($url) . '">' . "\n"; }
    echo '<meta name="description" content="' . esc_attr($description) . '">' . "\n";
    $meta = array('og:title' => $title, 'og:description' => $description, 'og:type' => $single ? 'article' : 'website',
        'og:url' => $url, 'og:image' => $image, 'og:site_name' => 'United Idiomas', 'og:locale' => str_replace('-', '_', get_bloginfo('language')));
    foreach ($meta as $key => $value) { echo '<meta property="' . esc_attr($key) . '" content="' . esc_attr($value) . '">' . "\n"; }
    echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
    if ($single) {
        $author = get_the_author_meta('display_name', $post->post_author);
        $schema = array('@context' => 'https://schema.org', '@type' => 'BlogPosting', 'headline' => get_the_title($post),
            'description' => $description, 'mainEntityOfPage' => $url, 'image' => $image,
            'datePublished' => get_post_time(DATE_W3C, false, $post), 'dateModified' => get_post_modified_time(DATE_W3C, false, $post),
            'author' => array('@type' => in_array($author, array('United Idiomas', 'United'), true) ? 'Organization' : 'Person', 'name' => $author),
            'publisher' => array('@type' => 'Organization', 'name' => 'United Idiomas', 'url' => ub26_site_url()),
            'inLanguage' => get_bloginfo('language'));
        echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . '</script>' . "\n";
    }
}, 5);
