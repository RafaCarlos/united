<?php
/** Optional, local-only import of the two approved United editorial drafts. */
if (!defined('ABSPATH')) { exit; }

function ub26_editorial_existing($record) {
    global $wpdb;
    // Query all statuses, including trash, without front-end query filters.
    // WordPress may add __trashed and save the former slug as post metadata.
    return (int) $wpdb->get_var($wpdb->prepare(
        "SELECT p.ID FROM {$wpdb->posts} p
        WHERE p.post_type = 'post' AND (
            p.post_name IN (%s, %s) OR EXISTS (
                SELECT 1 FROM {$wpdb->postmeta} m WHERE m.post_id = p.ID
                AND ((m.meta_key = '_ub26_editorial_id' AND m.meta_value = %s)
                    OR (m.meta_key = '_wp_desired_post_slug' AND m.meta_value = %s))
            )
        ) ORDER BY p.ID ASC LIMIT 1",
        $record['slug'], $record['slug'] . '__trashed', $record['id'], $record['slug']
    ));
}

function ub26_editorial_file($relative) {
    $root = realpath(dirname(__DIR__) . '/editorial');
    if (!$root || !is_string($relative) || strpos($relative, "\0") !== false) { return false; }
    $file = realpath($root . '/' . $relative);
    return $file && strpos($file, $root . DIRECTORY_SEPARATOR) === 0 && is_file($file) ? $file : false;
}

function ub26_editorial_cover($post_id, $record) {
    $source = ub26_editorial_file($record['image']['file']);
    if (!$source || strtolower(pathinfo($source, PATHINFO_EXTENSION)) !== 'webp') {
        return new WP_Error('ub26_image_source', 'A capa WebP local não foi encontrada no pacote.');
    }
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $image_key = $record['id'] . ':cover';
    $existing = get_posts(array('post_type' => 'attachment', 'post_status' => 'inherit',
        'post_parent' => $post_id, 'numberposts' => 1, 'fields' => 'ids',
        'meta_key' => '_ub26_editorial_image_id', 'meta_value' => $image_key));
    $attachment = $existing ? (int) $existing[0] : 0;
    if (!$attachment) {
        $temporary = wp_tempnam(basename($source));
        if (!$temporary || !copy($source, $temporary)) {
            if ($temporary && is_file($temporary)) { wp_delete_file($temporary); }
            return new WP_Error('ub26_image_temp', 'Não foi possível preparar a capa na pasta temporária do servidor.');
        }
        try {
            $attachment = media_handle_sideload(
                array('name' => sanitize_file_name(basename($source)), 'tmp_name' => $temporary),
                $post_id,
                $record['image']['caption'],
                array('post_title' => $record['title'], 'post_excerpt' => $record['image']['caption'],
                    'meta_input' => array('_ub26_editorial_image_id' => $image_key))
            );
        } finally {
            if (is_file($temporary)) { wp_delete_file($temporary); }
        }
        if (is_wp_error($attachment)) { return $attachment; }
    }
    update_post_meta($attachment, '_wp_attachment_image_alt', $record['image']['alt']);
    set_post_thumbnail($post_id, $attachment);
    if ((int) get_post_thumbnail_id($post_id) !== (int) $attachment) {
        return new WP_Error('ub26_image_thumbnail', 'A mídia foi adicionada, mas a imagem destacada não pôde ser associada. Reexecute para tentar novamente.');
    }
    delete_post_meta($post_id, '_ub26_editorial_media_pending');
    delete_post_meta($post_id, '_ub26_editorial_media_error');
    return $attachment;
}

/**
 * Returns arrays of plain-text notices: created, skipped, errors, media_repaired.
 * Caller must verify the admin-post nonce before invoking this explicit action.
 * No activation hook or page request invokes this function automatically.
 */
