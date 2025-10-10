param(
	[string]$FrontendDir = "${PSScriptRoot}\..\frontend",
	[string]$ReportOut = "${PSScriptRoot}\..\docs\reports\lint-baseline-diff.md",
	[string]$SnapshotOut = "${PSScriptRoot}\..\docs\reports\lint-snapshot.json",
	[string]$BaselineMain = "${PSScriptRoot}\..\frontend\lint-baseline.json",
	[string]$BaselineBatch = "${PSScriptRoot}\..\frontend\lint-baseline-batch3.json",
	[int]$MaxTotalDelta = 0,
	[int]$MaxRuleDelta = 0,
	[int]$TopN = 10
)

$ErrorActionPreference = 'Stop'

function Ensure-Path([string]$p) {
	$full = Resolve-Path -LiteralPath $p -ErrorAction SilentlyContinue
	if (-not $full) { return $p }
	return $full.Path
}

$FrontendDir = Ensure-Path $FrontendDir
$ReportOut = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($ReportOut)
$ReportDir = Split-Path -Parent $ReportOut
if (-not (Test-Path $ReportDir)) { New-Item -ItemType Directory -Path $ReportDir | Out-Null }

Write-Host "Running ESLint for baseline diff..."

# Run ESLint with summary-friendly output. We fall back to text and parse totals.
Push-Location $FrontendDir
try {
		$current = @{}
	$eslintArgs = @('--max-warnings=0', '--format', 'json', 'src')
	$jsonOutput = $null

	# Try npx.cmd first (Windows), then npx, then local bin
	foreach ($candidate in @('npx.cmd', 'npx', '.\node_modules\.bin\eslint.cmd')) {
		try {
			if ($candidate -like '*.cmd' -and -not (Test-Path $candidate) -and $candidate -like '.\\node_modules*') {
				continue
			}
			if ($candidate -eq 'npx.cmd' -or $candidate -eq 'npx') {
				$jsonOutput = & $candidate eslint @eslintArgs 2>$null
			} else {
				$jsonOutput = & $candidate @eslintArgs 2>$null
			}
			if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) { break }
		} catch {
			$jsonOutput = $null
		}
	}

	if (-not $jsonOutput) { throw 'Failed to execute ESLint via npx or local bin.' }

	try {
			$json = $jsonOutput | ConvertFrom-Json -ErrorAction Stop
			$errors = 0; $warnings = 0; $problems = 0
			$ruleCounts = @{}
		foreach ($file in $json) {
			foreach ($m in $file.messages) {
				$problems++
				if ($m.severity -eq 2) { $errors++ } elseif ($m.severity -eq 1) { $warnings++ }
					$rid = if ($m.ruleId) { [string]$m.ruleId } else { '_no-rule' }
					if ($ruleCounts.ContainsKey($rid)) { $ruleCounts[$rid]++ } else { $ruleCounts[$rid] = 1 }
			}
		}
		$current = [ordered]@{
			timestamp = (Get-Date).ToString('s')
			errors = $errors
			warnings = $warnings
			totalProblems = $problems
				ruleCounts = $ruleCounts
		}
	} catch {
		# Fallback: text parse (run eslint with text formatter)
		$textOut = $null
		foreach ($candidate in @('npx.cmd', 'npx', '.\node_modules\.bin\eslint.cmd')) {
			try {
				if ($candidate -like '*.cmd' -and -not (Test-Path $candidate) -and $candidate -like '.\\node_modules*') {
					continue
				}
				if ($candidate -eq 'npx.cmd' -or $candidate -eq 'npx') {
					$textOut = & $candidate eslint --max-warnings=0 "src" 2>&1
				} else {
					$textOut = & $candidate --max-warnings=0 "src" 2>&1
				}
				if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) { break }
			} catch { $textOut = $null }
		}
		if (-not $textOut) { throw 'Unable to run ESLint (text mode) for fallback parsing.' }
			$m = $textOut -match '(?<problems>\d+) problems \((?<errors>\d+) errors?, (?<warnings>\d+) warnings?\)'
		if ($m) {
			$current = [ordered]@{
				timestamp = (Get-Date).ToString('s')
				errors = [int]$Matches['errors']
				warnings = [int]$Matches['warnings']
				totalProblems = [int]$Matches['problems']
					ruleCounts = @{}
			}
		} else {
			throw 'Unable to parse ESLint output.'
		}
	}
} finally {
	Pop-Location
}

# Load baselines if present
function Load-JsonSafe([string]$path) {
	if (Test-Path $path) {
		try { return Get-Content $path -Raw | ConvertFrom-Json } catch { return $null }
	}
	return $null
}
$baseMain = Load-JsonSafe (Ensure-Path $BaselineMain)
$baseBatch = Load-JsonSafe (Ensure-Path $BaselineBatch)

