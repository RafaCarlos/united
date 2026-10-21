// Create an editorial draft without overwriting any existing content.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [slug, ...titleParts] = process.argv.slice(2);
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !titleParts.length) {
  throw new Error('Uso: npm run blog:novo -- meu-novo-artigo "Título completo do artigo"');
}
const editorial = path.join(root, 'src/blog/editorial');
await fs.mkdir(editorial, { recursive: true });
const manifest = path.join(editorial, 'articles.json');
const articles = JSON.parse(await fs.readFile(manifest, 'utf8'));
const imported = JSON.parse(await fs.readFile(path.join(root, 'src/blog/content-source.json'), 'utf8'));
const release = JSON.parse(await fs.readFile(path.join(root, 'src/tools/united-release.json'), 'utf8'));
if ([...articles, ...imported.articles, release].some(a => a.slug === slug || a.id === `editorial-${slug}`)) throw new Error('Já existe artigo com esse slug ou ID. Escolha outro.');
const filename = `${slug}.html`;
const body = await fs.readFile(path.join(root, 'editorial/modelos/corpo-artigo.html'), 'utf8');
await fs.writeFile(path.join(editorial, filename), body, { flag: 'wx' });
const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
const model = JSON.parse(await fs.readFile(path.join(root, 'editorial/modelos/metadados-artigo.json'), 'utf8'));
articles.push({ ...model, id:`editorial-${slug}`, slug, title:titleParts.join(' '), date:day, modified:day, bodyFile:filename });
await fs.writeFile(manifest, JSON.stringify(articles, null, 2) + '\n');
console.log(`Rascunho criado em src/blog/editorial/${filename}. Complete metadados, corpo e imagens antes de mudar status para local-draft.`);
