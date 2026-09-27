from pathlib import Path
import json, math, re, subprocess
from collections import Counter

ROOT=Path("core")
OUT=Path("Zobiris_Core_Rebuild_Code_Sanitized.md")
MANIFEST=Path("Zobiris_Core_Rebuild_Code_Manifest.json")
REPORT=Path("Zobiris_Core_Rebuild_Sanitization_Report.txt")

EXCLUDED_PARTS={"node_modules","dist","dist-server","data",".git","coverage"}
EXCLUDED_NAMES={".env",".env.local",".env.production",".env.development"}
ALLOWED_EXT={".ts",".tsx",".js",".jsx",".json",".css",".html",".md",".yml",".yaml",".toml",".txt"}

PATTERNS=[
    (re.compile(r'(?i)(?:api[_-]?key|secret|token|password|passwd|private[_-]?key)\s*[:=]\s*([\"\'])[^\"\'\n]{6,}\1'), "[REDACTED_CREDENTIAL_ASSIGNMENT]"),
    (re.compile(r"AKIA[0-9A-Z]{16}"), "[REDACTED_AWS_KEY]"),
    (re.compile(r"sk-(?:proj-)?[A-Za-z0-9_-]{20,}"), "[REDACTED_API_KEY]"),
    (re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"), "[REDACTED_SLACK_TOKEN]"),
    (re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"), "[REDACTED_PRIVATE_KEY]"),
    (re.compile(r"https?://[^\s/@:]+:[^\s/@]+@[^\s]+"), "[REDACTED_CREDENTIAL_URL]"),
]

def entropy(s:str)->float:
    if not s: return 0.0
    n=len(s); counts=Counter(s)
    return -sum((v/n)*math.log2(v/n) for v in counts.values())

def main():
    files=[]
    for p in sorted(ROOT.rglob("*")):
        if not p.is_file(): continue
        if any(part in EXCLUDED_PARTS for part in p.parts): continue
        if p.name in EXCLUDED_NAMES or p.name.startswith(".env."): continue
        if p.suffix.lower() not in ALLOWED_EXT and p.name!="package.json": continue
        files.append(p)

    rendered=[]; suspicious=[]; replacements=0; total_lines=0
    for p in files:
        text=p.read_text("utf-8",errors="replace")
        for rx,repl in PATTERNS:
            text,n=rx.subn(repl,text)
            replacements+=n
        for m in re.finditer(r"(?<![A-Za-z0-9])[A-Za-z0-9_\-+/=]{32,}(?![A-Za-z0-9])",text):
            token=m.group(0)
            if len(token)>180: continue
            e=entropy(token)
            if e>=4.4 and not re.fullmatch(r"[0-9a-fA-F]{40,64}",token):
                suspicious.append({"file":str(p),"sample":token[:8]+"…","length":len(token),"entropy":round(e,2)})
        lang={".ts":"typescript",".tsx":"tsx",".js":"javascript",".jsx":"jsx",".json":"json",".css":"css",".html":"html",".md":"markdown",".yml":"yaml",".yaml":"yaml",".toml":"toml"}.get(p.suffix.lower(),"text")
        total_lines+=text.count("\n")+1
        rendered.append(f"## FILE: {p.as_posix()}\n\n```{lang}\n{text.rstrip()}\n```\n")

    commit=subprocess.check_output(["git","rev-parse","HEAD"],text=True).strip()
    header=f"""# Zobiris Core Rebuild — Sanitized Source Snapshot

- Source branch: `zobiris-core-rebuild`
- Source commit: `{commit}`
- Scope: canonical `core/` application source only
- Files: {len(files)}
- Lines: {total_lines}
- Generated with credential-pattern redaction and high-entropy review
- Excluded: environment files, dependencies, builds, databases, coverage, binary/generated artifacts

> This snapshot is for code review and handoff. It intentionally excludes secrets, private account data, local databases, deployment credentials, and generated dependencies.

"""
    OUT.write_text(header+"\n".join(rendered),"utf-8")
    MANIFEST.write_text(json.dumps({
        "source_branch":"zobiris-core-rebuild",
        "source_commit":commit,
        "file_count":len(files),
        "line_count":total_lines,
        "files":[{"path":str(p),"bytes":p.stat().st_size} for p in files],
        "redaction_replacements":replacements,
        "high_entropy_candidates":suspicious,
    },indent=2),"utf-8")
    REPORT.write_text(
        f"source_commit={commit}\nfile_count={len(files)}\nline_count={total_lines}\nredaction_replacements={replacements}\nhigh_entropy_candidates={len(suspicious)}\n"+
        "\n".join(f"{x['file']} | {x['sample']} | len={x['length']} | entropy={x['entropy']}" for x in suspicious),
        "utf-8"
    )
    print(REPORT.read_text())
    if suspicious:
        raise SystemExit("Unresolved high-entropy candidates require review")

if __name__=="__main__":
    main()
