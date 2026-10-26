<?php
if (!defined('ABSPATH')) { exit; }

/** Preserve private/protected content and use WordPress responsive media first. */
function ub26_image($post, $size = 'large', $priority = false, $sizes = '') {
    $post = get_post($post);
    if (!$post || post_password_required($post)) { return ''; }
    $attributes = array('loading' => $priority ? 'eager' : 'lazy', 'decoding' => 'async',
        'sizes' => $sizes ?: ($priority ? '(max-width: 780px) calc(100vw - 40px), 760px' : '(max-width: 480px) calc(100vw - 40px), (max-width: 780px) 45vw, 370px'));
    if ($priority) { $attributes['fetchpriority'] = 'high'; }
    if (has_post_thumbnail($post)) {
        return wp_get_attachment_image(get_post_thumbnail_id($post), $size, false, $attributes);
    }
    // Never run shortcodes just to construct a card preview.
    if (preg_match('~<img\b[^>]*\bclass=[\x22\x27][^\x22\x27]*\bwp-image-(\d+)\b~i', $post->post_content, $match)) {
        $image = wp_get_attachment_image((int) $match[1], $size, false, $attributes);
        if ($image) { return $image; }
    }
    if (preg_match('~<img\b[^>]*\bsrc=[\x22\x27]([^\x22\x27]+)[\x22\x27][^>]*>~i', $post->post_content, $match)) {
        $url = html_entity_decode($match[1], ENT_QUOTES, 'UTF-8');
        if (substr($url, 0, 1) === '/' && substr($url, 0, 2) !== '//') {
            // Root-relative media starts at the origin, even when WordPress lives in /blog/.
            $home = wp_parse_url(home_url('/'));
            if (!empty($home['scheme']) && !empty($home['host'])) {
                $origin = $home['scheme'] . '://' . $home['host'];
                if (!empty($home['port'])) { $origin .= ':' . (int) $home['port']; }
                $url = $origin . $url;
            }
        }
        if (wp_http_validate_url($url)) {
            $attachment = attachment_url_to_postid($url);
            if ($attachment) {
                $image = wp_get_attachment_image($attachment, $size, false, $attributes);
                if ($image) { return $image; }
            }
            $alt = '';
            if (preg_match('~\balt=[\x22\x27]([^\x22\x27]*)[\x22\x27]~i', $match[0], $alt_match)) {
                $alt = html_entity_decode($alt_match[1], ENT_QUOTES, 'UTF-8');
            }
            return '<img src="' . esc_url($url) . '" alt="' . esc_attr($alt) . '" loading="' . ($priority ? 'eager' : 'lazy') . '" decoding="async"' . ($priority ? ' fetchpriority="high"' : '') . '>';
        }
    }
    return '<img src="' . esc_url(ub26_asset('images/blog-default.webp')) . '" width="720" height="405" alt="" loading="' . ($priority ? 'eager' : 'lazy') . '" decoding="async"' . ($priority ? ' fetchpriority="high"' : '') . '>';
}

function ub26_post_link($post) {
    $url = get_permalink($post);
    return ub26_is_preview() ? add_query_arg('united_blog_preview', '1', $url) : $url;
}

function ub26_card($post) {
    $post = get_post($post);
    if (!$post || post_password_required($post)) { return; }
    $url = ub26_post_link($post);
    ?>
    <article class="article-card">
      <a class="card-image" href="<?php echo esc_url($url); ?>" tabindex="-1" aria-hidden="true"><?php echo ub26_image($post, 'united-blog-card'); // WordPress escaped media HTML. ?></a>
      <div class="card-content">
        <span class="card-topic"><?php echo esc_html(ub26_topic($post)); ?></span>
        <h3><a href="<?php echo esc_url($url); ?>"><?php echo esc_html(get_the_title($post)); ?></a></h3>
        <div class="article-meta"><span><time datetime="<?php echo esc_attr(get_the_date('c', $post)); ?>"><?php echo esc_html(get_the_date('j \d\e F \d\e Y', $post)); ?></time></span><span><?php echo esc_html(ub26_reading($post)); ?> min de leitura</span></div>
        <p class="card-excerpt"><?php echo esc_html(ub26_excerpt($post)); ?></p>
      </div>
    </article>
    <?php
}

function ub26_contact_band() { ?>
<section class="contact-band"><div class="wrap"><div>
  <p class="eyebrow">Da leitura para a prática</p>
  <h2>O próximo passo acontece ao vivo.</h2>
  <p>Transforme o que você aprende em conversas reais. Conheça as aulas ao vivo e a conversação ilimitada do Live Class.</p>
</div><a class="button" href="<?php echo esc_url(ub26_site_url('cursos/live-class/')); ?>">Conheça o Live Class</a></div></section>
<?php }
