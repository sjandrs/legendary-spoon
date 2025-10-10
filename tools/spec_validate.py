#!/usr/bin/env python3
"""
Spec Validator

Validates documentation in the repo according to .github/spec-driven-workflow-v1.instructions.md.

Checks performed (non-exhaustive but practical):
- Presence of core spec folder and key spec files
- Front matter existence with required keys for spec-design files
- Required artifacts presence: requirements.md, design.md, tasks.md (root or under spec/)
- Master spec contains key sections (by heading text)

Exit codes:
 0 = PASS (no blocking issues)
 1 = FAIL (one or more blocking issues)

This tool is dependency-free and uses only Python stdlib.
"""

from __future__ import annotations

import sys
import re
from pathlib import Path
from typing import List, Tuple, Set

ROOT = Path(__file__).resolve().parents[1]
SPEC_DIR = ROOT / "spec"
RULES_FILE = ROOT / ".github" / "spec-driven-workflow-v1.instructions.md"


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception as e:
        return ""


def has_front_matter(md: str, required_keys: List[str]) -> Tuple[bool, List[str]]:
    """Check for YAML-like front matter block at top with required keys (string presence)."""
    md = md.lstrip()
    if not md.startswith("---\n"):
        return False, required_keys[:]  # entire set missing
    end = md.find("\n---", 4)
    if end == -1:
        return False, required_keys[:]
    header = md[4:end]
    missing = []
    for key in required_keys:
        # simple presence check "key:" in header
        if re.search(rf"^\s*{re.escape(key)}\s*:\s*", header, re.MULTILINE) is None:
            missing.append(key)
    return len(missing) == 0, missing


def contains_headings(md: str, headings: List[str]) -> Tuple[bool, List[str]]:
    """Check that each heading exists, allowing optional numeric prefixes like '1.' or '2.1.'"""
    missing = []
    for h in headings:
        pattern = rf"^#+\s*(?:\d+(?:\.\d+)*\.\s*)?{re.escape(h)}\b"
        if re.search(pattern, md, re.IGNORECASE | re.MULTILINE) is None:
            missing.append(h)
    return len(missing) == 0, missing


def find_any(paths: List[Path], names: List[str]) -> List[Path]:
    """Find any files matching names under the given paths. Deduplicate results."""
    found: Set[Path] = set()
    for base in paths:
        for name in names:
            for p in base.rglob(name):
                try:
                    found.add(p.resolve())
                except Exception:
                    # Fallback to raw path if resolve fails
                    found.add(p)
    # Return stable, sorted list by POSIX path for consistency across OSes
    return sorted(found, key=lambda p: p.as_posix())


def main() -> int:
    issues: List[str] = []
    notes: List[str] = []

    # 1) Validate presence of rules
    if not RULES_FILE.exists():
        issues.append(f"Missing rules file: {RULES_FILE.relative_to(ROOT)}")
    else:
        notes.append("Rules file present: .github/spec-driven-workflow-v1.instructions.md")

    # 2) Validate spec directory and key files
    if not SPEC_DIR.exists():
        issues.append("Missing spec/ directory")
        # Without spec dir, many other checks are moot
    else:
        notes.append("spec/ directory present")
        master_spec = SPEC_DIR / "spec-design-master.md"
        accounting_spec = SPEC_DIR / "spec-design-accounting-expansion.md"
        process_spec = SPEC_DIR / "spec-process-lint-baseline-gating.md"

        for f in [master_spec, accounting_spec, process_spec]:
            if not f.exists():
                issues.append(f"Missing expected file: {f.relative_to(ROOT)}")
            else:
                notes.append(f"Found: {f.relative_to(ROOT)}")

        # 3) Front matter checks on design specs
        required_front_matter_keys = ["title", "version", "last_updated"]
        for f in [master_spec, accounting_spec]:
            if f.exists():
                content = read_text(f)
                ok, missing = has_front_matter(content, required_front_matter_keys)
                if not ok:
                    issues.append(
                        f"{f.relative_to(ROOT)}: front matter missing keys: {', '.join(missing)}"
                    )
                else:
                    notes.append(f"{f.relative_to(ROOT)}: front matter OK")

        # 4) Master spec required sections
        if master_spec.exists():
            md = read_text(master_spec)
            must_headings = [
                "Introduction",
                "Requirements, Constraints & Guidelines",
                "Interfaces & Data Contracts",
                "Error Handling",
            ]
            ok, missing = contains_headings(md, must_headings)
            if not ok:
                issues.append(
                    f"{master_spec.relative_to(ROOT)}: missing required sections: {', '.join(missing)}"
                )
            else:
                notes.append(f"{master_spec.relative_to(ROOT)}: core sections present")

        # 5) Required artifacts anywhere in repo
        required_artifacts = ["requirements.md", "design.md", "tasks.md"]
        found_artifacts = find_any([ROOT, SPEC_DIR], required_artifacts)
        found_names = {p.name.lower() for p in found_artifacts}
        for req in required_artifacts:
            if req not in found_names:
                issues.append(f"Required artifact missing: {req} (expected per workflow)")
        if found_artifacts:
            notes.append(
                "Found artifacts: "
                + ", ".join(str(p.relative_to(ROOT)) for p in sorted(found_artifacts))
            )

    # Report
    print("\n=== Spec Validation Report ===")
    if notes:
        print("\nInfo:")
        for n in notes:
            print(f"  - {n}")

    if issues:
        print("\nIssues (blocking):")
        for i in issues:
            print(f"  - {i}")
        # Use ASCII-only output for cross-platform console compatibility
        print("\nResult: FAIL")
        return 1
    else:
        # Use ASCII-only output for cross-platform console compatibility
        print("\nResult: PASS")
        return 0


if __name__ == "__main__":
    sys.exit(main())
