<?php
/**
 * Plugin Name: United SEO Review
 * Description: Correções de apresentação SEO do blog United Idiomas, sem alterar conteúdo ou opções no banco.
 * Version: 1.1.0
 * Requires PHP: 7.4
 * Author: United Idiomas
 * License: GPL-2.0-or-later
 */

namespace United_SEO_Review;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

const BLOG_TITLE = 'Dicas de inglês para viagens e trabalho | United Idiomas';
const BLOG_DESCRIPTION = 'Aprenda com dicas de inglês para conversação, viagens e trabalho. Explore os artigos do blog da United Idiomas para organizar seus estudos.';
const AI_SLUG = 'ia-aprender-ingles-habilidades-humanas';

/**
 * Register only after a public WordPress query. Login, admin, REST and AJAX
 * do not receive these presentation filters. No activation hook or DB write.
 */
function register_frontend_filters() {
    if ( is_admin() || wp_doing_ajax() || is_feed() || is_preview()
        || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
        return;
    }

    add_filter( 'language_attributes', __NAMESPACE__ . '\\language_attributes', 20 );
    add_filter( 'pre_get_document_title', __NAMESPACE__ . '\\title', 20 );
    add_filter( 'wpseo_title', __NAMESPACE__ . '\\title', 20 );
    add_filter( 'wpseo_opengraph_title', __NAMESPACE__ . '\\title', 20 );
    add_filter( 'wpseo_twitter_title', __NAMESPACE__ . '\\title', 20 );
    add_filter( 'wpseo_metadesc', __NAMESPACE__ . '\\description', 20 );
    add_filter( 'wpseo_opengraph_desc', __NAMESPACE__ . '\\description', 20 );
    add_filter( 'wpseo_twitter_description', __NAMESPACE__ . '\\description', 20 );
    add_filter( 'wpseo_locale', __NAMESPACE__ . '\\opengraph_locale', 20 );
    add_filter( 'wpseo_schema_person', __NAMESPACE__ . '\\corporate_author', 20 );
    add_filter( 'wpseo_schema_article', __NAMESPACE__ . '\\article', 20 );
    add_filter( 'wpseo_schema_webpage', __NAMESPACE__ . '\\webpage', 20 );
    add_filter( 'wpseo_schema_graph', __NAMESPACE__ . '\\schema_language', 20 );
    add_filter( 'the_content', __NAMESPACE__ . '\\contextual_links', 30 );
}
add_action( 'wp', __NAMESPACE__ . '\\register_frontend_filters' );

function language_attributes( $attributes ) {
    // Preserve unrelated HTML attributes and any future non-Portuguese page.
    return preg_replace( '/(^|\s)((?:xml:)?lang)=("|\')pt[-_](?:PT|BR)\3/i', '$1$2="pt-BR"', $attributes );
}

function opengraph_locale( $locale ) {
    return in_array( $locale, array( 'pt_PT', 'pt_BR' ), true ) ? 'pt_BR' : $locale;
}

function title( $current ) {
    if ( ! is_home() && ! is_front_page() ) {
        return $current;
    }
    $page = max( 1, (int) get_query_var( 'paged', 1 ), (int) get_query_var( 'page', 1 ) );
    return BLOG_TITLE . ( $page > 1 ? ' — Página ' . $page : '' );
}

function current_post_slug() {
    return is_singular( 'post' )
        ? (string) get_post_field( 'post_name', get_queried_object_id() ) : '';
}

function description( $current ) {
    if ( is_home() || is_front_page() ) {
        return BLOG_DESCRIPTION;
    }
    $descriptions = post_descriptions();
    return $descriptions[ current_post_slug() ] ?? $current;
}

/** Read only the reviewed local file. Missing/invalid data keeps Yoast's output. */
function load_description_map( $path ) {
    if ( ! is_file( $path ) || ! is_readable( $path ) ) {
        return array();
    }
    $json = @file_get_contents( $path );
    return $json === false ? array() : decode_description_map( $json );
}

