// Disposable local WordPress, using the official Playground programmatic API.
// https://developer.wordpress.org/playground/handbook/guides/programmatic-playground-cli/
import { runCLI } from '@wp-playground/cli';
import { createServer } from 'node:http';
import { mkdir, writeFile, chmod } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

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
const siteUrl = `http://127.0.0.1:${httpPort}`;
const controlUrl = `http://127.0.0.1:${controlPort}`;
const plugin = fileURLToPath(new URL('../united-blog/', import.meta.url));
const tokenFile = process.env.UB26_CONTROL_TOKEN_FILE || path.join(os.tmpdir(), 'united-wordpress-control-token');
const infoFile = `${tokenFile}.runtime.json`;
const token = randomBytes(32).toString('hex');
const adminPassword = process.env.UB26_TEST_PASSWORD || randomBytes(18).toString('base64url');
await mkdir(path.dirname(tokenFile), { recursive: true });
await writeFile(tokenFile, token, { mode: 0o600 });
await chmod(tokenFile, 0o600);
const instance = await runCLI({
  command: 'server', php: process.env.UB26_PHP_VERSION || '8.3',
  wp: process.env.UB26_WP_VERSION || '7.1.3', port: httpPort,
  'site-url': siteUrl, login: false, workers: 1,
  internalCookieStore: false,
  mount: [{ hostPath: plugin, vfsPath: '/wordpress/wp-content/plugins/united-blog' }],
  blueprint: {
    steps: [
      { step: 'setSiteOptions', options: { blogname: 'UNITED · Blog de testes', blog_public: '0', permalink_structure: '/%postname%/' } },
      { step: 'runPHP', code: `<?php require '/wordpress/wp-load.php'; wp_update_user(['ID'=>1,'user_pass'=>base64_decode('${Buffer.from(adminPassword).toString('base64')}')]); flush_rewrite_rules();` }
    ]
  }
});
// Playground exposes no bind-host flag. Rebind its server to loopback before tests.
await new Promise((resolve, reject) => instance.server.close(error => error ? reject(error) : resolve()));
await new Promise((resolve, reject) => { instance.server.once('error', reject); instance.server.listen(httpPort, '127.0.0.1', resolve); });
const control = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  const auth = String(request.headers.authorization || '').replace(/^Bearer /, '');
  if (Buffer.byteLength(auth) !== Buffer.byteLength(token) || !timingSafeEqual(Buffer.from(auth), Buffer.from(token))) {
    response.writeHead(403); response.end('{"error":"forbidden"}'); return;
  }
  try {
    if (request.method === 'GET' && request.url === '/health') {
      const result = await instance.playground.run({ code: "<?php require '/wordpress/wp-load.php'; global $wpdb; echo wp_json_encode(['wordpress'=>get_bloginfo('version'),'php'=>PHP_VERSION,'site'=>home_url(),'database'=>get_class($wpdb),'plugins'=>get_option('active_plugins')]);" });
      response.end(JSON.stringify({status:'ready',text:result.text,errors:result.errors})); return;
    }
    if (request.method !== 'POST' || request.url !== '/php') { response.writeHead(404); response.end('{"error":"not_found"}'); return; }
    let body = '';
    for await (const chunk of request) { body += chunk; if (body.length > 4_000_000) throw new Error('Body too large'); }
    const data = JSON.parse(body);
    if (typeof data.code !== 'string') throw new Error('code string required');
    const result = await instance.playground.run({ code: data.code });
    response.end(JSON.stringify({text:result.text,errors:result.errors,exitCode:result.exitCode,httpStatusCode:result.httpStatusCode,headers:result.headers}));
  } catch (error) { response.writeHead(500); response.end(JSON.stringify({error:String(error.stack || error)})); }
});
await new Promise(resolve => control.listen(controlPort, '127.0.0.1', resolve));
await writeFile(infoFile, JSON.stringify({site:siteUrl,control:controlUrl,user:'admin',password:adminPassword,tokenFile},null,2), {mode:0o600});
await chmod(infoFile, 0o600);
console.log(`UNITED_RUNTIME_READY ${siteUrl}\nTemporary control token: ${tokenFile}\nLocal admin credentials: ${infoFile}`);
const stop = async () => { control.close(); await instance[Symbol.asyncDispose](); process.exit(0); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
