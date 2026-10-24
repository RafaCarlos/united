<?php
if (!defined('ABSPATH')) { exit; }
$listing = ub26_listing();
$query = $listing['query'];
$featured = $listing['featured'];
$search = get_search_query(false);
$current_category = (string) get_query_var('category_name');
if (is_category()) { $current_category = get_queried_object()->slug; }
$base_args = array();
if ($search !== '') { $base_args['s'] = $search; $base_args['post_type'] = 'post'; }
if (ub26_is_preview()) { $base_args['united_blog_preview'] = '1'; }
$categories = get_categories(array('hide_empty' => true, 'orderby' => 'name'));
$is_landing = (is_home() || is_front_page()) && !is_search() && $listing['paged'] === 1;
?>
<section class="blog-intro wrap">
  <nav class="breadcrumb" aria-label="Você está em"><a href="<?php echo esc_url(ub26_site_url()); ?>">Início</a><span aria-hidden="true">/</span><span aria-current="page">Blog</span></nav>
  <div class="blog-intro-line"><div><p class="eyebrow">Blog United</p>
    <?php if ($is_landing) : ?><h1>Mais inglês.<br><span>Mais possibilidades.</span></h1>
    <?php else : ?><h1><?php echo esc_html($listing['title']); ?></h1><?php endif; ?>
  </div><p class="intro-description"><?php echo esc_html($is_landing ? 'Carreira, viagens, cultura e tecnologia. Ideias para aprender inglês e usá-lo nas experiências que importam para você.' : $listing['description']); ?></p></div>
</section>
<?php if ($featured) : ?>
<section class="featured wrap" aria-label="Artigo em destaque">
  <a class="featured-media" href="<?php echo esc_url(ub26_post_link($featured)); ?>" tabindex="-1" aria-hidden="true"><?php echo ub26_image($featured, 'united-blog-cover', true); ?></a>
  <div class="featured-copy"><p class="eyebrow">Em destaque · <?php echo esc_html(ub26_topic($featured)); ?></p>
    <div class="article-meta"><span><time datetime="<?php echo esc_attr(get_the_date('c', $featured)); ?>"><?php echo esc_html(get_the_date('j \d\e F \d\e Y', $featured)); ?></time></span><span><?php echo esc_html(ub26_reading($featured)); ?> min de leitura</span></div>
    <h2><a href="<?php echo esc_url(ub26_post_link($featured)); ?>"><?php echo esc_html(get_the_title($featured)); ?></a></h2>
    <p class="featured-summary"><?php echo esc_html(ub26_excerpt($featured)); ?></p>
    <a class="button" href="<?php echo esc_url(ub26_post_link($featured)); ?>">Ler artigo</a>
  </div>
</section>
<?php endif; ?>
<section class="library wrap" id="article-library">
  <div class="library-heading"><div><h2><?php echo is_search() ? 'Encontre a sua próxima leitura' : 'Artigos para o seu inglês ir além'; ?></h2><p>Explore por assunto ou encontre o que você quer aprender.</p></div>
    <form class="blog-search" role="search" method="get" action="<?php echo esc_url(ub26_blog_url()); ?>">
      <label for="search-articles">Buscar nos artigos</label><input type="search" id="search-articles" name="s" placeholder="O que você quer aprender?" value="<?php echo esc_attr($search); ?>">
      <input type="hidden" name="post_type" value="post">
      <?php if ($current_category !== '') : ?><input type="hidden" name="category_name" value="<?php echo esc_attr($current_category); ?>"><?php endif; ?>
      <?php if (ub26_is_preview()) : ?><input type="hidden" name="united_blog_preview" value="1"><?php endif; ?>
      <button type="submit">Buscar</button>
    </form>
  </div>
  <nav class="topics" aria-label="Filtrar por assunto">
    <a href="<?php echo esc_url(add_query_arg($base_args, ub26_blog_url())); ?>" <?php if (!$current_category) { echo 'aria-current="page"'; } ?>>Todos</a>
    <?php foreach ($categories as $category) : ?>
    <a href="<?php echo esc_url(add_query_arg(array_merge($base_args, array('category_name' => $category->slug)), ub26_blog_url())); ?>" <?php if ($current_category === $category->slug) { echo 'aria-current="page"'; } ?>><?php echo esc_html($category->name); ?></a>
    <?php endforeach; ?>
  </nav>
  <div class="search-info"><p class="search-status"><?php echo esc_html(number_format_i18n($query->found_posts)); ?> <?php echo $query->found_posts === 1 ? 'artigo encontrado' : 'artigos para explorar'; ?><?php if ($query->max_num_pages > 1) : ?>. Página <?php echo esc_html($listing['paged']); ?> de <?php echo esc_html($query->max_num_pages); ?><?php endif; ?>.</p>
  <?php if ($search !== '' || $current_category !== '') : ?><a class="clear-search" href="<?php echo esc_url(ub26_blog_url()); ?>">Limpar filtros</a><?php endif; ?></div>
  <?php if ($query->have_posts()) : ?>
  <div class="articles-grid">
    <?php foreach ($query->posts as $card_post) { if (!$featured || (int) $card_post->ID !== (int) $featured->ID) { ub26_card($card_post); } } ?>
  </div>
  <?php if ($query->max_num_pages > 1) : ?>
  <nav class="pagination" aria-label="Paginação dos artigos"><?php echo paginate_links(array('total' => (int) $query->max_num_pages, 'current' => (int) $listing['paged'], 'type' => 'plain', 'mid_size' => 1, 'end_size' => 1, 'prev_text' => 'Anterior', 'next_text' => 'Próxima', 'add_fragment' => '#article-library')); ?></nav>
  <?php endif; ?>
  <?php else : ?><div class="empty-results"><h3>Nenhum artigo encontrado</h3><p>Tente outro termo ou explore todos os assuntos do blog.</p><a class="button outline" href="<?php echo esc_url(ub26_blog_url()); ?>">Ver todos os artigos</a></div><?php endif; ?>
</section>
<?php ub26_contact_band(); ?>
