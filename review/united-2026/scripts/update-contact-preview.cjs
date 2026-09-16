// Compatibility entry point: maintain all four pages with the current pipeline.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
for (const [script, ...args] of [['update-contact-layout.py'],['update-seo-performance.py'],['optimize-static-assets.py'],['prepare-subdirectory.py'],['audit-seo-performance.py'],['prepare-subdirectory.py','--refresh-manifests']]) {
  const result = spawnSync(process.env.UNITED_PYTHON || 'python3', [path.join(__dirname, script), ...args], { cwd:path.resolve(__dirname, '..'), stdio:'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
