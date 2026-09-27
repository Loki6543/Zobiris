from pathlib import Path
import os, re, hashlib, json, datetime

root = Path('/tmp/zobiris-effective')
repo = Path(os.environ['GITHUB_WORKSPACE'])
outdir = repo / 'export'
outdir.mkdir(exist_ok=True)
out = outdir / 'Zobiris_Current_Code_Sanitized.md'
manifest = outdir / 'Zobiris_Current_Code_Manifest.json'
report = outdir / 'Zobiris_Sanitization_Report.txt'
source_commit = os.environ['SOURCE_COMMIT']

include_roots = [root/'src', root/'scripts', root/'verification']
include_files = [
    root/'package.json', root/'tsconfig.json', root/'tsconfig.production.json',
    root/'vite.config.ts', root/'vite.qa.config.ts', root/'vitest.config.ts',
    root/'index.html', root/'components.json',
    repo/'Dockerfile', repo/'railway.json', repo/'railway_persistence_wrapper.mjs',
    repo/'railway_hosted_gate.mjs',
]
excluded_dirs = {'.git','.github','node_modules','dist','build','coverage','public','.strategy21-dist','.cache','.vite'}
excluded_suffixes = {'.zip','.gz','.xz','.txz','.tar','.tgz','.b64','.db','.sqlite','.sqlite3','.png','.jpg','.jpeg','.gif','.webp','.ico','.pdf','.woff','.woff2','.ttf','.otf','.mp4','.mov','.bin','.wasm'}
excluded_names = {'.env','.env.local','.env.production','.env.development','package-lock.json','pnpm-lock.yaml','yarn.lock'}

files=[]
for base in include_roots:
    if not base.exists():
        continue
    for p in base.rglob('*'):
        if not p.is_file():
            continue
        if set(p.relative_to(root).parts) & excluded_dirs:
            continue
        if p.name in excluded_names or p.suffix.lower() in excluded_suffixes:
            continue
        files.append(('effective_app/'+p.relative_to(root).as_posix(), p))
for p in include_files:
    if p.exists() and p.is_file():
        is_repo = p.is_relative_to(repo)
        prefix = 'deployment/' if is_repo else 'effective_app/'
        rel = p.relative_to(repo if is_repo else root).as_posix()
        files.append((prefix+rel,p))
files = sorted(dict(files).items(), key=lambda x:x[0].lower())

email_re = re.compile(r'\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b', re.I)
url_cred_re = re.compile(r'(?i)(https?://)([^\s/@:]+):([^\s/@]+)@')
assign_re = re.compile(r'''(?i)(\b(?:api[_-]?key|secret(?:_key)?|token|password|passwd|private[_-]?key|client[_-]?secret)\b\s*[:=]\s*)(["'])([^"']+)(["'])''')
bearer_re = re.compile(r'''(?i)(authorization\s*[:=]\s*["']?bearer\s+)([A-Za-z0-9._~+/=-]{12,})''')
high_entropy_re = re.compile(r'(?i)(sk-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)')

replacements=0
flagged=[]
total_lines=0
rows=[]

def sanitize(text, display):
    global replacements
    text,n=email_re.subn('[REDACTED_EMAIL]',text); replacements+=n
    text,n=url_cred_re.subn(r'\1[REDACTED_CREDENTIALS]@',text); replacements+=n
    def sub_assign(m):
        global replacements
        value=m.group(3)
        safe=(value.startswith('$'+'{') or value.startswith('<') or 'REDACTED' in value.upper() or 'placeholder' in value.lower() or 'example' in value.lower() or value.lower() in {'true','false','null','undefined','none'})
        if safe:
            return m.group(0)
        replacements+=1
        return m.group(1)+m.group(2)+'[REDACTED]'+m.group(4)
    text=assign_re.sub(sub_assign,text)
    text,n=bearer_re.subn(r'\1[REDACTED_BEARER_TOKEN]',text); replacements+=n
    if high_entropy_re.search(text):
        flagged.append(display)
        text,n=high_entropy_re.subn('[REDACTED_HIGH_ENTROPY_SECRET]',text); replacements+=n
    return text

def lang(p):
    return {'.ts':'typescript','.tsx':'tsx','.js':'javascript','.mjs':'javascript','.cjs':'javascript','.json':'json','.md':'markdown','.css':'css','.html':'html','.yml':'yaml','.yaml':'yaml','.toml':'toml','.sh':'bash','.py':'python'}.get(p.suffix.lower(),'')

sections=[]
for display,p in files:
    try:
        raw=p.read_text('utf-8')
    except UnicodeDecodeError:
        continue
    clean=sanitize(raw,display)
    lines=clean.count('\n')+1
    total_lines+=lines
    rows.append({'path':display,'sha256_sanitized':hashlib.sha256(clean.encode()).hexdigest(),'bytes':len(clean.encode()),'lines':lines})
    sections.append(f'## {display}\n\n````{lang(p)}\n{clean.rstrip()}\n````\n')

generated=datetime.datetime.now(datetime.timezone.utc).isoformat()
header=f'''# Zobiris — Current Effective Code Snapshot (Sanitized)\n\n**Production source checkpoint:** {source_commit}  \n**Generated:** {generated}  \n\nThis is a human-readable snapshot of the first-party source and deployment configuration used to build the current Zobiris production application.\n\n## Security / export policy\n\nExcluded: environment files and runtime variable values; credentials and suspicious secret literals; SQLite/database files and persisted account data; binary archives/media/fonts/WASM; encoded staging payloads; dependency trees and lock files; generated browser bundles. Environment-variable names and code that reads them are intentionally retained as part of the software interface.\n\n## Effective-build reconstruction\n\nThe export mirrors the production build order: v0.7.6 staging baseline → v076 overrides → production patch → audit-fixes → prediction overrides → canonical hosted release gate.\n\n## Included file index\n\n'''
index='\n'.join('- '+r['path'] for r in rows)
out.write_text(header+index+'\n\n---\n\n'+'\n'.join(sections),'utf-8')
manifest.write_text(json.dumps({'source_commit':source_commit,'generated_at_utc':generated,'file_count':len(rows),'line_count':total_lines,'sanitization_replacements':replacements,'flagged_high_entropy_files':sorted(set(flagged)),'files':rows},indent=2)+'\n','utf-8')
report.write_text(f'source_commit={source_commit}\nfile_count={len(rows)}\nline_count={total_lines}\nsanitization_replacements={replacements}\nflagged_high_entropy_files={",".join(sorted(set(flagged)))}\n','utf-8')
print(report.read_text())
