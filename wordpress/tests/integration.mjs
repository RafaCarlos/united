// Runs against the disposable, loopback-only WordPress Playground test server.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
function testPort(name, fallback) {
  const value = process.env[name] || String(fallback);
  if (!/^\d+$/.test(value) || Number(value) < 1024 || Number(value) > 65535) {
    throw new Error(`${name} must be an integer between 1024 and 65535`);
  }
  return Number(value);
}
const httpPort = testPort('UB26_HTTP_PORT', 8794);
const controlPort = testPort('UB26_CONTROL_PORT', 8795);
if (httpPort === controlPort) throw new Error('HTTP and control ports must be different');
const base = `http://127.0.0.1:${httpPort}`;
const controlUrl = `http://127.0.0.1:${controlPort}`;
const token = (await fs.readFile(process.env.UB26_CONTROL_TOKEN_FILE || path.join(os.tmpdir(), 'united-wordpress-control-token'), 'utf8')).trim();
const results = [];
async function php(code) {
  const r = await fetch(`${controlUrl}/php`, {method:'POST', headers:{Authorization:`Bearer ${token}`, 'Content-Type':'application/json'}, body:JSON.stringify({code:`<?php require '/wordpress/wp-load.php'; ${code}`})});
  const data = await r.json();
  assert.ok(r.ok && !data.exitCode && !data.errors, JSON.stringify(data));
  return JSON.parse(data.text);
}
async function page(route, options) { const r = await fetch(base + route, options); return {response:r, html:await r.text()}; }
async function check(name, test) { await test(); results.push({name,passed:true}); console.log('PASS ' + name); }
const fixture = await php(`
if (wp_parse_url(home_url(), PHP_URL_HOST) !== '127.0.0.1') { throw new Exception('Local test site only'); }
require_once ABSPATH . 'wp-admin/includes/plugin.php';
wp_set_current_user(1);
$activation = activate_plugin('united-blog/united-blog.php');
if (is_wp_error($activation)) { throw new Exception($activation->get_error_message()); }
update_option('ub26_settings', array('enabled'=>false,'site_url'=>'https://www.unitedidiomas.com','contact'=>false,'tracking'=>false));
update_option('permalink_structure', '/%postname%/'); update_option('blog_public', '0');
$previous = get_option('ub26_test_posts', array()); foreach ($previous as $id) { wp_delete_post($id, true); }
$category = term_exists('carreira-teste', 'category'); if (!$category) { $category = wp_insert_term('Carreira e negócios', 'category', array('slug'=>'carreira-teste')); }
$term_id = (int) $category['term_id']; $ids=array();
for ($i=1; $i<=24; $i++) {
  $ids[] = wp_insert_post(array('post_title'=>'Inglês para reuniões: exemplo '.$i, 'post_name'=>'teste-artigo-'.$i,'post_status'=>'publish','post_type'=>'post','post_author'=>1,
    'post_date'=>sprintf('2025-01-%02d 12:00:00',$i), 'post_category'=>array($term_id),'post_excerpt'=>'Prática de conversação, confiança e streaming na United.',
    'post_content'=>'<!-- wp:paragraph --><p>Uma conversa com propósito abre novas oportunidades. Conteúdo de teste local com a palavra streaming.</p><!-- /wp:paragraph --><!-- wp:heading --><h2 class="wp-block-heading">Como praticar</h2><!-- /wp:heading --><!-- wp:paragraph --><p>Reserve um momento para escutar, conversar e aprender com o feedback.</p><!-- /wp:paragraph --><!-- wp:heading --><h2 class="wp-block-heading">Como praticar</h2><!-- /wp:heading --><!-- wp:list --><ul class="wp-block-list"><!-- wp:list-item --><li>Prepare seu vocabulário.</li><!-- /wp:list-item --></ul><!-- /wp:list -->'));
}
$private = wp_insert_post(array('post_title'=>'PRIVATE-NEVER-LIST','post_name'=>'teste-privado','post_status'=>'private','post_content'=>'PRIVATE-SECRET-CONTENT'));
$draft = wp_insert_post(array('post_title'=>'DRAFT-NEVER-LIST','post_name'=>'teste-rascunho','post_status'=>'draft','post_content'=>'DRAFT-SECRET-CONTENT'));
$protected = wp_insert_post(array('post_title'=>'Artigo protegido','post_name'=>'teste-protegido','post_status'=>'publish','post_password'=>'fixture-secret','post_content'=>'PROTECTED-SECRET-CONTENT'));
$other = wp_insert_post(array('post_title'=>'Página fora do blog','post_name'=>'pagina-fora','post_status'=>'publish','post_type'=>'page','post_content'=>'Página que conserva o tema original.'));
update_option('ub26_test_posts', array_merge($ids,array($private,$draft,$protected,$other))); flush_rewrite_rules();
echo wp_json_encode(array('posts'=>$ids,'protected'=>$protected,'draft'=>$draft,'private'=>$private,'category'=>$term_id));
`);
await check('Installation preserves current presentation until enabled', async()=> {
  const {html} = await page('/'); assert.doesNotMatch(html, /<body[^>]*united-blog-view/);
});
await check('Anonymous preview parameter does not enable the layout', async()=> {
  const {html} = await page('/?united_blog_preview=1'); assert.doesNotMatch(html, /<body[^>]*united-blog-view/);
});
const cookie = await php(`wp_set_current_user(1); echo wp_json_encode(LOGGED_IN_COOKIE.'='.wp_generate_auth_cookie(1,time()+3600,'logged_in'));`);
await check('Authenticated admin preview renders new layout with noindex and no-cache', async()=> {
  const {html,response} = await page('/?united_blog_preview=1',{headers:{Cookie:cookie}});
  assert.match(html, /<body[^>]*united-blog-view/); assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(response.headers.get('cache-control') || '', /no-cache|no-store/);
});
await php(`$o=ub26_settings();$o['enabled']=true;update_option('ub26_settings',$o);echo 'true';`);
await check('Published native posts render without duplication across featured and grid', async()=> {
  const {html,response} = await page('/'); assert.equal(response.status,200);
  assert.match(html, /<body[^>]*united-blog-view/); assert.match(html, /class="featured/);
  const links=[...html.matchAll(/<h[23][^>]*>\s*<a[^>]*href="([^"#]+)"/g)].map(m=>m[1]);
  assert.ok(links.length>=9); assert.equal(new Set(links).size,links.length);
  assert.doesNotMatch(html, /PRIVATE-NEVER-LIST|DRAFT-NEVER-LIST|PROTECTED-SECRET/);
  assert.doesNotMatch(html, /search-index\.json|127\.0\.0\.1:8790/);
});
await check('Native pagination, category and full-text search work without JavaScript', async()=> {
  for(const route of ['/page/2/','/category/carreira-teste/','/?s=streaming&post_type=post']) {
    const {html,response} = await page(route); assert.equal(response.status,200); assert.match(html,/teste-artigo-/);
  }
  const {html} = await page('/?s=notfound-uniquefixture&post_type=post'); assert.doesNotMatch(html, /class="article-card"/);
});
await check('Article content, unique table-of-contents IDs and one H1', async()=> {
  const {html,response}=await page('/teste-artigo-24/'); assert.equal(response.status,200);
  assert.match(html,/Uma conversa com propósito/); assert.match(html,/id="como-praticar"/); assert.match(html,/id="como-praticar-2"/);
  assert.equal((html.match(/<h1\b/g)||[]).length,1); assert.ok(html.includes('wp-block-list'));
});
await check('Password, private and draft content stay protected; REST/feed and pages keep WP routing', async()=> {
  const protectedPage=await page('/teste-protegido/'); assert.doesNotMatch(protectedPage.html,/PROTECTED-SECRET-CONTENT/); assert.match(protectedPage.html,/post_password/);
  for(const slug of ['teste-privado','teste-rascunho']) { const r=await page('/'+slug+'/'); assert.equal(r.response.status,404); }
  const other=await page('/pagina-fora/'); assert.doesNotMatch(other.html,/<body[^>]*united-blog-view/);
  const feed=await page('/feed/'); assert.match(feed.html,/<rss/); assert.doesNotMatch(feed.html,/class="featured/);
  const api=await fetch(base+'/?rest_route=/wp/v2/posts&per_page=1'); assert.ok(Array.isArray(await api.json()));
});
await check('Existing content remains unchanged; importer creates only two drafts and is idempotent', async()=> {
  const result = await php(`wp_set_current_user(1);$id=${fixture.posts[0]};$before=get_post($id)->post_content;$a=ub26_import_editorial();$b=ub26_import_editorial();
    $drafts=get_posts(array('post_type'=>'post','post_status'=>'any','meta_key'=>'_ub26_editorial_id','posts_per_page'=>10));
    echo wp_json_encode(array('first'=>$a,'second'=>$b,'unchanged'=>$before===get_post($id)->post_content,'posts'=>array_map(function($p){return array('status'=>$p->post_status,'cover'=>has_post_thumbnail($p),'blocks'=>count(parse_blocks($p->post_content)));},$drafts)));`);
  assert.equal(result.unchanged,true); assert.equal(result.first.errors.length,0); assert.equal(result.second.errors.length,0);
  assert.equal(result.posts.length,2); assert.equal(result.second.created.length,0);
  assert.ok(result.posts.every(p=>p.status==='draft'&&p.cover&&p.blocks>3));
});
await check('Importer rejects unprivileged execution and forged admin POST', async()=> {
  const result=await php(`wp_set_current_user(0); echo wp_json_encode(ub26_import_editorial());`); assert.ok(result.errors.length);
  const r=await fetch(base+'/wp-admin/admin-post.php',{method:'POST',body:new URLSearchParams({action:'ub26_import_editorial'}),redirect:'manual'});
  assert.ok(r.status>=300);
});
await check('Core SEO fallback has a single canonical, description and Article graph', async()=> {
  const {html}=await page('/teste-artigo-24/');
  assert.equal((html.match(/rel=['"]canonical['"]/g)||[]).length,1);
  assert.equal((html.match(/name=['"]description['"]/g)||[]).length,1);
  assert.equal((html.match(/"@type":"BlogPosting"/g)||[]).length,1);
});
await check('Campaign parameters do not pollute canonical or Open Graph URL', async()=> {
  const {html}=await page('/?utm_source=vendedores&fbclid=example');
  const canonical=html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical); assert.doesNotMatch(canonical[1],/utm_|fbclid|#038;/);
});
await check('Repeated cover is removed or retained once with its authored caption', async()=> {
  const r=await php(`$drafts=get_posts(array('post_type'=>'post','post_status'=>'draft','meta_key'=>'_ub26_editorial_id','posts_per_page'=>1));
    $cover=get_post_thumbnail_id($drafts[0]);$id=${fixture.posts[0]};set_post_thumbnail($id,$cover);$old=get_post($id)->post_content;
    $image='<img class="wp-image-'.$cover.'" src="'.wp_get_attachment_url($cover).'">';
    wp_update_post(array('ID'=>$id,'post_content'=>'<p>&nbsp;</p><p>'.$image.'</p><h1>Heading antigo</h1><p>Texto preservado.</p>'));
    $a=ub26_content($id);$first=array('hasImage'=>strpos($a,'wp-image-'.$cover)!==false,'showCover'=>ub26_has_cover($id),'h1'=>strpos($a,'<h1')!==false);
    wp_update_post(array('ID'=>$id,'post_content'=>'<div class="et_pb_text"><figure>'.$image.'<figcaption>Legenda preservada</figcaption></figure></div>'));
    $b=ub26_content($id);$second=array('hasCaption'=>strpos($b,'Legenda preservada')!==false,'showCover'=>ub26_has_cover($id));
    wp_update_post(array('ID'=>$id,'post_content'=>$old));echo wp_json_encode(array('first'=>$first,'second'=>$second));`);
  assert.deepEqual(r.first,{hasImage:false,showCover:true,h1:false}); assert.deepEqual(r.second,{hasCaption:true,showCover:false});
});
await check('Publishing another native post updates listing and search immediately', async()=> {
  await php(`$id=wp_insert_post(array('post_type'=>'post','post_status'=>'publish','post_title'=>'Novo artigo nativo de hoje','post_name'=>'teste-publicacao-nova','post_content'=>'Uma novidade exclusiva: nativepublishcheck.'));$ids=get_option('ub26_test_posts');$ids[]=$id;update_option('ub26_test_posts',$ids);echo wp_json_encode($id);`);
  assert.match((await page('/')).html,/Novo artigo nativo de hoje/);
  assert.match((await page('/?s=nativepublishcheck&post_type=post')).html,/Novo artigo nativo de hoje/);
});
const versions = await php(`echo wp_json_encode(array('wordpress'=>get_bloginfo('version'),'php'=>PHP_VERSION,'pluginVersion'=>UB26_VERSION));`);
const report={...versions,environment:'Disposable local WordPress Playground, SQLite; not production Divi',checks:results,externalFormsSubmitted:0};
await fs.mkdir(new URL('../reports/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../reports/integration.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:results.length,...versions}));