# Coerce baseline values
function Coerce-Baseline($b) {
	if (-not $b) { return $null }
	$errors = 0; $warnings = 0; $total = 0
	if ($b.eslint) {
		# legacy structure
		if ($b.eslint.totalProblems) { $total = [int]$b.eslint.totalProblems }
		if ($b.eslint.unusedVarErrors) { $errors += [int]$b.eslint.unusedVarErrors }
		if ($b.eslint.hookWarnings) { $warnings += [int]$b.eslint.hookWarnings }
	} else {
		if ($b.errors) { $errors = [int]$b.errors }
		if ($b.warnings) { $warnings = [int]$b.warnings }
		if ($b.totalProblems) { $total = [int]$b.totalProblems }
	}
	return [ordered]@{ errors = $errors; warnings = $warnings; totalProblems = $total }
}

$bm = Coerce-Baseline $baseMain
$bb = Coerce-Baseline $baseBatch

# Diff helper
function Diff-Counts($label, $current, $baseline) {
		if (-not $baseline) {
			return ('- {0}: (no baseline) current total={1}, errors={2}, warnings={3}' -f $label, $current.totalProblems, $current.errors, $current.warnings)
		}
	$dTotal = $current.totalProblems - $baseline.totalProblems
	$dErr = $current.errors - $baseline.errors
	$dWarn = $current.warnings - $baseline.warnings
	$trend = if ($dTotal -lt 0) { 'IMPROVED' } elseif ($dTotal -gt 0) { 'REGRESSED' } else { 'UNCHANGED' }
		return ('- {0}: total={1} (delta {2}, {3}), errors={4} (delta {5}), warnings={6} (delta {7})' -f $label, $current.totalProblems, $dTotal, $trend, $current.errors, $dErr, $current.warnings, $dWarn)
}

# Load previous snapshot for per-rule delta (if any)
$prevSnap = $null
if (Test-Path $SnapshotOut) {
	try { $prevSnap = Get-Content $SnapshotOut -Raw | ConvertFrom-Json } catch { $prevSnap = $null }
}

# Compute per-rule deltas vs previous snapshot
$ruleDelta = @()
if ($prevSnap -and $prevSnap.ruleCounts) {
	$prevCounts = @{}
	foreach ($k in $prevSnap.ruleCounts.PSObject.Properties.Name) { $prevCounts[$k] = [int]$prevSnap.ruleCounts.$k }
	foreach ($k in $current.ruleCounts.Keys) {
		$curr = [int]$current.ruleCounts[$k]
		$prev = if ($prevCounts.ContainsKey($k)) { $prevCounts[$k] } else { 0 }
		$delta = $curr - $prev
		$ruleDelta += [pscustomobject]@{ rule = $k; current = $curr; previous = $prev; delta = $delta }
	}
	# Include rules that disappeared
	foreach ($k in $prevCounts.Keys) {
		if (-not $current.ruleCounts.ContainsKey($k)) {
			$prev = $prevCounts[$k]
			$ruleDelta += [pscustomobject]@{ rule = $k; current = 0; previous = $prev; delta = -$prev }
		}
	}
}

# Build markdown report
$nl = "`r`n"
$out = @()
$out += "# ESLint Baseline Diff" + $nl
$out += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" + $nl + $nl
$out += "## Current Summary" + $nl
$out += "- totalProblems: $($current.totalProblems)" + $nl
$out += "- errors: $($current.errors)" + $nl
$out += "- warnings: $($current.warnings)" + $nl + $nl

$out += "## Comparison" + $nl
$out += (Diff-Counts 'Against main baseline' $current $bm) + $nl
$out += (Diff-Counts 'Against batch3 baseline' $current $bb) + $nl + $nl

if ($baseBatch -and $baseBatch.hookWarnings) {
	$out += "### Batch3 Hook Warning Buckets (baseline reference)" + $nl
	foreach ($h in $baseBatch.hookWarnings) { $out += "- $h" + $nl }
	$out += $nl
}

# Per-rule sections
if ($current.ruleCounts) {
	$out += "## Per-rule counts (top $TopN)" + $nl
	$topRules = $current.ruleCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First $TopN
	foreach ($pair in $topRules) { $out += ("- {0}: {1}" -f $pair.Key, $pair.Value) + $nl }
	$out += $nl
}

