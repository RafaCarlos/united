// Inventory the review payload, excluding generated previews and dependencies.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(['node_modules', 'preview', '.git', '__pycache__', '.DS_Store']);
async function walk(directory, prefix = '') {
  const result = [];
  for (const entry of await fs.readdir(directory, {withFileTypes:true})) {
    if (excluded.has(entry.name) || /\.pyc$|\.zip$|\.tmp-/.test(entry.name)) continue;
    const relative = prefix + entry.name;
    if (relative === 'MANIFESTO.json') continue;
    if (entry.isSymbolicLink()) throw new Error('Symlink is not a delivery file: ' + relative);
    if (entry.isDirectory()) result.push(...await walk(path.join(directory,entry.name),relative+'/'));
    else if (entry.isFile()) result.push(relative);
  }
  return result.sort();
}
// Reports remain portable and do not disclose a developer's local directory.
function portable(value) {
  if (typeof value === 'string') return value === root ? '.' : value.startsWith(root+path.sep) ? value.slice(root.length+1) : value;
  if (Array.isArray(value)) return value.map(portable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,portable(item)]));
  return value;
}
const names = await walk(root);
for (const name of names.filter(name =>
  (name.startsWith('reports/') && name.endsWith('.json')) ||
  /^src\/blog\/evidence\/blog-complete-.*-audit\.json$/.test(name)
)) {
  const filename = path.join(root,name);
  const data = portable(JSON.parse(await fs.readFile(filename,'utf8')));
  await fs.writeFile(filename,JSON.stringify(data,null,2)+'\n');
}
const files = [];
for (const name of names) {
  const data = await fs.readFile(path.join(root,name));
  files.push({file:name,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
}
await fs.writeFile(path.join(root,'MANIFESTO.json'),JSON.stringify({version:1,scope:'Git review payload; excludes this manifest, preview and dependencies',fileCount:files.length,files},null,2)+'\n');
console.log(JSON.stringify({manifest:'MANIFESTO.json',files:files.length}));
