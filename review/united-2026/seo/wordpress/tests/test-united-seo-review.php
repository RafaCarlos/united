<?php
/** CLI contract tests with WordPress function stubs; no site/DB/network required. */
define( 'ABSPATH', __DIR__ . '/' );
$filters = array();
$actions = array();
$state = array();
$checks = 0;

function add_filter( $hook, $callback, $priority = 10 ) { $GLOBALS['filters'][ $hook ][] = $callback; }
function add_action( $hook, $callback ) { $GLOBALS['actions'][ $hook ][] = $callback; }
function is_admin() { return ! empty( $GLOBALS['state']['admin'] ); }
function wp_doing_ajax() { return ! empty( $GLOBALS['state']['ajax'] ); }
function is_feed() { return ! empty( $GLOBALS['state']['feed'] ); }
function is_preview() { return ! empty( $GLOBALS['state']['preview'] ); }
function is_home() { return ! empty( $GLOBALS['state']['home'] ); }
function is_front_page() { return ! empty( $GLOBALS['state']['front'] ); }
function is_singular( $type ) { return ( $GLOBALS['state']['type'] ?? '' ) === $type; }
function get_query_var( $key, $default = '' ) { return $GLOBALS['state'][ $key ] ?? $default; }
function get_queried_object_id() { return 42; }
function get_post_field( $field, $id ) { return $GLOBALS['state']['slug'] ?? ''; }
function get_post_status( $id ) { return $GLOBALS['state']['status'] ?? 'publish'; }
function get_the_ID() { return $GLOBALS['state']['loop_id'] ?? 42; }
function in_the_loop() { return $GLOBALS['state']['loop'] ?? true; }
function is_main_query() { return $GLOBALS['state']['main'] ?? true; }
function post_password_required() { return $GLOBALS['state']['password'] ?? false; }

function check( $condition, $message ) {
    $GLOBALS['checks']++;
    if ( ! $condition ) {
        fwrite( STDERR, 'FAIL: ' . $message . "\n" );
        exit( 1 );
    }
    echo 'OK: ' . $message . "\n";
}

require dirname( __DIR__ ) . '/united-seo-review/united-seo-review.php';

check( empty( $filters ) && isset( $actions['wp'] ), 'Filters wait for public WordPress query; no login/admin registration at load' );
foreach ( array( 'admin', 'ajax', 'feed', 'preview' ) as $flag ) {
    $state = array( $flag => true );
    United_SEO_Review\register_frontend_filters();
    check( empty( $filters ), 'No presentation changes in ' . $flag );
}
$state = array();
United_SEO_Review\register_frontend_filters();
check( isset( $filters['wpseo_schema_person'], $filters['the_content'] ), 'Public hooks register' );
check( ! isset( $filters['wpseo_robots'], $filters['wpseo_canonical'], $filters['robots_txt'], $actions['wp_head'] ), 'No robots/canonical override or duplicate head output' );

$attrs = 'dir="ltr" lang="pt-PT" xml:lang="pt-PT" data-theme="united" data-lang="pt-PT"';
$actual = United_SEO_Review\language_attributes( $attrs );
check( $actual === 'dir="ltr" lang="pt-BR" xml:lang="pt-BR" data-theme="united" data-lang="pt-PT"', 'Portuguese HTML language changes without losing attributes' );
check( United_SEO_Review\language_attributes( 'lang="en-US"' ) === 'lang="en-US"', 'Foreign-language HTML stays unchanged' );
check( United_SEO_Review\opengraph_locale( 'pt_PT' ) === 'pt_BR' && United_SEO_Review\opengraph_locale( 'en_US' ) === 'en_US', 'Open Graph only changes Portuguese locale' );

$state = array( 'front' => true );
check( United_SEO_Review\title( 'Home (blog)' ) === United_SEO_Review\BLOG_TITLE, 'Static blog front page gets descriptive title' );
$state = array( 'home' => true, 'paged' => 3 );
check( United_SEO_Review\title( 'Old' ) === United_SEO_Review\BLOG_TITLE . ' — Página 3', 'Paginated blog index remains distinguishable' );
$state = array( 'type' => 'post', 'slug' => United_SEO_Review\AI_SLUG );
check( United_SEO_Review\title( 'Article title' ) === 'Article title', 'Article titles are preserved' );
check( United_SEO_Review\description( 'keywords; list' ) === United_SEO_Review\post_descriptions()[ United_SEO_Review\AI_SLUG ], 'AI article receives natural description' );
$state['slug'] = 'unrelated-post';
check( United_SEO_Review\description( 'Editorial description' ) === 'Editorial description', 'Other article descriptions stay unchanged' );

