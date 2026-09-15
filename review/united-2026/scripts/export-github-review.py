"""Prepare the reviewed source package without replacing the production PHP tree."""
from pathlib import Path
from hashlib import sha256
import argparse, json, subprocess, zipfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
args = parser.parse_args()
allowed = {'dist', 'src', 'scripts', 'seo'}
files = [p for p in root.rglob('*') if p.is_file() and p.relative_to(root).parts[0] in allowed
         and '.openai' not in p.relative_to(root).parts and '__pycache__' not in p.parts]
files += [root / p for p in ['README.md','package.json','package-lock.json','vite.config.mjs','requirements-review.txt','CORRECAO-SERVIDOR.md','MANIFEST-SERVIDOR.json']]
prefix = 'review/united-2026/'
commit = subprocess.check_output(['git','rev-parse','--verify','HEAD'], cwd=root, text=True).strip()
manifest = {'source_commit':commit, 'target_repository':'RafaCarlos/united',
            'scope':'Review package only; production PHP, forms and hosting are not replaced.', 'files':[]}
args.output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(args.output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(files):
        name = file.relative_to(root).as_posix()
        data = file.read_bytes()
        archive.writestr(prefix+name, data)
        manifest['files'].append({'path':name,'bytes':len(data),'sha256':sha256(data).hexdigest()})
    archive.writestr(prefix+'MANIFEST.json', json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
with zipfile.ZipFile(args.output) as archive:
    assert archive.testzip() is None
print(json.dumps({'output':str(args.output.resolve()),'files':len(files)+1,'source_commit':commit,'bytes':args.output.stat().st_size}))
