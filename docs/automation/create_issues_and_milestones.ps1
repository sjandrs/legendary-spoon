# Requires GitHub CLI (gh) authenticated: gh auth login
param(
  [string]$Repo = "sjandrs/legendary-spoon",
  [string]$Project = "",
  [switch]$DryRun,
  [switch]$ImportGenerated
)

function Write-Plan {
  param([string]$Msg)
  Write-Host "[plan] $Msg" -ForegroundColor Cyan
}

function Ensure-Label {
  param([string]$Name, [string]$Color = "#ededed", [string]$Description = "")
  try {
    gh label create --repo $Repo $Name -c $Color -d $Description 2>$null | Out-Null
  } catch {}
}

function Ensure-Labels {
  Write-Plan "Ensuring repository labels exist"
  Ensure-Label -Name "api" -Color "#0366d6" -Description "API related"
  Ensure-Label -Name "parity" -Color "#0e8a16" -Description "Spec parity"
  Ensure-Label -Name "spec-plan" -Color "#5319e7" -Description "Planning/specification"
  1..12 | ForEach-Object { Ensure-Label -Name "phase-$_" -Color "#c2e0c6" -Description "Phase $_" }
}

function New-Milestone {
  param([string]$Title, [string]$Due="")
  if ($DryRun) { Write-Plan "Milestone: $Title (due: $Due)"; return }
  $args = @("api", "-X", "POST", "repos/$Repo/milestones", "-f", "title=$Title")
  # Due date optional; GitHub API for milestones may ignore due_on in some plans; omit to avoid 422
  & gh @args | Out-Null
}

function New-IssueFromFile {
  param([string]$Path, [string]$Milestone)
  $content = Get-Content -Path $Path -Raw
  # Title is first markdown header line without leading hashes
  $firstLine = ($content -split "`n")[0]
  $title = $firstLine -replace "^#+\s*", ""
  if (-not $title) { $title = (Split-Path $Path -Leaf) }
  if ($DryRun) { Write-Plan "Issue: $title -> milestone '$Milestone' from $Path"; return }
  $tmp = New-TemporaryFile
  $content | Set-Content -Path $tmp -Encoding UTF8
  gh issue create --repo $Repo --title $title --body-file $tmp --milestone $Milestone | Out-Null
  Remove-Item $tmp -Force
}

function New-ParityIssue {
  param([string]$Resource, [string]$Milestone)
  $title = "[API Parity] $Resource"
  $body = @"
API parity checklist for "/api/$Resource/"

Checks

- [ ] Pagination shape is {count,next,previous,results}
- [ ] Error shape standardized (detail/errors list)
- [ ] RBAC matrix: 401 unauth, 403 unauthorized, 200/201 authorized
- [ ] Filtering/search params documented and tested
- [ ] Ordering fields documented and tested

References

- Tests: link to APITestCase assertions
- Docs: docs/API.md anchors
"@
  if ($DryRun) { Write-Plan "Parity Issue: $title -> milestone '$Milestone'"; return }
  # Labels expected to exist from Ensure-Labels; create best-effort if missing
  Ensure-Label -Name "api" -Color "#0366d6" -Description "API related"
  Ensure-Label -Name "parity" -Color "#0e8a16" -Description "Spec parity"
  $tmp = New-TemporaryFile
  $body | Set-Content -Path $tmp -Encoding UTF8
  gh issue create --repo $Repo --title "$title" --label api --label parity --milestone "$Milestone" --body-file "$tmp" | Out-Null
  Remove-Item $tmp -Force
}

function Import-GeneratedIssuesFromCsv {
  param([string]$CsvPath)
  if (-not (Test-Path $CsvPath)) {
    Write-Host "[warn] Generated issues index not found: $CsvPath" -ForegroundColor Yellow
    return
  }
  $rows = Import-Csv -Path $CsvPath
  foreach ($row in $rows) {
    $file = $row.file_path
    $milestone = $row.milestone
    $titleOverride = $row.title_override
    if ($DryRun) {
      Write-Plan "Issue (generated): '$titleOverride' from $file -> milestone '$milestone'"
      continue
    }
    $content = Get-Content -Path $file -Raw
    $tmp = New-TemporaryFile
    $content | Set-Content -Path $tmp -Encoding UTF8
    gh issue create --repo $Repo --title "$titleOverride" --body-file $tmp --milestone "$milestone" | Out-Null
    Remove-Item $tmp -Force
  }
}

# Milestones with approximate dates (adjust as needed)
Ensure-Labels

