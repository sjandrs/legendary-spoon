"""
Generate GitHub issue markdown files from the canonical lineup spec.

Parses spec/spec-lineup-cannon-features-60.md to produce:
- One parent issue per phase with sections copied from the spec
- One child issue per deliverable bullet under each phase
- An index CSV mapping each generated file to its intended milestone

Usage:
  python docs/automation/generate_issues_from_spec.py --spec spec/spec-lineup-cannon-features-60.md --out docs/issues/generated

Flags:
  --dry-run   Print what would be generated without writing files

Outputs:
  docs/issues/generated/
  docs/automation/generated_issues_index.csv
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple


PHASE_MILESTONE_TITLES = {
    1: "Phase 1 - Canonical API Parity Baseline",
    2: "Phase 2 - Finance and Budget V2 Completion",
    3: "Phase 3 - Technician and User Mgmt Frontend",
    4: "Phase 4 - Field Service Mgmt Frontend",
    5: "Phase 5 - Advanced Analytics Parity",
    6: "Phase 6 - Test Coverage Uplift",
    7: "Phase 7 - Internationalization and Localization",
    8: "Phase 8 - Security, Compliance and Privacy",
    9: "Phase 9 - Performance and Scalability",
    10: "Phase 10 - Observability and SRE Readiness",
    11: "Phase 11 - Integrations and Data Migration",
    12: "Phase 12 - Documentation, UAT and Release Hardening",
}


@dataclass
class Phase:
    number: int
    title: str
    percent: Optional[str]
    focus: Optional[str] = None
    deliverables: List[str] = field(default_factory=list)
    acceptance: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    risks: List[str] = field(default_factory=list)

    @property
    def milestone(self) -> str:
        return PHASE_MILESTONE_TITLES.get(self.number, f"Phase {self.number}")


PHASE_HEADER_RE = re.compile(r"^##\s*Phase\s+(?P<num>\d+)\s*[—-]\s*(?P<title>.+?)(?:\s*~(?P<pct>\d+%)\s*)?$", re.IGNORECASE)


def parse_spec(text: str) -> List[Phase]:
    lines = text.splitlines()
    phases: List[Phase] = []
    i = 0
    current: Optional[Phase] = None
    section: Optional[str] = None

    def commit_current():
        if current is not None:
            phases.append(current)

    while i < len(lines):
        line = lines[i].rstrip()
        m = PHASE_HEADER_RE.match(line)
        if m:
            # Start new phase
            if current:
                commit_current()
            num = int(m.group("num"))
            title = m.group("title").strip()
            pct = m.group("pct")
            current = Phase(number=num, title=title, percent=pct)
            section = None
            i += 1
            continue

        if current:
            # Determine section markers
            if re.match(r"^Focus:\s*(.*)$", line, re.IGNORECASE):
                focus_text = re.sub(r"^Focus:\s*", "", line, flags=re.IGNORECASE).strip()
                current.focus = focus_text
                section = None
                i += 1
                continue
            elif re.match(r"^Deliverables\s*$", line, re.IGNORECASE):
                section = "deliverables"
                i += 1
                continue
            elif re.match(r"^Acceptance Criteria\s*$", line, re.IGNORECASE):
                section = "acceptance"
                i += 1
                continue
            elif re.match(r"^Dependencies\s*$", line, re.IGNORECASE):
                section = "dependencies"
                i += 1
                continue
            elif re.match(r"^Risks\s*$", line, re.IGNORECASE):
                section = "risks"
                i += 1
                continue

            # Collect bullets for current section
            if section and line.strip().startswith("-"):
                bullet = line.strip()
                # Normalize to a single dash and space
                bullet = re.sub(r"^[-*]\s*", "- ", bullet)
                if section == "deliverables":
                    current.deliverables.append(bullet)
                elif section == "acceptance":
                    current.acceptance.append(bullet)
                elif section == "dependencies":
                    current.dependencies.append(bullet)
                elif section == "risks":
                    current.risks.append(bullet)
                i += 1
                continue

        i += 1

    if current:
        commit_current()

    return phases


def slugify(text: str) -> str:
    text = text.lower().strip()
    # Remove markdown dashes from bullet prefix and parentheses content
    text = re.sub(r"^[-*]\s*", "", text)
    text = re.sub(r"\([^)]*\)", "", text)
    # Replace non-alphanum with hyphens
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text[:80]


def generate_issue_markdown(phase: Phase) -> Tuple[str, str]:
    title = f"Phase {phase.number} — {phase.title}"
    body_lines: List[str] = []
    body_lines.append(f"Milestone: {phase.milestone}")
    if phase.percent:
        body_lines.append(f"Estimate: ~{phase.percent} towards 60% goal")
    if phase.focus:
        body_lines.append("")
        body_lines.append(f"Focus: {phase.focus}")
    if phase.deliverables:
        body_lines.append("")
        body_lines.append("Deliverables")
        body_lines.extend(phase.deliverables)
    if phase.acceptance:
        body_lines.append("")
        body_lines.append("Acceptance Criteria")
        body_lines.extend(phase.acceptance)
    if phase.dependencies:
        body_lines.append("")
        body_lines.append("Dependencies")
        body_lines.extend(phase.dependencies)
    if phase.risks:
        body_lines.append("")
        body_lines.append("Risks")
        body_lines.extend(phase.risks)
    body = "\n".join(body_lines) + "\n"
    return title, body


def main(argv: Optional[List[str]] = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--spec", required=True, help="Path to the lineup spec markdown")
    p.add_argument("--out", default="docs/issues/generated", help="Output directory for issues")
    p.add_argument("--dry-run", action="store_true", help="Do not write files; print summary only")
    args = p.parse_args(argv)

    spec_path = Path(args.spec)
    if not spec_path.exists():
        print(f"Spec file not found: {spec_path}", file=sys.stderr)
        return 2

    text = spec_path.read_text(encoding="utf-8")
    phases = parse_spec(text)
    if not phases:
        print("No phases found in spec", file=sys.stderr)
        return 3

    out_dir = Path(args.out)
    parent_dir = out_dir / "parents"
    child_dir = out_dir / "deliverables"
    if not args.dry_run:
        parent_dir.mkdir(parents=True, exist_ok=True)
        child_dir.mkdir(parents=True, exist_ok=True)

    index_rows: List[Dict[str, str]] = []

    for ph in phases:
        title, body = generate_issue_markdown(ph)
        parent_filename = f"{ph.number:02d}0-phase{ph.number}-plan.md"
        parent_path = parent_dir / parent_filename
        if args.dry_run:
            print(f"[plan] Would write parent issue: {parent_path} -> {title}")
        else:
            parent_path.write_text(f"# {title}\n\n{body}", encoding="utf-8")
            index_rows.append({
                "file_path": str(parent_path).replace("\\", "/"),
                "milestone": ph.milestone,
                "title_override": title,
            })

        # Deliverable child issues
        for idx, bullet in enumerate(ph.deliverables, start=1):
            deliverable_text = re.sub(r"^[-*]\s*", "", bullet).strip()
            child_title = f"Phase {ph.number} — {deliverable_text}"
            slug = slugify(deliverable_text)
            child_filename = f"{ph.number:02d}{idx:02d}-phase{ph.number}-deliverable-{slug}.md"
            child_path = child_dir / child_filename
            child_body_lines = [
                f"Parent: {title}",
                f"Milestone: {ph.milestone}",
                "",
                "Acceptance Criteria",
            ]
            # Include the phase acceptance criteria as a starting point
            if ph.acceptance:
                child_body_lines.extend(ph.acceptance)
            else:
                child_body_lines.append("- [ ] Define specific acceptance criteria for this deliverable")
            child_body = "\n".join(child_body_lines) + "\n"

            if args.dry_run:
                print(f"[plan] Would write deliverable: {child_path} -> {child_title}")
            else:
                child_path.write_text(f"# {child_title}\n\n{child_body}", encoding="utf-8")
                index_rows.append({
                    "file_path": str(child_path).replace("\\", "/"),
                    "milestone": ph.milestone,
                    "title_override": child_title,
                })

    if args.dry_run:
        print("[plan] Dry run complete; no files written")
        return 0

    # Write index CSV
    index_csv = Path("docs/automation/generated_issues_index.csv")
    with index_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["file_path", "milestone", "title_override"])
        writer.writeheader()
        for row in index_rows:
            writer.writerow(row)

    print(f"Wrote {len(index_rows)} generated issue entries to {index_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