function ub26_import_editorial() {
    $summary = array('created' => array(), 'skipped' => array(), 'errors' => array(), 'media_repaired' => array());
    if (!current_user_can('manage_options')) {
        $summary['errors'][] = 'Apenas administradores podem importar os rascunhos.';
        return $summary;
    }
    $key = '_ub26_editorial_import_lock';
    $lock = array('token' => wp_generate_uuid4());
    if (!add_option($key, $lock, '', 'no')) {
        $summary['errors'][] = 'Já existe uma importação em andamento. Aguarde sua conclusão. Se ela foi interrompida, peça ao administrador para remover a opção _ub26_editorial_import_lock após verificar que não há outro processo ativo.';
        return $summary;
    }
    try {
        $manifest = ub26_editorial_file('articles.json');
        $records = $manifest ? json_decode(file_get_contents($manifest), true) : null;
        if (!is_array($records) || count($records) !== 2) {
            $summary['errors'][] = 'O pacote deve conter exatamente os dois artigos editoriais aprovados.';
            return $summary;
        }
        $allowed = array(
            'united-release' => 'united-ingles-online-aulas-ao-vivo-tecnologia',
            'united-midia-2026-10' => 'united-valor-o-globo-live-class-2',
        );
        foreach ($records as $record) {
            if (!is_array($record) || empty($record['id']) || empty($record['slug'])
                || !is_string($record['id']) || !isset($allowed[$record['id']]) || $allowed[$record['id']] !== $record['slug']
                || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $record['slug'])
                || empty($record['title']) || empty($record['body']) || empty($record['image']['file'])
                || !isset($record['excerpt'], $record['byline'], $record['proposed_date'], $record['seo_title'],
                    $record['category_slug'], $record['image']['alt'], $record['image']['caption'])) {
                $summary['errors'][] = 'Foi encontrado um registro editorial incompleto; ele não foi importado.';
                continue;
            }
            $existing = ub26_editorial_existing($record);
            if ($existing) {
                $summary['skipped'][] = $record['title'] . ' — já existe (ID ' . $existing . '); conteúdo preservado.';
                // A failed cover can be retried only on our own unchanged-status draft.
                // Never modify an existing/published/trash post found merely by its slug.
                if (get_post_meta($existing, '_ub26_editorial_id', true) === $record['id']
                    && get_post_status($existing) === 'draft'
                    && get_post_meta($existing, '_ub26_editorial_media_pending', true)
                    && !has_post_thumbnail($existing)) {
                    $cover = ub26_editorial_cover($existing, $record);
                    if (is_wp_error($cover)) {
                        update_post_meta($existing, '_ub26_editorial_media_error', $cover->get_error_message());
                        $summary['errors'][] = $record['title'] . ' — capa pendente: ' . $cover->get_error_message();
                    } else { $summary['media_repaired'][] = $record['title'] . ' — capa recuperada sem alterar o texto.'; }
                }
                continue;
            }
            $body_file = ub26_editorial_file($record['body']);
            if (!$body_file || strtolower(pathinfo($body_file, PATHINFO_EXTENSION)) !== 'html') {
                $summary['errors'][] = $record['title'] . ' — arquivo de conteúdo local ausente.';
                continue;
            }
            $content = file_get_contents($body_file);
            if ($content === false || trim($content) === '') {
                $summary['errors'][] = $record['title'] . ' — conteúdo vazio ou ilegível.';
                continue;
            }
            $category = get_term_by('slug', $record['category_slug'], 'category');
            $categories = $category ? array((int) $category->term_id) : array();
            // No existing post, taxonomy, author, date or SEO plugin setting is overwritten.
            $post_id = wp_insert_post(wp_slash(array(
                'post_type' => 'post', 'post_status' => 'draft',
                'post_author' => get_current_user_id(), 'post_name' => $record['slug'],
                'post_title' => $record['title'], 'post_excerpt' => $record['excerpt'],
                'post_content' => wp_kses_post($content), 'post_category' => $categories,
                'comment_status' => 'closed', 'ping_status' => 'closed',
                'meta_input' => array(
                    '_ub26_editorial_id' => $record['id'],
                    '_ub26_editorial_byline' => $record['byline'],
                    '_ub26_editorial_proposed_date' => $record['proposed_date'],
                    '_ub26_editorial_seo_title' => $record['seo_title'],
                    '_ub26_editorial_media_pending' => '1',
                ),
            )), true);
            if (is_wp_error($post_id) || !$post_id) {
                $summary['errors'][] = $record['title'] . ' — ' . (is_wp_error($post_id) ? $post_id->get_error_message() : 'Não foi possível criar o rascunho.');
                continue;
            }
            $summary['created'][] = $record['title'] . ' — rascunho criado (ID ' . $post_id . ').';
            $cover = ub26_editorial_cover($post_id, $record);
            if (is_wp_error($cover)) {
                update_post_meta($post_id, '_ub26_editorial_media_error', $cover->get_error_message());
                $summary['errors'][] = $record['title'] . ' — rascunho preservado; capa pendente: ' . $cover->get_error_message();
            }
        }
    } catch (Throwable $error) {
        // Earlier drafts are retained and deduplicated on the next explicit attempt.
        $summary['errors'][] = 'A importação foi interrompida. Os rascunhos já criados foram mantidos. Verifique o log do servidor antes de tentar novamente.';
        error_log('United Blog editorial import: ' . $error->getMessage());
    } finally {
        $current = get_option($key);
        if (is_array($current) && isset($current['token']) && $current['token'] === $lock['token']) { delete_option($key); }
    }
    return $summary;
}
