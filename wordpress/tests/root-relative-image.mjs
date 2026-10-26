// Run the image-URL regression without WordPress, a database or HTTP requests.
import { runCLI } from '@wp-playground/cli';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
const checks = [];
for (const version of ['7.4', '8.3']) {
  const exitCode = await runCLI({
    command:'php', _:['php','-r',"define('UB26_TEST_PLUGIN','/plugin'); require '/tests/root-relative-image.php';"],
    php:version, wordpressInstallMode:'do-not-attempt-installing', skipSqliteSetup:true,
    mount:[
      {hostPath:fileURLToPath(new URL('../united-blog/',import.meta.url)),vfsPath:'/plugin'},
      {hostPath:fileURLToPath(new URL('./',import.meta.url)),vfsPath:'/tests'}
    ],
    workers:1, quiet:true
  });
  checks.push({php:version,passed:exitCode===0,cases:5});
  if (exitCode) { process.exitCode=Number(exitCode); break; }
}
await mkdir(new URL('../reports/',import.meta.url),{recursive:true});
await writeFile(new URL('../reports/root-relative-image.json',import.meta.url),JSON.stringify({
  scope:'Isolated image URL regression: origin, port, path, query and fragment',checks
},null,2)+'\n');
