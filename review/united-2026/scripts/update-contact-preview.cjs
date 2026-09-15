// Compatibility entry point: maintain all four pages with the current pipeline.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
for (const script of ['update-contact-layout.py','update-seo-performance.py','optimize-static-assets.py','audit-seo-performance.py']) {
  const result = spawnSync(process.env.UNITED_PYTHON || 'python3', [path.join(__dirname, script)], { cwd:path.resolve(__dirname, '..'), stdio:'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