$person = array( '@type' => 'Person', '@id' => 'https://example.test/#person/opaque', 'name' => 'United Idiomas', 'givenName' => 'United', 'jobTitle' => 'old', 'image' => array( 'url' => 'https://secure.gravatar.com/avatar/opaque?s=96&d=mm&r=g' ) );
$organization = United_SEO_Review\corporate_author( $person );
check( $organization['@type'] === 'Organization' && $organization['@id'] === $person['@id'], 'Corporate author changes type while preserving all author references' );
check( ! isset( $organization['givenName'] ) && ! isset( $organization['jobTitle'] ) && ! isset( $organization['image'] ), 'Person-only details and sampled generic avatar are not presented as company identity' );
$real_person = array( '@type' => 'Person', '@id' => '#real-person', 'name' => 'Test Author', 'givenName' => 'Test' );
check( United_SEO_Review\corporate_author( $real_person ) === $real_person, 'Actual person author is untouched' );

$graph = array( array( 'inLanguage' => 'pt-PT', 'author' => array( '@id' => '#person/opaque' ), 'image' => array( 'inLanguage' => 'pt_PT' ) ), array( 'inLanguage' => 'en-US' ) );
$fixed_graph = United_SEO_Review\schema_language( $graph );
check( $fixed_graph[0]['inLanguage'] === 'pt-BR' && $fixed_graph[0]['image']['inLanguage'] === 'pt-BR' && $fixed_graph[1]['inLanguage'] === 'en-US' && $fixed_graph[0]['author'] === $graph[0]['author'], 'Nested schema language stays consistent without changing references or foreign languages' );

$state = array( 'type' => 'post', 'slug' => 'aprender-ingles-sozinho-ou-com-professor' );
$article = array( '@type' => 'Article', 'keywords' => array( 'copied AI keywords' ), 'headline' => 'Original headline', 'dateModified' => '2026-08-21' );
$fixed_article = United_SEO_Review\article( $article );
check( ! isset( $fixed_article['keywords'] ) && $fixed_article['dateModified'] === $article['dateModified'], 'Copied keywords removed without faking update dates' );
$state['slug'] = 'unrelated-post';
check( United_SEO_Review\article( $article ) === $article, 'Unaudited article keywords left to editorial review' );
$state['slug'] = United_SEO_Review\AI_SLUG;
$page = United_SEO_Review\webpage( array( '@id' => '#webpage', 'description' => 'list', 'url' => 'https://unitedidiomas.com/blog/ia-aprender-ingles-habilidades-humanas/' ) );
check( $page['description'] === United_SEO_Review\post_descriptions()[ United_SEO_Review\AI_SLUG ] && $page['@id'] === '#webpage', 'Schema description matches visible meta without canonical changes' );

$map_path = dirname( __DIR__ ) . '/united-seo-review/post-descriptions.json';
$map = United_SEO_Review\post_descriptions();
$evidence = json_decode( file_get_contents( $map_path ), true )['posts'];
$crawl = json_decode( file_get_contents( dirname( __DIR__ ) . '/crawl-posts-2026-09-18.json' ), true );
$expected_slugs = array( United_SEO_Review\AI_SLUG );
$final_descriptions = array();
foreach ( $crawl['posts'] as $row ) {
    $slug = basename( parse_url( $row['url'], PHP_URL_PATH ) );
    if ( in_array( 'duplicate_description_across_posts', $row['alerts'], true ) ) {
        $expected_slugs[] = $slug;
    }
    $final_descriptions[] = $map[ $slug ] ?? $row['description'];
}
$expected_slugs = array_values( array_unique( $expected_slugs ) );
$actual_slugs = array_keys( $map );
sort( $expected_slugs );
sort( $actual_slugs );
check( count( $map ) === 48 && $actual_slugs === $expected_slugs, 'Map covers exactly 47 duplicated descriptions plus original AI article' );
check( count( array_unique( $map ) ) === count( $map ), 'All reviewed descriptions are unique' );
check( count( array_unique( $final_descriptions ) ) === count( $final_descriptions ), 'Applying map removes description duplication in the 182-post census' );

