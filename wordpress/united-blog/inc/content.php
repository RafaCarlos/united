<?php
if (!defined('ABSPATH')) { exit; }

function ub26_reading($post) {
    $text = wp_strip_all_tags(strip_shortcodes(get_post_field('post_content', $post)));
    return max(1, (int) ceil(count(preg_split('/\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY)) / 200));
}
function ub26_excerpt($post) {
    $post = get_post($post);
    if (!$post || post_password_required($post)) { return ''; }
    $text = $post->post_excerpt ?: strip_shortcodes($post->post_content);
    return wp_trim_words(wp_strip_all_tags($text), 30, '…');
}
function ub26_topic($post) {
    $terms = get_the_category(get_post($post)->ID);
    return $terms ? $terms[0]->name : 'Blog United';
}
function ub26_has_cover($post) {
    $post = get_post($post);
    return $post && !post_password_required($post) && has_post_thumbnail($post)
        && empty($GLOBALS['ub26_cover_in_body'][$post->ID]);
}
function ub26_listing() {
    global $wp_query;
    $paged = max(1, (int) get_query_var('paged'), (int) get_query_var('page'));
    $query = $wp_query;
    if (is_front_page() && !is_home()) {
        $query = new WP_Query(array('post_type' => 'post', 'post_status' => 'publish',
            'has_password' => false, 'posts_per_page' => 10, 'paged' => $paged, 'ignore_sticky_posts' => true));
    }
    $title = 'Ideias que conectam você ao mundo.';
    $description = 'Inglês, carreira, viagens e tecnologia. Conteúdos para aprender, explorar e dar o próximo passo.';
    if (is_search()) {
        $title = 'Resultados da busca';
        $description = 'Artigos encontrados para “' . get_search_query(false) . '”.';
    } elseif (is_category() || is_tag() || is_author() || is_date()) {
        $title = wp_strip_all_tags(get_the_archive_title());
        $description = wp_strip_all_tags(get_the_archive_description());
    }
    $featured = ($paged === 1 && (is_home() || is_front_page()) && !is_search() && !empty($query->posts)) ? $query->posts[0] : null;
    return compact('query', 'featured', 'paged', 'title', 'description');
}
function ub26_toc() { return isset($GLOBALS['ub26_toc']) ? $GLOBALS['ub26_toc'] : array(); }
function ub26_content($post) {
    $post = get_post($post);
    $GLOBALS['ub26_toc'] = array();
    if (!$post) { return ''; }
    if (post_password_required($post)) { return get_the_password_form($post); }
    // Use the same WordPress filters as the_content(), including Divi/blocks/shortcodes.
    $content = apply_filters('the_content', get_the_content(null, false, $post));
    // Match the approved reader: the template owns H1; legacy body headings remain visible as H2.
    $content = preg_replace('~<(\/?)(h1)(\b[^>]*)>~i', '<$1h2$3>', $content);
    $cover_id = (int) get_post_thumbnail_id($post);
    if ($cover_id) {
        // Only a leading standalone image with this exact WP attachment ID is redundant.
        // Keep figures/captions, links, arbitrary images and all body text intact.
        $content = preg_replace('~\A(?:\s*<p(?:\s[^>]*)?>(?:\s|&nbsp;|&#160;|<br\s*/?>)*</p>)+~i', '', $content);
        $content = preg_replace_callback('~\A\s*<p(?:\s[^>]*)?>\s*(<img\b[^>]*>)\s*</p>~i', function ($match) use ($cover_id) {
            return preg_match('~\bwp-image-' . $cover_id . '(?:\s|[\x22\x27])~', $match[1]) ? '' : $match[0];
        }, $content, 1);
        // Keep Divi wrappers and captions intact; if the cover remains inside the
        // authored content, omit the additional template cover instead of duplicating it.
        $GLOBALS['ub26_cover_in_body'][$post->ID] = (bool) preg_match('~<img\b[^>]*\bwp-image-' . $cover_id . '(?:\s|[\x22\x27])~i', $content);
    }
    $used = array();
    preg_match_all('~\bid=[\x22\x27]([^\x22\x27]+)[\x22\x27]~i', $content, $existing);
    foreach ($existing[1] as $id) { $used[$id] = true; }
    $content = preg_replace_callback('~<h([23])\b([^>]*)>(.*?)</h\1>~is', function ($match) use (&$used) {
        $text = trim(html_entity_decode(wp_strip_all_tags($match[3]), ENT_QUOTES, 'UTF-8'));
        if ($text === '') { return $match[0]; }
        $attrs = $match[2];
        if (preg_match('~\bid=[\x22\x27]([^\x22\x27]+)[\x22\x27]~i', $attrs, $ids)) {
            $id = $ids[1];
        } else {
            $base = sanitize_title($text) ?: 'secao';
            $id = $base; $suffix = 2;
            while (isset($used[$id])) { $id = $base . '-' . $suffix++; }
            $used[$id] = true;
            $attrs .= ' id="' . esc_attr($id) . '"';
        }
        $GLOBALS['ub26_toc'][] = array('id' => $id, 'text' => $text);
        return '<h' . $match[1] . $attrs . '>' . $match[3] . '</h' . $match[1] . '>';
    }, $content);
    return str_replace(']]>', ']]&gt;', $content);
}