$today = Get-Date
$phase1Due = (Get-Date).AddDays(14).ToString("yyyy-MM-dd")
$phase2Due = (Get-Date).AddDays(21).ToString("yyyy-MM-dd")
$phase3Due = (Get-Date).AddDays(35).ToString("yyyy-MM-dd")
$phase4Due = (Get-Date).AddDays(49).ToString("yyyy-MM-dd")
$phase5Due = (Get-Date).AddDays(56).ToString("yyyy-MM-dd")
$phase6Due = (Get-Date).AddDays(63).ToString("yyyy-MM-dd")
$phase7Due = (Get-Date).AddDays(70).ToString("yyyy-MM-dd")
$phase8Due = (Get-Date).AddDays(84).ToString("yyyy-MM-dd")
$phase9Due = (Get-Date).AddDays(98).ToString("yyyy-MM-dd")
$phase10Due = (Get-Date).AddDays(112).ToString("yyyy-MM-dd")
$phase11Due = (Get-Date).AddDays(126).ToString("yyyy-MM-dd")
$phase12Due = (Get-Date).AddDays(140).ToString("yyyy-MM-dd")

Write-Plan "Creating milestones"
New-Milestone -Title "Phase 1 - Canonical API Parity Baseline" -Due $phase1Due
New-Milestone -Title "Phase 2 - Finance and Budget V2 Completion" -Due $phase2Due
New-Milestone -Title "Phase 3 - Technician and User Mgmt Frontend" -Due $phase3Due
New-Milestone -Title "Phase 4 - Field Service Mgmt Frontend" -Due $phase4Due
New-Milestone -Title "Phase 5 - Advanced Analytics Parity" -Due $phase5Due
New-Milestone -Title "Phase 6 - Test Coverage Uplift" -Due $phase6Due
New-Milestone -Title "Phase 7 - Internationalization and Localization" -Due $phase7Due
New-Milestone -Title "Phase 8 - Security, Compliance and Privacy" -Due $phase8Due
New-Milestone -Title "Phase 9 - Performance and Scalability" -Due $phase9Due
New-Milestone -Title "Phase 10 - Observability and SRE Readiness" -Due $phase10Due
New-Milestone -Title "Phase 11 - Integrations and Data Migration" -Due $phase11Due
New-Milestone -Title "Phase 12 - Documentation, UAT and Release Hardening" -Due $phase12Due

Write-Plan "Creating phase issues from docs"
$root = Join-Path $PSScriptRoot "..\issues"
New-IssueFromFile -Path (Join-Path $root "010-phase1-api-parity.md") -Milestone "Phase 1 - Canonical API Parity Baseline"
New-IssueFromFile -Path (Join-Path $root "011-phase2-budget-v2.md") -Milestone "Phase 2 - Finance and Budget V2 Completion"
New-IssueFromFile -Path (Join-Path $root "012-phase3-tech-user-frontend.md") -Milestone "Phase 3 - Technician and User Mgmt Frontend"
New-IssueFromFile -Path (Join-Path $root "013-phase4-field-service-frontend.md") -Milestone "Phase 4 - Field Service Mgmt Frontend"
New-IssueFromFile -Path (Join-Path $root "014-phase5-analytics-parity.md") -Milestone "Phase 5 - Advanced Analytics Parity"
New-IssueFromFile -Path (Join-Path $root "015-phase6-test-coverage.md") -Milestone "Phase 6 - Test Coverage Uplift"

Write-Plan "Creating API parity checklist issues"
New-ParityIssue -Resource "accounts" -Milestone "Phase 1 - Canonical API Parity Baseline"
New-ParityIssue -Resource "contacts" -Milestone "Phase 1 - Canonical API Parity Baseline"
New-ParityIssue -Resource "deals" -Milestone "Phase 1 - Canonical API Parity Baseline"
New-ParityIssue -Resource "budgets-v2" -Milestone "Phase 1 - Canonical API Parity Baseline"
New-ParityIssue -Resource "payments" -Milestone "Phase 1 - Canonical API Parity Baseline"
New-ParityIssue -Resource "invoices" -Milestone "Phase 1 - Canonical API Parity Baseline"
New-ParityIssue -Resource "journal-entries" -Milestone "Phase 1 - Canonical API Parity Baseline"
New-ParityIssue -Resource "ledger-accounts" -Milestone "Phase 1 - Canonical API Parity Baseline"
New-ParityIssue -Resource "work-orders" -Milestone "Phase 1 - Canonical API Parity Baseline"

if ($ImportGenerated) {
  Write-Plan "Importing generated issues from CSV index"
  $csv = Join-Path $PSScriptRoot "generated_issues_index.csv"
  Import-GeneratedIssuesFromCsv -CsvPath $csv
}

Write-Host "Done." -ForegroundColor Green
