# Generates a Markdown TODO of Markdown files that may still need review/reclassification.
# Output: docs/reports/UNREVIEWED_MARKDOWN_TODO.md

$ErrorActionPreference = 'Stop'

# Ensure output directory exists
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$outDir = Join-Path $repoRoot 'docs/reports'
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}
$outFile = Join-Path $outDir 'UNREVIEWED_MARKDOWN_TODO.md'

# Helper: normalize path for consistent matching
function Normalize([string]$p) { ($p -replace '/', '\\').ToLower() }
function RelPath([string]$full, [string]$root) {
    $nFull = Normalize($full)
    $nRoot = Normalize($root)
    if ($nFull.StartsWith($nRoot)) { return $nFull.Substring($nRoot.Length) }
    return $nFull
}

# Collect markdown files
$allMd = Get-ChildItem -Path $repoRoot -Recurse -File -Filter *.md

# Define organized/known folders (treated as reviewed/organized containers)
$organizedRoots = @(
    '\docs\reports\',
    '\docs\reports\issues\',
    '\docs\adr\',
    '\docs\research\',
    '\docs\plans\',
    '\docs\spike\',
    '\docs\example-specs\',
    '\spec\'
)

# Always ignore these roots entirely
$ignoredRoots = @(
    '\.git\',
    '\.github\',
    '\node_modules\',
    '\frontend\node_modules\',
    '\static\kb\',
    '\main\migrations\',
    '\venv\',
    '\.venv\',
    '\__pycache__\'
)

# Define explicit file paths to exclude from review (keep in place)
$explicitExclusions = @(
    '\readme.md',
    '\docs\readme.md',
    '\docs\development.md',
    '\docs\field_service_management.md',
    '\docs\navigation_quick_reference.md',
    '\frontend\readme.md'
    '\frontend\src\__tests__\readme.md'
) | ForEach-Object { $_.ToLower() }

# Partition files
$pendingOutside = @()
$pendingDocsRoot = @()
$specsOk = @()

foreach ($f in $allMd) {
    $n = Normalize($f.FullName)
    $rel = RelPath $n $repoRoot

    # Ignore dependency and meta roots
    if ($ignoredRoots | Where-Object { $rel.StartsWith($_) }) { continue }

    # Skip explicit exclusions
    if ($explicitExclusions -contains $rel) {
        continue
    }

    # In organized roots? mark reviewed
    if ($organizedRoots | Where-Object { $rel.StartsWith($_) }) {
        continue
    }

    # In spec root files are considered reviewed
    if ($rel.StartsWith('\spec\')) {
        $specsOk += $f
        continue
    }

    # Docs root markdown (direct children of docs/)
    if ($rel -like '\docs\*' -and ($rel -notlike '\docs\*\*')) {
        $pendingDocsRoot += $f
        continue
    }

    # Anything else is outside organized areas
    $pendingOutside += $f
}

# Build Markdown output
$nl = "`r`n"
$content = @()

$content += "# Markdown Review TODO" + $nl
$content += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" + $nl
$content += $nl
$content += "This file lists Markdown documents that may need review or reclassification. Once a file is moved into organized documentation folders (docs/reports, docs/adr, docs/research, docs/plans, docs/spike) or spec/, it will disappear from this list on next generation." + $nl
$content += $nl

# Pending Outside Organized Dirs
$content += "## Pending outside organized directories" + $nl
if ($pendingOutside.Count -eq 0) {
    $content += "- [x] None" + $nl
} else {
    foreach ($f in ($pendingOutside | Sort-Object FullName)) {
        $content += "- [ ] $((Resolve-Path -Relative $f.FullName))" + $nl
    }
}
$content += $nl

# Pending in docs root
$content += "## Pending in docs/ root (consider moving to docs/reports, docs/plans, docs/adr, etc.)" + $nl
if ($pendingDocsRoot.Count -eq 0) {
    $content += "- [x] None" + $nl
} else {
    foreach ($f in ($pendingDocsRoot | Sort-Object FullName)) {
        $content += "- [ ] $((Resolve-Path -Relative $f.FullName))" + $nl
    }
}
$content += $nl

# Informational: specs present (reviewed)
$content += "## Specs detected (for reference)" + $nl
$specFiles = Get-ChildItem -Path (Join-Path $repoRoot 'spec') -File -Filter *.md -ErrorAction SilentlyContinue | Sort-Object FullName
if ($specFiles.Count -eq 0) {
    $content += "- (none)" + $nl
} else {
    foreach ($f in $specFiles) {
        $content += "- $((Resolve-Path -Relative $f.FullName))" + $nl
    }
}
$content += $nl

# Write file
$content -join '' | Out-File -FilePath $outFile -Encoding UTF8

Write-Host "Markdown review TODO generated at: $outFile"