$valid_evidence = true;
$valid_length = true;
$all_hooks_match = true;
foreach ( $map as $slug => $text ) {
    $row = $evidence[ $slug ];
    $valid_evidence = $valid_evidence && $row['url'] === 'https://unitedidiomas.com/blog/' . $slug . '/'
        && ! empty( $row['source_title'] ) && count( $row['source_topics'] ) >= 2;
    $valid_length = $valid_length && preg_match( '/^.{120,170}$/u', $text ) === 1;
    $state = array( 'type' => 'post', 'slug' => $slug );
    foreach ( array( 'wpseo_metadesc', 'wpseo_opengraph_desc', 'wpseo_twitter_description' ) as $hook ) {
        $all_hooks_match = $all_hooks_match && is_callable( $filters[ $hook ][0] )
            && call_user_func( $filters[ $hook ][0], 'Original description' ) === $text;
    }
    $all_hooks_match = $all_hooks_match && United_SEO_Review\webpage( array( 'description' => 'Original' ) )['description'] === $text;
}
check( $valid_evidence, 'Every description is tied to the matching public URL, source title and summarized topics' );
check( $valid_length, 'Reviewed descriptions remain between 120 and 170 Unicode characters' );
check( $all_hooks_match, 'All 48 descriptions match across wired meta, Open Graph, Twitter and WebPage filters' );
check( United_SEO_Review\load_description_map( __DIR__ . '/missing-description-map.json' ) === array(), 'Missing local map safely returns no overrides' );
check( United_SEO_Review\decode_description_map( '{broken' ) === array()
    && United_SEO_Review\decode_description_map( '{"version":1,"posts":"invalid"}' ) === array(), 'Malformed JSON or structure returns no overrides' );
$invalid_entry = array( 'version' => 1, 'posts' => array( 'wrong-slug' => $evidence[ United_SEO_Review\AI_SLUG ] ) );
check( United_SEO_Review\decode_description_map( json_encode( $invalid_entry ) ) === array(), 'Mismatched slug/URL cannot replace another article description' );
$invalid_entry['posts'] = array( United_SEO_Review\AI_SLUG => $evidence[ United_SEO_Review\AI_SLUG ] );
$invalid_entry['posts'][ United_SEO_Review\AI_SLUG ]['description'] = '<b>' . $map[ United_SEO_Review\AI_SLUG ] . '</b>';
check( United_SEO_Review\decode_description_map( json_encode( $invalid_entry ) ) === array(), 'Markup is rejected instead of injected into metadata' );
$state = array( 'type' => 'post', 'slug' => 'not-mapped' );
check( United_SEO_Review\description( 'Keep original' ) === 'Keep original'
    && United_SEO_Review\webpage( array( 'description' => 'Keep original' ) )['description'] === 'Keep original', 'Unmapped articles retain original descriptions in meta and schema' );

$content = '<div>[et_pb_text]Texto e <a href="https://unitedidiomas.com">CTA existente</a>[/et_pb_text]</div>';
foreach ( United_SEO_Review\audited_slugs() as $slug ) {
    $state = array( 'type' => 'post', 'slug' => $slug );
    $result = United_SEO_Review\contextual_links( $content );
    check( strpos( $result, $content ) === 0 && strpos( $result, '/cursos/#live-class' ) !== false, 'Append relevant course link without rewriting original content: ' . $slug );
    check( United_SEO_Review\contextual_links( $result ) === $result, 'Contextual paragraph is idempotent: ' . $slug );
}
foreach ( array( array( 'main' => false ), array( 'loop' => false ), array( 'loop_id' => 99 ), array( 'status' => 'draft' ), array( 'password' => true ), array( 'slug' => 'unrelated-post' ), array( 'type' => 'page' ) ) as $override ) {
    $state = array_merge( array( 'type' => 'post', 'slug' => United_SEO_Review\AI_SLUG ), $override );
    check( United_SEO_Review\contextual_links( $content ) === $content, 'No contextual paragraph outside permitted published post: ' . json_encode( $override ) );
}

$filters = array();
$state = array();
define( 'REST_REQUEST', true );
United_SEO_Review\register_frontend_filters();
check( empty( $filters ), 'No filters on REST requests' );
echo $checks . " checks passed. These are isolated contracts, not a WordPress/Yoast installation test.\n";
