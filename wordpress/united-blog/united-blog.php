<?php
/**
 * Plugin Name: United Blog
 * Description: Layout editorial United integrado aos posts, categorias e mídia do WordPress.
 * Version: 1.0.3
 * Requires at least: 6.2
 * Requires PHP: 7.4
 * Author: United Idiomas
 * License: GPL-2.0-or-later
 * Text Domain: united-blog
 */
if (!defined('ABSPATH')) { exit; }
define('UB26_VERSION', '1.0.3');
define('UB26_DIR', plugin_dir_path(__FILE__));
define('UB26_URL', plugin_dir_url(__FILE__));

function ub26_settings() {
    return wp_parse_args((array) get_option('ub26_settings', array()), array(
        'enabled' => false, 'site_url' => 'https://www.unitedidiomas.com',
        'contact' => true, 'tracking' => false,
    ));
}
function ub26_asset($path) { return UB26_URL . 'assets/' . ltrim($path, '/'); }
function ub26_frontend_asset($path) {
    if (!(defined('SCRIPT_DEBUG') && SCRIPT_DEBUG)) {
        $minified = preg_replace('/\.(css|js)$/', '.min.$1', $path);
        if ($minified !== $path && file_exists(UB26_DIR . 'assets/' . $minified)) {
            $path = $minified;
        }
    }
    return ub26_asset($path);
}
function ub26_site_url($path = '') { return untrailingslashit(ub26_settings()['site_url']) . '/' . ltrim($path, '/'); }
function ub26_blog_url() {
    $id = (int) get_option('page_for_posts');
    $url = $id ? get_permalink($id) : home_url('/');
    return ub26_is_preview() && !is_admin() ? add_query_arg('united_blog_preview', '1', $url) : $url;
}
function ub26_is_preview() {
    return !empty($_GET['united_blog_preview']) && current_user_can('manage_options');
}
function ub26_is_route() {
    if (is_admin() || wp_doing_ajax() || is_feed() || is_embed() || is_trackback()
        || (defined('REST_REQUEST') && REST_REQUEST) || (defined('XMLRPC_REQUEST') && XMLRPC_REQUEST)
        || isset($_GET['et_fb']) || isset($_GET['et_bfb'])) { return false; }
    $blog_install = (bool) preg_match('~/blog/?$~', (string) wp_parse_url(home_url('/'), PHP_URL_PATH));
    return is_home() || ($blog_install && is_front_page()) || is_singular('post')
        || is_category() || is_tag() || is_author() || is_date()
        || (is_search() && (!get_query_var('post_type') || get_query_var('post_type') === 'post'));
}
function ub26_active() { return ub26_is_route() && (ub26_settings()['enabled'] || ub26_is_preview()); }

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_image_size('united-blog-card', 768, 496, true);
    add_image_size('united-blog-cover', 1440, 900, false);
}, 20);

add_filter('template_include', function ($template) {
    return ub26_active() ? UB26_DIR . 'templates/layout.php' : $template;
}, 99);
add_action('template_redirect', function () {
    if (ub26_active() && ub26_is_preview()) {
        if (!defined('DONOTCACHEPAGE')) { define('DONOTCACHEPAGE', true); }
        nocache_headers();
        header('X-Robots-Tag: noindex, nofollow', true);
    }
});
add_filter('wp_robots', function ($robots) {
    if (ub26_active() && ub26_is_preview()) {
        unset($robots['index'], $robots['follow']);
        $robots['noindex'] = true; $robots['nofollow'] = true;
    }
    return $robots;
});
add_action('pre_get_posts', function ($query) {
    if (is_admin() || wp_doing_ajax() || !$query->is_main_query() || $query->is_feed() || $query->is_embed()
        || (defined('REST_REQUEST') && REST_REQUEST) || (defined('XMLRPC_REQUEST') && XMLRPC_REQUEST)
        || isset($_GET['et_fb']) || isset($_GET['et_bfb'])
        || !(ub26_settings()['enabled'] || ub26_is_preview())) { return; }
    if ($query->is_home() || $query->is_category() || $query->is_tag() || $query->is_author() || $query->is_date() || $query->is_search()) {
        if ($query->is_search() && $query->get('post_type') && $query->get('post_type') !== 'post') { return; }
        $query->set('post_type', 'post');
        $query->set('posts_per_page', 10);
        $query->set('ignore_sticky_posts', true);
        $query->set('has_password', false);
    }
});
add_action('wp_enqueue_scripts', function () {
    if (!ub26_active()) { return; }
    // Preserve theme/plugin assets used by existing Divi content, forms and consent.
    foreach (array('blog', 'footer', 'site-navigation', 'contact-form', 'wordpress') as $name) {
        if ($name === 'contact-form' && !ub26_settings()['contact']) { continue; }
        $file = 'css/' . $name . '.css';
        wp_enqueue_style('united-blog-' . $name, ub26_frontend_asset($file), array(), UB26_VERSION);
    }
    foreach (array('site-navigation', 'wordpress') as $name) {
        wp_enqueue_script('united-blog-' . $name, ub26_frontend_asset('js/' . $name . '.js'), array(), UB26_VERSION, true);
    }
    if (ub26_settings()['contact']) {
        wp_enqueue_script('united-blog-contact', ub26_frontend_asset('js/contact-form.js'), array(), UB26_VERSION, true);
    }
    // Reuse an RD WhatsApp widget already loaded by WordPress without adding account tracking.
    wp_enqueue_script('united-blog-whatsapp', ub26_frontend_asset('js/rdstation-whatsapp.js'), array(), UB26_VERSION, true);
    if (ub26_settings()['tracking']) {
        wp_enqueue_script('united-blog-account', ub26_frontend_asset('js/rdstation-account.js'), array(), UB26_VERSION, true);
    }
}, 100);
add_filter('script_loader_tag', function ($tag, $handle) {
    if (strpos($handle, 'united-blog-') === 0 && strpos($tag, ' defer') === false) {
        return str_replace('<script ', '<script defer ', $tag);
    }
    return $tag;
}, 10, 2);

require_once UB26_DIR . 'inc/content.php';
require_once UB26_DIR . 'inc/seo.php';
require_once UB26_DIR . 'inc/admin.php';
require_once UB26_DIR . 'inc/importer.php';
require_once UB26_DIR . 'templates/helpers.php';
