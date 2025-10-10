#!/usr/bin/env python3
"""
Validate test files for import hygiene:
- All import statements must be at the top of the file (before code/describe/it blocks)
- No duplicate import React (or repeated import statements) blocks

Heuristics (safe and fast):
- Consider files matching /__tests__/.*\.(js|jsx|ts|tsx)$ or *.test.*
- Scan lines until first non-import, non-empty, non-comment line; after that, any 'import ' is a violation
- Count occurrences of lines starting with 'import React' for duplicates
"""
from __future__ import annotations
import os
import re
import subprocess
import sys
from typing import List

TEST_FILE_RE = re.compile(r"(^|/)(__tests__/.*\.(jsx?|tsx?)$|.*\.test\.(jsx?|tsx?)$)")

def get_staged_files() -> List[str]:
    out = subprocess.check_output(["git", "diff", "--cached", "--name-only"], text=True)
    return [l.strip() for l in out.splitlines() if l.strip()]

def is_test_file(path: str) -> bool:
    return bool(TEST_FILE_RE.search(path.replace("\\", "/")))

def validate_file(path: str) -> List[str]:
    violations: List[str] = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception:
        return violations

    # Track if we've left the import header region
    import_region = True
    import_re = re.compile(r"^\s*import\s+")
    react_import_re = re.compile(r"^\s*import\s+React(\s|,)"
                                 r"|^\s*import\s+\*\s+as\s+React\s+from\s+['\"]react['\"];?")
    react_import_count = 0

    for idx, raw in enumerate(lines):
        line = raw.rstrip("\n")
        # Skip empty lines and comments in header
        if import_region:
            if import_re.match(line):
                if react_import_re.search(line):
                    react_import_count += 1
                continue
            if line.strip() == "" or line.strip().startswith("//") or line.strip().startswith("/*"):
                continue
            # First non-import/code line ends import region
            import_region = False
        else:
            if import_re.match(line):
                violations.append(f"Nested import after code at line {idx+1}")

    if react_import_count > 1:
        violations.append(f"Duplicate import React ({react_import_count} occurrences)")

    return violations

def main() -> int:
    staged = get_staged_files()
    test_files = [p for p in staged if is_test_file(p)]
    all_violations: List[str] = []
    for p in test_files:
        vs = validate_file(p)
        if vs:
            all_violations.append(f"{p}:")
            for v in vs:
                all_violations.append(f"  - {v}")

    if all_violations:
        print("Pre-commit: test import hygiene violations detected:\n")
        print("\n".join(all_violations))
        print("\nFix: Move all imports to file top and remove duplicates.")
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
