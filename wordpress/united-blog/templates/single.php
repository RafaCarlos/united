<?php
if (!defined('ABSPATH')) { exit; }
while (have_posts()) : the_post();
$current = get_post();
$protected = post_password_required($current);
// Render once: WordPress/Divi content filters run normally and prepare the table of contents.
$content = ub26_content($current);
$toc = ub26_toc();
?>
<article>
  <header class="article-heading wrap">
    <nav class="breadcrumb" aria-label="Você está em"><a href="<?php echo esc_url(ub26_site_url()); ?>">Início</a><span aria-hidden="true">/</span><a href="<?php echo esc_url(ub26_blog_url()); ?>">Blog</a><span aria-hidden="true">/</span><span aria-current="page"><?php echo esc_html(ub26_topic($current)); ?></span></nav>
    <div class="article-title-wrap"><p class="eyebrow"><?php echo esc_html(ub26_topic($current)); ?></p><h1><?php the_title(); ?></h1>
    <?php if (!$protected) : ?>
    <div class="byline"><span class="author-badge" aria-hidden="true">U</span><div class="byline-info"><strong><?php echo esc_html(get_the_author()); ?></strong><time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date('j \d\e F \d\e Y')); ?></time> · <?php echo esc_html(ub26_reading($current)); ?> min de leitura</div><button class="share-button" type="button" data-ub-share data-share-url="<?php echo esc_url(get_permalink()); ?>" hidden>Compartilhar</button></div><p class="share-status" role="status" aria-live="polite" data-share-status></p>
    <?php endif; ?></div>
  </header>
  <?php if (ub26_has_cover($current)) : ?>
  <div class="wrap"><figure class="article-cover"><?php echo ub26_image($current, 'united-blog-cover', true, '(max-width: 780px) calc(100vw - 40px), (max-width: 1224px) calc(100vw - 64px), 1160px'); ?></figure>
  <?php $cover_caption = wp_get_attachment_caption(get_post_thumbnail_id($current)); if ($cover_caption) : ?><p class="article-cover-caption"><?php echo esc_html($cover_caption); ?></p><?php endif; ?></div>
  <?php endif; ?>
  <div class="reading-layout wrap <?php echo $protected ? 'reading-protected' : ''; ?>">
    <div class="article-body entry-content" id="article-content"><?php echo $content; // WordPress the_content filters own trusted authored HTML. ?>
      <?php if (!$protected) : ?>
      <?php wp_link_pages(array('before' => '<nav class="pagination article-pages" aria-label="Páginas do artigo">', 'after' => '</nav>')); ?>
      <?php if (comments_open() || get_comments_number()) { comments_template(); } ?>
      <?php endif; ?>
    </div>
    <?php if (!$protected) : ?><aside class="reading-sidebar" aria-label="Navegação do artigo">
      <?php if ($toc) : ?><p class="toc-label">Neste artigo</p><nav class="article-toc" aria-label="Neste artigo"><?php foreach ($toc as $item) : ?><a href="#<?php echo esc_attr($item['id']); ?>"><?php echo esc_html($item['text']); ?></a><?php endforeach; ?></nav><?php endif; ?>
      <div class="sidebar-course"><p class="eyebrow">United Live Class</p><h2>Leve o inglês para a conversa.</h2><p>Aulas ao vivo, histórias e conversação ilimitada para praticar na vida real.</p><a href="<?php echo esc_url(ub26_site_url('cursos/live-class/')); ?>">Conheça o Live Class</a></div>
    </aside><?php endif; ?>
  </div>
</article>
<?php if (!$protected) :
$related = new WP_Query(array('post_type' => 'post', 'post_status' => 'publish', 'has_password' => false, 'posts_per_page' => 3, 'no_found_rows' => true, 'ignore_sticky_posts' => true, 'post__not_in' => array($current->ID), 'category__in' => wp_get_post_categories($current->ID)));
if ($related->have_posts()) : ?>
<section class="related-section"><div class="wrap"><div class="related-heading"><h2>Continue a sua leitura</h2><a href="<?php echo esc_url(ub26_blog_url()); ?>">Todos os artigos</a></div><div class="articles-grid"><?php foreach ($related->posts as $related_post) { ub26_card($related_post); } ?></div></div></section>
<?php endif; wp_reset_postdata(); endif; ?>
<?php endwhile; ?>
