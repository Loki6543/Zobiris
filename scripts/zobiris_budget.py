#!/usr/bin/env python3
"""Read-only ZOBIRIS candidate-context estimator; NOT a Claude billing meter.

Exit codes: 0 = within policy, 2 = estimated over budget, 1 = invalid input.
No API/connector is called and no file is modified.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys
from pathlib import Path

CHARS_PER_TOKEN = 3.2  # conservative HEURISTIC; not an exact tokenizer
CACHE_MIN_FABLE = 512
SKIP_DIRS = {
    ".git", "node_modules", "vendor", "dist", "build", "coverage",
    ".next", ".nuxt", ".turbo", ".cache", "__pycache__", ".venv",
    "venv", "site-packages", "target", "out", "tmp", "temp",
}
SKIP_NAMES = {
    "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock",
    "bun.lockb", "Cargo.lock", "poetry.lock", "uv.lock",
}
EXTS = {
    ".py", ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx",
    ".go", ".rs", ".md", ".mdx", ".json", ".jsonl", ".yaml",
    ".yml", ".toml", ".ini", ".cfg", ".sql", ".sh", ".css",
    ".html", ".graphql", ".gql", ".dockerignore", ".gitignore",
}
EXACT_NAMES = {"Dockerfile", "CLAUDE.md", "Makefile", ".gitignore"}
# API list-price assumptions in USD per million tokens, as of Oct 2026.
PRICE = {
    "fable": {"input": 10.0, "output": 50.0,
              "cache5_write": 12.5, "cache1h_write": 20.0,
              "cache_read": 0.25},
    "sonnet": {"input": 2.0, "output": 10.0},
    "haiku_small": {"input": 0.10, "output": 0.50},
    "haiku_large": {"input": 0.50, "output": 2.50},
}


def estimate_tokens(text: str) -> int:
    return math.ceil(len(text) / CHARS_PER_TOKEN)


def safe_text_file(path: Path, root: Path, max_bytes: int) -> tuple[bool, str]:
    try:
        rp = path.resolve(strict=True)
        if not rp.is_relative_to(root) or not path.is_file() or path.is_symlink():
            return False, "outside repo, symlink, or not a regular file"
        if any(x in SKIP_DIRS for x in path.relative_to(root).parts[:-1]):
            return False, "generated/vendor directory"
        if path.name in SKIP_NAMES or path.name.endswith((".map", ".min.js")):
            return False, "lockfile or generated artifact"
        if path.name not in EXACT_NAMES and path.suffix.lower() not in EXTS:
            return False, "non-source extension"
        if rp.stat().st_size > max_bytes:
            return False, f"larger than {max_bytes} bytes"
        with rp.open("rb") as f:
            sample = f.read(4096)
        if b"\0" in sample:
            return False, "binary content"
        return True, ""
    except (OSError, ValueError) as exc:
        return False, f"unreadable: {exc}"


def candidate_paths(root: Path, target: str | None, changed: str | None):
    if changed is not None:
        cmd = ["git", "diff", "--name-only", "-z", "--diff-filter=ACMRT",
               f"{changed}...HEAD", "--"]
        proc = subprocess.run(cmd, cwd=root, stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE, check=False)
        if proc.returncode:
            error = proc.stderr.decode("utf-8", "replace").strip()
            raise ValueError(f"git diff failed: {error[:400]}")
        return [root / os.fsdecode(item) for item in proc.stdout.split(b"\0")
                if item]
    selected = (root / (target or ".")).resolve()
    if not selected.is_relative_to(root) or not selected.exists():
        raise ValueError("target must exist and remain inside current directory")
    if selected.is_file():
        return [selected]
    if not selected.is_dir():
        raise ValueError("target must be a file or directory")
    paths = []
    for base, dirs, files in os.walk(selected, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS
                         and not (Path(base) / d).is_symlink())
        paths.extend(Path(base) / filename for filename in sorted(files))
    return paths


def analyze(root: Path, target: str | None, changed: str | None,
            max_file_bytes: int, exact_tokens: int | None,
            output_tokens: int, max_files: int) -> dict:
    root = root.resolve(strict=True)
    included, skipped, total_chars = [], [], 0
    paths = candidate_paths(root, target, changed)
    if len(paths) > max_files:
        raise ValueError(f"too many candidates ({len(paths)} > {max_files}); narrow scope")
    for path in sorted(set(paths)):
        ok, reason = safe_text_file(path, root, max_file_bytes)
        rel = path.relative_to(root).as_posix() if path.is_relative_to(root) else str(path)
        if not ok:
            skipped.append({"path": rel, "reason": reason})
            continue
        try:
            content = path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            skipped.append({"path": rel, "reason": f"read error: {exc}"})
            continue
        total_chars += len(content)
        included.append({"path": rel, "chars": len(content),
                         "approx_tokens": estimate_tokens(content)})
    n = exact_tokens if exact_tokens is not None else math.ceil(
        total_chars / CHARS_PER_TOKEN)
    small = PRICE["haiku_small"] if n <= 100_000 else PRICE["haiku_large"]
    millions, outputs = n / 1_000_000, output_tokens / 1_000_000
    money = lambda rate, out=0: round(millions * rate + outputs * out, 6)
    return {
        "scope": changed and f"git diff {changed}...HEAD" or target or ".",
        "included_files": len(included), "skipped_files": len(skipped),
        "approx_input_tokens": n,
        "token_method": "exact override" if exact_tokens is not None
                        else "characters / 3.2 estimate",
        "cache_minimum_tokens": CACHE_MIN_FABLE,
        "cache_eligible_by_size_only": n >= CACHE_MIN_FABLE,
        "cache_hit_confirmed": False,
        "estimated_output_tokens": output_tokens,
        "cost_usd_model_only": {
            "fable_uncached": money(PRICE["fable"]["input"],
                                    PRICE["fable"]["output"]),
            "fable_5m_first_write": money(PRICE["fable"]["cache5_write"],
                                          PRICE["fable"]["output"]),
            "fable_1h_first_write": money(PRICE["fable"]["cache1h_write"],
                                          PRICE["fable"]["output"]),
            "fable_confirmed_cache_read_if_whole_prefix_reused": money(
                PRICE["fable"]["cache_read"], PRICE["fable"]["output"]),
            "sonnet_uncached": money(PRICE["sonnet"]["input"],
                                     PRICE["sonnet"]["output"]),
            "haiku_uncached": money(small["input"], small["output"]),
        },
        "largest_files": sorted(included, key=lambda f: f["chars"],
                                reverse=True)[:10],
        "skipped_examples": skipped[:10],
        "disclaimer": "Candidate files only; not exact context, not billing, "
                      "not a cache guarantee, and excludes tool/cloud charges.",
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    scopes = parser.add_mutually_exclusive_group()
    scopes.add_argument("--target", default=None, help="File or directory under cwd")
    scopes.add_argument("--changed-from", help="Git base branch/ref for ...HEAD")
    parser.add_argument("--max-fable-uncached", type=int, default=80_000)
    parser.add_argument("--max-file-bytes", type=int, default=250_000)
    parser.add_argument("--max-files", type=int, default=10_000)
    parser.add_argument("--exact-tokens", type=int, default=None,
                        help="Known token count; supersedes character estimate")
    parser.add_argument("--output-tokens", type=int, default=0)
    parser.add_argument("--json", action="store_true", help="Machine-readable result")
    a = parser.parse_args(argv)
    values = [a.max_fable_uncached, a.max_file_bytes, a.max_files]
    if any(n <= 0 for n in values) or a.output_tokens < 0 or (
            a.exact_tokens is not None and a.exact_tokens < 0):
        parser.error("budgets must be positive; token inputs cannot be negative")
    try:
        result = analyze(Path.cwd(), a.target, a.changed_from,
                         a.max_file_bytes, a.exact_tokens,
                         a.output_tokens, a.max_files)
    except (ValueError, OSError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    result["policy_limit"] = a.max_fable_uncached
    result["policy_exceeded"] = (result["approx_input_tokens"] >
                                 a.max_fable_uncached)
    if a.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print("ZOBIRIS - candidate context budget (ESTIMATE)")
        print(f"Scope: {result['scope']}")
        print(f"Files: {result['included_files']} included; "
              f"{result['skipped_files']} skipped)")
        print(f"Input: ~{result['approx_input_tokens']:,} tokens "
              f"({result['token_method']})")
        print("Fable cache minimum by size: "
              + ("eligible; hit NOT verified" if result[
                  "cache_eligible_by_size_only"] else "below threshold"))
        print("Illustrative model-only costs (USD; output assumption shown):")
        for name, cost in result["cost_usd_model_only"].items():
            print(f"  {name:<48} ${cost:.5f}")
        print(f"Output assumption: {a.output_tokens:,} tokens")
        print("Largest eligible files:")
        for f in result["largest_files"][:5]:
            print(f"  {f['approx_tokens']:>7,}  {f['path']}")
        if result["skipped_files"]:
            print("Warning: excluded files are not counted. Avoid loading "
                  "them into the model without a separate estimate.")
        print("STATUS: " + ("OVER PROJECT LIMIT" if result[
            "policy_exceeded"] else "within project estimate limit"))
    return 2 if result["policy_exceeded"] else 0


if __name__ == "__main__":
    sys.exit(main())
