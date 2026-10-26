<?php
if (!defined('ABSPATH')) { exit; }

add_action('admin_menu', function () {
    add_options_page('Blog United', 'Blog United', 'manage_options', 'united-blog', 'ub26_admin_page');
});
add_action('admin_init', function () {
    register_setting('ub26_options', 'ub26_settings', array('type' => 'array', 'sanitize_callback' => 'ub26_sanitize_settings'));
});
function ub26_sanitize_settings($input) {
    $input = is_array($input) ? $input : array();
    $old = ub26_settings();
    $url = isset($input['site_url']) ? esc_url_raw(trim($input['site_url']), array('https', 'http')) : $old['site_url'];
    $parsed = wp_parse_url($url);
    if (!$parsed || empty($parsed['host']) || !empty($parsed['user']) || !empty($parsed['pass']) || !empty($parsed['query']) || !empty($parsed['fragment'])) {
        $url = $old['site_url'];
        add_settings_error('ub26_settings', 'invalid_url', 'Informe um endereço válido para o site principal, sem parâmetros ou credenciais.');
    }
    return array('enabled' => !empty($input['enabled']), 'site_url' => untrailingslashit($url),
        'contact' => !empty($input['contact']), 'tracking' => !empty($input['tracking']));
}
function ub26_admin_page() {
    if (!current_user_can('manage_options')) { return; }
    $settings = ub26_settings();
    ?>
    <div class="wrap"><h1>Blog United</h1>
    <p>Os artigos continuam em <a href="<?php echo esc_url(admin_url('edit.php')); ?>">Posts</a>. Título, texto, resumo, categorias e imagem destacada alimentam o novo visual automaticamente.</p>
    <?php settings_errors(); ?>
    <?php $notice = get_transient('ub26_import_notice_' . get_current_user_id()); if ($notice) : delete_transient('ub26_import_notice_' . get_current_user_id()); ?>
        <div class="notice notice-info"><p><?php echo esc_html($notice); ?></p></div>
    <?php endif; ?>
    <form method="post" action="options.php">
    <?php settings_fields('ub26_options'); ?>
    <table class="form-table" role="presentation">
    <tr><th scope="row">Novo visual</th><td><label><input type="checkbox" name="ub26_settings[enabled]" value="1" <?php checked($settings['enabled']); ?>> Aplicar ao blog para todos os visitantes</label><p class="description">Desmarcar restaura a apresentação do tema ativo. Posts, usuários e configurações de URLs são preservados.</p></td></tr>
    <tr><th scope="row"><label for="ub26-site-url">Site principal</label></th><td><input class="regular-text" type="url" id="ub26-site-url" name="ub26_settings[site_url]" value="<?php echo esc_attr($settings['site_url']); ?>"><p class="description">Destino do menu e dos cursos. Os links do blog usam os endereços existentes deste WordPress.</p></td></tr>
    <tr><th scope="row">Formulário</th><td><label><input type="checkbox" name="ub26_settings[contact]" value="1" <?php checked($settings['contact']); ?>> Usar o formulário oficial RD nos botões de contato</label></td></tr>
    <tr><th scope="row">RD / GTM</th><td><label><input type="checkbox" name="ub26_settings[tracking]" value="1" <?php checked($settings['tracking']); ?>> Carregar a conta RD e o container GTM usados no site principal</label><p class="description">Deixe desmarcado se já são carregados por plugins ou pela hospedagem. Verifique também a configuração de consentimento existente. O formulário funciona independentemente desta opção.</p></td></tr>
    </table><?php submit_button('Salvar configurações'); ?></form>
    <h2>Conferir antes de ativar</h2>
    <p><a class="button" href="<?php echo esc_url(add_query_arg('united_blog_preview', '1', ub26_blog_url())); ?>" target="_blank" rel="noopener">Abrir prévia do novo blog</a></p>
    <p>A prévia é exclusiva para administradores autenticados, sem cache e sem indexação. Navegue pelos artigos e confira o menu, as imagens, a leitura e o formulário no celular.</p>
    <h2>Textos preparados para o lançamento</h2>
    <p>Importe somente os dois textos novos — release institucional e notícia sobre a imprensa — como rascunhos. Artigos existentes não são alterados. Repetir a importação não duplica os textos.</p>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
    <input type="hidden" name="action" value="ub26_import_editorial">
    <?php wp_nonce_field('ub26_import_editorial'); submit_button('Adicionar os dois rascunhos', 'secondary'); ?>
    </form>
    <p>Para novos conteúdos: <strong>Posts → Adicionar novo</strong>. Use o editor padrão, preencha o resumo e a imagem destacada e publique ou agende. A busca e as categorias se atualizam automaticamente.</p>
    </div>
    <?php
}
add_action('admin_post_ub26_import_editorial', function () {
    if (!current_user_can('manage_options')) { wp_die('Acesso restrito.', '', array('response' => 403)); }
    check_admin_referer('ub26_import_editorial');
    $result = ub26_import_editorial();
    $created = isset($result['created']) ? count((array) $result['created']) : 0;
    $skipped = isset($result['skipped']) ? count((array) $result['skipped']) : 0;
    $errors = isset($result['errors']) ? (array) $result['errors'] : array();
    $message = sprintf('%d rascunho(s) criado(s); %d texto(s) já existente(s).', $created, $skipped);
    if ($errors) { $message .= ' Conferir importação: ' . implode(' ', array_map('wp_strip_all_tags', $errors)); }
    set_transient('ub26_import_notice_' . get_current_user_id(), $message, 300);
    wp_safe_redirect(admin_url('options-general.php?page=united-blog')); exit;
});
// Keep the administrator's preview across article/category/pagination links only.
function ub26_preview_link($url) {
    return ub26_is_preview() && !is_admin() ? add_query_arg('united_blog_preview', '1', $url) : $url;
}
add_filter('post_link', 'ub26_preview_link');
add_filter('category_link', 'ub26_preview_link');
add_filter('tag_link', 'ub26_preview_link');
add_filter('get_pagenum_link', 'ub26_preview_link');