if ($ruleDelta.Count -gt 0) {
	$out += "## Top regressions since last snapshot (by rule)" + $nl
	$topReg = $ruleDelta | Where-Object { $_.delta -gt 0 } | Sort-Object delta -Descending | Select-Object -First $TopN
	if ($topReg.Count -eq 0) { $out += "- (none)" + $nl } else { foreach ($r in $topReg) { $out += ("- {0}: +{1} (prev {2} -> curr {3})" -f $r.rule, $r.delta, $r.previous, $r.current) + $nl } }
	$out += $nl

	$out += "## Top improvements since last snapshot (by rule)" + $nl
	$topImp = $ruleDelta | Where-Object { $_.delta -lt 0 } | Sort-Object delta | Select-Object -First $TopN
	if ($topImp.Count -eq 0) { $out += "- (none)" + $nl } else { foreach ($r in $topImp) { $out += ("- {0}: {1} (prev {2} -> curr {3})" -f $r.rule, $r.delta, $r.previous, $r.current) + $nl } }
	$out += $nl
}

# Quality Gate Result section
$gateStatus = 'PASS'
$deltaTotalDisplay = $null
if ($bm) {
	$deltaTotalDisplay = $current.totalProblems - $bm.totalProblems
}
$worstDeltaDisplay = $null
if ($ruleDelta.Count -gt 0) {
	$worstDeltaDisplay = ($ruleDelta | Measure-Object delta -Maximum).Maximum
}
# Determine status mirroring gate logic
$gateFail = $false
if ($bm -and $deltaTotalDisplay -ne $null) {
	if ($deltaTotalDisplay -gt $MaxTotalDelta) { $gateFail = $true }
}
if ($ruleDelta.Count -gt 0 -and $MaxRuleDelta -ge 0 -and $worstDeltaDisplay -ne $null) {
	if ($worstDeltaDisplay -gt $MaxRuleDelta) { $gateFail = $true }
}
if ($gateFail) { $gateStatus = 'FAIL' }

$out += "## Quality Gate Result" + $nl
$out += ("- status: {0}" -f $gateStatus) + $nl
if ($bm) {
	$out += ("- total delta vs main baseline: {0} (allowed: {1})" -f $deltaTotalDisplay, $MaxTotalDelta) + $nl
} else {
	$out += "- total delta vs main baseline: (no baseline)" + $nl
}
if ($worstDeltaDisplay -ne $null) {
	$out += ("- per-rule max delta since last snapshot: {0} (allowed: {1})" -f $worstDeltaDisplay, $MaxRuleDelta) + $nl
} else {
	$out += "- per-rule max delta since last snapshot: (no previous snapshot)" + $nl
}
$out += $nl

# Invocation Parameters section
$out += "## Invocation Parameters" + $nl
$out += ("- FrontendDir: {0}" -f $FrontendDir) + $nl
$out += ("- ReportOut: {0}" -f $ReportOut) + $nl
$out += ("- SnapshotOut: {0}" -f $SnapshotOut) + $nl
$out += ("- BaselineMain: {0}" -f (Ensure-Path $BaselineMain)) + $nl
$out += ("- BaselineBatch: {0}" -f (Ensure-Path $BaselineBatch)) + $nl
$out += ("- MaxTotalDelta: {0}" -f $MaxTotalDelta) + $nl
$out += ("- MaxRuleDelta: {0}" -f $MaxRuleDelta) + $nl
$out += ("- TopN: {0}" -f $TopN) + $nl
$out += $nl

$out -join '' | Out-File -FilePath $ReportOut -Encoding UTF8

Write-Host "Baseline diff report written to: $ReportOut"

# Save snapshot for future comparisons
@{
	timestamp = $current.timestamp
	totalProblems = $current.totalProblems
	errors = $current.errors
	warnings = $current.warnings
	ruleCounts = $current.ruleCounts
} | ConvertTo-Json -Depth 6 | Out-File -FilePath $SnapshotOut -Encoding UTF8

# Quality gates
$fail = $false
if ($bm) {
	$deltaTotal = $current.totalProblems - $bm.totalProblems
	if ($deltaTotal -gt $MaxTotalDelta) {
		Write-Host ("Quality gate failed: total delta {0} > allowed {1}" -f $deltaTotal, $MaxTotalDelta) -ForegroundColor Red
		$fail = $true
	}
}

if ($ruleDelta.Count -gt 0 -and $MaxRuleDelta -ge 0) {
	$worst = ($ruleDelta | Measure-Object delta -Maximum).Maximum
	if ($worst -gt $MaxRuleDelta) {
		Write-Host ("Quality gate failed: per-rule max delta {0} > allowed {1}" -f $worst, $MaxRuleDelta) -ForegroundColor Red
		$fail = $true
	}
}

if ($fail) { exit 1 } else { exit 0 }
