"""
Spec Compiler
---------------
Compiles Markdown specifications from the `spec/` directory into a single
`COMPILED_SPEC.md` file with a generated table of contents and normalized
heading levels. This preserves relative links by writing the compiled
document back into the `spec/` folder by default.

Usage:
  python tools/spec_compile.py [--src spec] [--out spec/COMPILED_SPEC.md]

Design notes:
- File discovery: all .md files under src (non-recursive by default) except
  files starting with COMPILED_ and README.md; include subfolders with --recursive.
- Ordering: if a file contains simple front matter with a line `order: <int>`,
  that value is used to sort; otherwise alphabetical by filename. Files named
  requirements.md, design.md, tasks.md are prioritized if present.
- Headings: demote all H1 (#) in source files by one level so the compiled
  document owns the single H1 at the top. Other levels preserved relative.
- TOC: built from headings after demotion; anchors follow GitHub-style slugs.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple


PRIORITY_FILENAMES = ["requirements.md", "design.md", "tasks.md"]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compile Markdown specs into one document")
    parser.add_argument("--src", default="spec", help="Source directory containing .md files")
    parser.add_argument(
        "--out",
        default="spec/COMPILED_SPEC.md",
        help="Output Markdown file path",
    )
    parser.add_argument(
        "--recursive",
        action="store_true",
        help="Include markdown files from subdirectories as well",
    )
    return parser.parse_args()


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def has_front_matter_order(text: str) -> Optional[int]:
    # Simple front matter detection without YAML dependency
    # Matches:
    # ---\n
    # key: value\n
    # order: 10\n
    # ---
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, flags=re.DOTALL)
    if not m:
        return None
    block = m.group(1)
    for line in block.splitlines():
        if line.strip().lower().startswith("order:"):
            try:
                return int(line.split(":", 1)[1].strip())
            except ValueError:
                return None
    return None


def natural_key(path: Path, order: Optional[int]) -> Tuple[int, int, str]:
    # Prioritize known filenames first, then front-matter order, then name
    name = path.name.lower()
    try:
        priority_index = PRIORITY_FILENAMES.index(name)
    except ValueError:
        priority_index = len(PRIORITY_FILENAMES)
    order_val = order if order is not None else 10_000
    return (priority_index, order_val, name)


def discover_markdown(src: Path, recursive: bool) -> List[Path]:
    if recursive:
        candidates = list(src.rglob("*.md"))
    else:
        candidates = list(src.glob("*.md"))

    files: List[Path] = []
    for p in candidates:
        if p.name.startswith("COMPILED_"):
            continue
        if p.name.lower() == "readme.md":
            continue
        files.append(p)
    return files


def demote_headings(text: str) -> str:
    # Demote all H1 to H2; keep code blocks intact
    out_lines: List[str] = []
    in_code = False
    fence = None
    for line in text.splitlines():
        if re.match(r"^```", line):
            if not in_code:
                in_code = True
                fence = line[:3]
            else:
                in_code = False
                fence = None
            out_lines.append(line)
            continue
        if in_code:
            out_lines.append(line)
            continue
        if line.startswith("# "):
            out_lines.append("## " + line[2:])
        else:
            out_lines.append(line)
    return "\n".join(out_lines) + "\n"


def slugify(text: str) -> str:
    s = text.strip().lower()
    # Remove backticks and other markdown syntax
    s = re.sub(r"[`*_~]", "", s)
    # Remove punctuation except spaces and hyphens
    s = re.sub(r"[^a-z0-9\-\s]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def extract_headings(text: str) -> List[Tuple[int, str]]:
    headings: List[Tuple[int, str]] = []
    in_code = False
    for line in text.splitlines():
        if re.match(r"^```", line):
            in_code = not in_code
            continue
        if in_code:
            continue
        m = re.match(r"^(#{2,6})\s+(.+?)\s*$", line)
        if m:
            level = len(m.group(1))
            title = m.group(2)
            headings.append((level, title))
    return headings


def build_toc(all_headings: List[Tuple[int, str]]) -> str:
    # Ensure unique anchors
    seen: Dict[str, int] = {}
    lines: List[str] = []
    for level, title in all_headings:
        anchor = slugify(title)
        count = seen.get(anchor, 0)
        seen[anchor] = count + 1
        if count:
            anchor = f"{anchor}-{count}"
        indent = "  " * (level - 2)
        lines.append(f"{indent}- [{title}](#{anchor})")
    return "\n".join(lines) + ("\n" if lines else "")


def main() -> int:
    args = parse_args()
    src = Path(args.src).resolve()
    out = Path(args.out)

    if not src.exists() or not src.is_dir():
        raise SystemExit(f"Source directory not found: {src}")

    files = discover_markdown(src, recursive=args.recursive)
    if not files:
        raise SystemExit(f"No markdown files found in {src}")

    enriched: List[Tuple[Path, Optional[int], str]] = []
    for p in files:
        text = read_text(p)
        order = has_front_matter_order(text)
        enriched.append((p, order, text))

    enriched.sort(key=lambda t: natural_key(t[0], t[1]))

    # Compile content
    compiled_parts: List[str] = []
    headings_all: List[Tuple[int, str]] = []

    # Header
    try:
        # Python 3.11+: prefer timezone-aware UTC
        now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    except AttributeError:  # fallback if timezone not available
        now = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    header = [
        "# Converge CRM – Compiled Specification",
        "",
        f"Generated: {now}",
        f"Source: {src.as_posix()}",
        "",
        "---",
        "",
    ]

    # Per-file processing
    for idx, (path, _ord, text) in enumerate(enriched, start=1):
        demoted = demote_headings(text)
        file_heading = f"## [{idx}] {path.name}"
        compiled_parts.append(file_heading)
        compiled_parts.append("")
        compiled_parts.append(demoted.rstrip("\n"))
        compiled_parts.append("")
        headings_all.extend(extract_headings(demoted))

    toc = [
        "## Table of Contents",
        "",
        build_toc(headings_all),
        "---",
        "",
    ]

    # Write output
    out_path = out if out.is_absolute() else (src / out.name) if out.parent == Path('.') else out
    out_path.parent.mkdir(parents=True, exist_ok=True)
    content = "\n".join(header + toc + compiled_parts).rstrip("\n") + "\n"
    out_path.write_text(content, encoding="utf-8")

    print(f"Compiled {len(enriched)} files -> {out_path}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
