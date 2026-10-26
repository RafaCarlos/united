import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const CleanCSS = require('clean-css');
const { minify } = require('terser');
const assets = new URL('../united-blog/assets/', import.meta.url);
const outputs = [];

// Keep readable sources alongside generated assets. Avoid level-2 CSS rule
// restructuring and property mangling so the approved cascade and SDK hooks stay intact.
for (const extension of ['css', 'js']) {
  const directory = new URL(`${extension}/`, assets);
  const names = (await readdir(directory)).filter(name => name.endsWith(`.${extension}`) && !name.endsWith(`.min.${extension}`)).sort();
  for (const name of names) {
    const input = await readFile(new URL(name, directory), 'utf8');
    let output;
    if (extension === 'css') {
      const result = new CleanCSS({ level: 1, rebase: false, format: false }).minify(input);
      if (result.errors.length) throw new Error(`${name}: ${result.errors.join('; ')}`);
      for (const warning of result.warnings) console.warn(`${name}: ${warning}`);
      output = result.styles;
    } else {
      const result = await minify({ [name]: input }, {
        compress: { passes: 1, unsafe: false },
        mangle: { toplevel: false },
        format: { comments: /^!/ },
        sourceMap: false,
      });
      if (typeof result.code !== 'string' || !result.code.length) throw new Error(`${name}: empty minifier output`);
      output = result.code;
    }
    const destination = new URL(name.replace(new RegExp(`\\.${extension}$`), `.min.${extension}`), directory);
    outputs.push({ destination, output: `${output}\n`, source: input, name });
  }
}

// Finish processing every source before replacing generated files.
let before = 0;
let after = 0;
let gzipBefore = 0;
let gzipAfter = 0;
for (const asset of outputs) {
  await writeFile(asset.destination, asset.output);
  const sourceBytes = Buffer.byteLength(asset.source);
  const outputBytes = Buffer.byteLength(asset.output);
  before += sourceBytes;
  after += outputBytes;
  gzipBefore += gzipSync(asset.source).length;
  gzipAfter += gzipSync(asset.output).length;
  console.log(`${asset.name}: ${sourceBytes} → ${outputBytes} bytes`);
}
console.log(`Built ${outputs.length} assets in ${fileURLToPath(assets)}`);
console.log(`Total: ${before} → ${after} bytes (${((1 - after / before) * 100).toFixed(1)}% smaller); gzip: ${gzipBefore} → ${gzipAfter} bytes.`);
