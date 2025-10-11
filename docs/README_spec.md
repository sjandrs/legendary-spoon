# Compiled Specification: Usage and CI Artifacts

This guide documents how to compile the specification locally, download the compiled artifact from CI, view it on GitHub Pages, and find it attached to GitHub Releases.

## Local usage

Windows PowerShell:

```powershell
# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Compile all Markdown in spec/ into a single document
python tools/spec_compile.py --src spec --out spec/COMPILED_SPEC.md

# Optional: include files in subfolders
python tools/spec_compile.py --src spec --out spec/COMPILED_SPEC.md --recursive
```

Notes:
- Headings: the compiler demotes H1s so the compiled document owns the single top-level H1.
- Ordering: prioritizes `requirements.md`, `design.md`, `tasks.md`, then `order: N` (if present in front-matter), then filename.
- Output: `spec/COMPILED_SPEC.md` (gitignored by default).

## CI artifact download

On every push and pull request, the workflow `.github/workflows/spec-compile.yml` runs and uploads an artifact named `compiled-spec`.

Steps to download:
1. Go to the repository → Actions tab
2. Open the run for your commit/PR → job “Spec Compile”
3. Scroll to Artifacts → download `compiled-spec`

Screenshot placeholders (to be replaced):
- `docs/images/spec-compile/actions-run.png`
- `docs/images/spec-compile/artifact-download.png`

## GitHub Pages (published compiled spec)

We publish the compiled spec to GitHub Pages automatically via `.github/workflows/spec-pages.yml`.
- Trigger: push to `master` or `Development` (and manual dispatch)
- The job compiles the spec to `_site/index.md` and deploys it to the `github-pages` environment
- The Pages URL is printed in the deploy step output (Actions → job “deploy” → View deployment)

Typical URL pattern:
- https://sjandrs.github.io/legendary-spoon/

If you don’t see the site yet, check the Actions run for the “Deploy to GitHub Pages” step and ensure repository Pages is enabled under Settings → Pages.

## Release asset attachment

On Release publication, the workflow `.github/workflows/spec-release.yml` compiles the spec and attaches `COMPILED_SPEC.md` to the release.
- Trigger: GitHub Release event (Published)
- Result: A downloadable asset named `COMPILED_SPEC.md` on the release page

If needed, re-run the workflow from the Release page under “Run workflow”.
