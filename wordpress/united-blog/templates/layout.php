<?php if (!defined('ABSPATH')) { exit; } ?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class('united-blog-view'); ?> id="inicio">
<?php wp_body_open(); ?>
<?php require UB26_DIR . 'templates/header.php'; ?>
<main id="conteudo" class="united-blog-main">
<?php require UB26_DIR . 'templates/' . (is_singular('post') ? 'single.php' : 'listing.php'); ?>
</main>
<?php require UB26_DIR . 'templates/footer.php'; ?>
<?php wp_footer(); ?>
</body>
</html>
