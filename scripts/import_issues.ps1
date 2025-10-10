param(
  [string]$Label = 'imported-from-md',
  [switch]$DryRun
)

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "GitHub CLI 'gh' is required. Install from https://cli.github.com/"
  exit 1
}

# Ensure label exists
try {
  gh label view $Label 1>$null 2>$null
} catch {
  gh label create $Label --color 0366d6 --description "Imported from local Markdown file" | Out-Null
}

$issuesDir = Join-Path (Get-Location) 'issues'
if (-not (Test-Path $issuesDir)) {
  Write-Host "No issues/ directory found. Nothing to import."
  exit 0
}

$files = Get-ChildItem -Path $issuesDir -Filter *.md -File
if (-not $files) {
  Write-Host "No Markdown files in issues/. Nothing to import."
  exit 0
}

# Get existing open issues for dedupe check
$existing = gh issue list --limit 200 --state open --json number,title,body | ConvertFrom-Json

foreach ($f in $files) {
  $content = Get-Content -Path $f.FullName -Raw
  $title = ($content -split "`r?`n")[0] -replace '^\s*#\s*',''
  if (-not $title) { $title = [System.IO.Path]::GetFileNameWithoutExtension($f.Name) }
  $marker = "<!-- imported-from-md: issues/$($f.Name) -->"

  if ($existing | Where-Object { $_.body -like "*${marker}*" }) {
    Write-Host "Skipping $($f.Name): already imported."
    continue
  }

  $body = "$content`n`n$marker"
  if ($DryRun) {
    Write-Host "[DRY RUN] Would create issue: $title"
    continue
  }

  gh issue create --title "$title" --body "$body" --label "$Label" | Out-Null
  Write-Host "Created issue from $($f.Name)"
}
