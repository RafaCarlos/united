// Parse every plugin PHP file with a real PHP runtime, without executing the plugin.
import { runCLI } from '@wp-playground/cli';
import { fileURLToPath } from 'node:url';
const version = process.argv[2] || '7.4';
if (!['7.4','8.0','8.1','8.2','8.3','8.4','8.5'].includes(version)) throw new Error('Unsupported PHP version');
const code = `
$root='/plugin'; $files=[]; $errors=[];
foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS)) as $file) {
    if($file->isFile() && strtolower($file->getExtension())==='php') $files[]=$file->getPathname();
}
sort($files);
foreach($files as $file) {
    try { token_get_all(file_get_contents($file),TOKEN_PARSE); }
    catch(ParseError $error) { $errors[]=['file'=>substr($file,strlen($root)+1),'message'=>$error->getMessage(),'line'=>$error->getLine()]; }
}
echo json_encode(['php'=>PHP_VERSION,'files'=>count($files),'errors'=>$errors],JSON_PRETTY_PRINT).PHP_EOL;
exit(count($errors)?1:0);
`;
const exitCode = await runCLI({
  command:'php', _:['php','-r',code], php:version,
  wordpressInstallMode:'do-not-attempt-installing', skipSqliteSetup:true,
  mount:[{hostPath:fileURLToPath(new URL('../united-blog/',import.meta.url)),vfsPath:'/plugin'}],
  workers:1, quiet:true
});
process.exitCode = Number(exitCode || 0);
