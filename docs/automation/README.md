# Automation: Generate Issues and Milestones

This folder contains tools to convert our spec into actionable GitHub milestones and issues.

Contents
- `create_issues_and_milestones.ps1`: Creates milestones and key phase issues, plus API parity checklist issues. Can also import generated issues from CSV.
- `generate_issues_from_spec.py`: Parses `spec/spec-lineup-cannon-features-60.md` and emits issue markdowns for phases and deliverables, along with a CSV index used by the PowerShell script.

Prerequisites
- GitHub CLI installed and authenticated: `gh auth login`
- Windows PowerShell 5+ (these scripts are tested on Windows)
- Python 3.11+ available in PATH

Quick start
1) Generate issues from the spec (dry run optional)
```
python docs/automation/generate_issues_from_spec.py --spec spec/spec-lineup-cannon-features-60.md --out docs/issues/generated --dry-run
python docs/automation/generate_issues_from_spec.py --spec spec/spec-lineup-cannon-features-60.md --out docs/issues/generated
```

2) Create milestones and core issues; then import generated issues
```
pwsh -NoLogo -File docs/automation/create_issues_and_milestones.ps1 -Repo sjandrs/legendary-spoon
pwsh -NoLogo -File docs/automation/create_issues_and_milestones.ps1 -Repo sjandrs/legendary-spoon -ImportGenerated
```

Notes
- The PowerShell script omits `due_on` in milestones to avoid GitHub plan limitations (HTTP 422). Due dates are tracked in docs and can be set manually if needed.
- Labels (api, parity) are created on best-effort basis. If your account lacks permission, the script proceeds without labels.
- The CSV index is written to `docs/automation/generated_issues_index.csv` by the generator.

Troubleshooting
- If you see `The filename, directory name, or volume label syntax is incorrect` while creating issues, verify that `--body-file` is used (the script already does) and the path contains no unescaped characters.
- If labels are missing, create them in the repo UI or run `gh label create` manually, then re-run the import.
