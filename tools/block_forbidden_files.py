#!/usr/bin/env python3
"""
Pre-commit blocking hook: prevents committing forbidden files that should be ignored
or handled via artifacts. Fails if any staged path matches the forbidden patterns.

Forbidden (configurable here):
- db.sqlite3
- coverage artifacts (coverage/, frontend/coverage/)
- Python bytecode: __pycache__/, *.pyc, *.pyo
- Backup files: *.backup

Exit 1 when violations are found and print a helpful message.
"""
from __future__ import annotations
import os
import re
import subprocess
import sys
from typing import List

FORBIDDEN_PATTERNS: List[re.Pattern] = [
    re.compile(r"(^|/)db\.sqlite3$"),
    re.compile(r"(^|/)coverage(/|$)"),
    re.compile(r"(^|/)frontend/coverage(/|$)"),
    re.compile(r"(^|/)__pycache__(/|$)"),
    re.compile(r"\.pyc$"),
    re.compile(r"\.pyo$"),
    re.compile(r"\.backup$"),
]


def get_staged_files() -> List[str]:
    try:
        out = subprocess.check_output(["git", "diff", "--cached", "--name-only"], text=True)
    except Exception as e:
        print(f"Error: unable to list staged files: {e}")
        return []
    return [line.strip() for line in out.splitlines() if line.strip()]


def main() -> int:
    staged = get_staged_files()
    if not staged:
        return 0

    violations: List[str] = []
    for path in staged:
        for pat in FORBIDDEN_PATTERNS:
            if pat.search(path):
                violations.append(path)
                break

    if violations:
        print("Commit blocked: forbidden files detected (should not be tracked):\n")
        for v in violations:
            print(f"  - {v}")
        print("\nRemediation:")
        print("  1) Unstage: git restore --staged <path>  (or \"git reset HEAD <path>\")")
        print("  2) Ensure .gitignore covers this path (already configured for coverage/db/pyc)")
        print("  3) If needed, remove from index without deleting locally: git rm --cached -r -- <path>")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