function decode_description_map( $json ) {
    $document = json_decode( $json, true );
    if ( ! is_array( $document ) || ( $document['version'] ?? null ) !== 1
        || ! is_array( $document['posts'] ?? null ) ) {
        return array();
    }
    $descriptions = array();
    foreach ( $document['posts'] as $slug => $entry ) {
        if ( ! is_string( $slug ) || ! preg_match( '/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug )
            || ! is_array( $entry ) || ! is_string( $entry['description'] ?? null )
            || ( $entry['url'] ?? '' ) !== 'https://unitedidiomas.com/blog/' . $slug . '/' ) {
            continue;
        }
        $text = trim( $entry['description'] );
        if ( ! preg_match( '/^.{80,220}$/u', $text ) || preg_match( '/[<>\r\n]/u', $text ) ) {
            continue;
        }
        $descriptions[ $slug ] = $text;
    }
    return $descriptions;
}

function post_descriptions() {
    static $descriptions = null;
    if ( $descriptions === null ) {
        $descriptions = load_description_map( __DIR__ . '/post-descriptions.json' );
    }
    return $descriptions;
}

function corporate_author( $data ) {
    if ( ! is_array( $data ) || empty( $data['name'] )
        || strtolower( trim( $data['name'] ) ) !== 'united idiomas'
        || ! in_array( 'Person', (array) ( $data['@type'] ?? array() ), true ) ) {
        return $data;
    }

    // Keep the existing opaque @id so Article/WebPage references stay valid.
    // This exact corporate name is not a person; real author names are untouched.
    $data['@type'] = 'Organization';
    foreach ( array( 'givenName', 'familyName', 'gender', 'birthDate', 'deathDate',
        'honorificPrefix', 'honorificSuffix', 'jobTitle', 'worksFor', 'knowsLanguage' ) as $key ) {
        unset( $data[ $key ] );
    }
    // The sampled author uses Gravatar's generic silhouette, not an organization logo.
    $image_url = is_array( $data['image'] ?? null ) ? ( $data['image']['url'] ?? '' ) : '';
    if ( preg_match( '~^https?://(?:secure\.)?gravatar\.com/avatar/~i', $image_url )
        && preg_match( '/[?&]d=mm(?:&|$)/', $image_url ) ) {
        unset( $data['image'] );
    }
    return $data;
}

function audited_slugs() {
    return array( AI_SLUG, 'aprender-ingles-sozinho-ou-com-professor', 'ingles-viajar-europa-outono' );
}

function article( $data ) {
    if ( is_array( $data ) && in_array( current_post_slug(), audited_slugs(), true ) ) {
        // The sampled articles use keyword lists, including a copied IA list.
        // Omit this optional field; no synthetic keywords or ranking claims.
        unset( $data['keywords'] );
    }
    return $data;
}

function webpage( $data ) {
    if ( ! is_array( $data ) ) {
        return $data;
    }
    if ( is_home() || is_front_page() ) {
        $data['name'] = title( $data['name'] ?? '' );
        $data['description'] = BLOG_DESCRIPTION;
    } else {
        $descriptions = post_descriptions();
        $slug = current_post_slug();
        if ( isset( $descriptions[ $slug ] ) ) {
            $data['description'] = $descriptions[ $slug ];
        }
    }
    return $data;
}

function schema_language( $data ) {
    if ( ! is_array( $data ) ) {
        return $data;
    }
    foreach ( $data as $key => $value ) {
        if ( $key === 'inLanguage' && in_array( $value, array( 'pt-PT', 'pt_PT', 'pt_BR', 'pt-BR' ), true ) ) {
            $data[ $key ] = 'pt-BR';
        } elseif ( is_array( $value ) ) {
            $data[ $key ] = schema_language( $value );
        }
    }
    return $data;
}

function contextual_links( $content ) {
    if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query()
        || (int) get_the_ID() !== (int) get_queried_object_id()
        || get_post_status( get_the_ID() ) !== 'publish' || post_password_required()
        || strpos( $content, 'data-united-seo-links' ) !== false ) {
        return $content;
    }

    $slug = current_post_slug();
    $copy = array(
        'ingles-viajar-europa-outono' => 'Para praticar conversação antes da viagem, conheça o <a href="https://www.unitedidiomas.com/cursos/#live-class">Live Class, curso de inglês com aulas ao vivo</a>.',
        AI_SLUG => 'Para combinar seus estudos com prática orientada, conheça as <a href="https://www.unitedidiomas.com/cursos/#live-class">aulas ao vivo do Live Class</a>. Para o contexto profissional, veja o <a href="https://www.unitedidiomas.com/cursos/#united-business">United Business, inglês para negócios</a>.',
        'aprender-ingles-sozinho-ou-com-professor' => 'Se você procura acompanhamento e conversação, conheça o <a href="https://www.unitedidiomas.com/cursos/#live-class">Live Class, com aulas de inglês ao vivo</a> e avalie se a proposta atende à sua rotina.',
    );
    if ( ! isset( $copy[ $slug ] ) ) {
        return $content;
    }
    // Append one plain paragraph; do not rewrite Divi blocks, the existing CTA,
    // tracking, forms, shortcodes, links or content stored in the database.
    return $content . "\n" . '<p data-united-seo-links="1">' . $copy[ $slug ] . '</p>';
}
