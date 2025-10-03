# Converge CRM - Testing Infrastructure Validation
Write-Host "🚀 Converge CRM - Testing Infrastructure Validation" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check Backend Environment
Write-Host "🔍 Checking Backend Environment..." -ForegroundColor Yellow
if ((Test-Path ".\venv\Scripts\Activate.ps1") -and (Test-Path ".\manage.py")) {
    Write-Host "✅ Backend environment is properly configured" -ForegroundColor Green
    $backendEnv = $true
} else {
    Write-Host "❌ Backend environment is missing or incomplete" -ForegroundColor Red
    $backendEnv = $false
}

# Check Frontend Environment
Write-Host "🔍 Checking Frontend Environment..." -ForegroundColor Yellow
if ((Test-Path ".\frontend\package.json") -and (Test-Path ".\frontend\jest.config.js")) {
    Write-Host "✅ Frontend environment is properly configured" -ForegroundColor Green
    $frontendEnv = $true
} else {
    Write-Host "❌ Frontend environment is missing or incomplete" -ForegroundColor Red
    $frontendEnv = $false
}

# Check Test Files
Write-Host "🔍 Checking Test Files..." -ForegroundColor Yellow
$testFiles = @(
    ".\frontend\src\__tests__\utils\test-utils.jsx",
    ".\frontend\src\__tests__\utils\msw-handlers.js",
    ".\frontend\src\__tests__\utils\msw-server.js",
    ".\frontend\src\__tests__\components\ContactList.test.jsx",
    ".\frontend\src\__tests__\components\DashboardPage.test.jsx",
    ".\frontend\src\__tests__\App.test.jsx"
)

$allTestFilesExist = $true
foreach ($file in $testFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Missing: $file" -ForegroundColor Red
        $allTestFilesExist = $false
    }
}

if ($allTestFilesExist) {
    Write-Host "✅ All test files are present" -ForegroundColor Green
} else {
    Write-Host "❌ Some test files are missing" -ForegroundColor Red
}

# Check Documentation
Write-Host "🔍 Checking Documentation..." -ForegroundColor Yellow
$docFiles = @(
    ".\frontend\src\__tests__\README.md",
    ".\docs\TESTING_AUTOMATION.md",
    ".\TESTING_STATUS.md",
    ".\spec\spec-design-frontend-testing-integration.md"
)

$allDocsExist = $true
foreach ($doc in $docFiles) {
    if (-not (Test-Path $doc)) {
        Write-Host "❌ Missing: $doc" -ForegroundColor Red
        $allDocsExist = $false
    }
}

if ($allDocsExist) {
    Write-Host "✅ All documentation files are present" -ForegroundColor Green
} else {
    Write-Host "❌ Some documentation files are missing" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "📊 VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

$results = @{
    "Backend Environment" = $backendEnv
    "Frontend Environment" = $frontendEnv
    "Test Files" = $allTestFilesExist
    "Documentation" = $allDocsExist
}

$passedCount = 0
foreach ($result in $results.GetEnumerator()) {
    $status = if ($result.Value) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($result.Value) { "Green" } else { "Red" }
    Write-Host "$status - $($result.Key)" -ForegroundColor $color
    if ($result.Value) { $passedCount++ }
}

Write-Host ""
Write-Host "Results: $passedCount/$($results.Count) validations passed" -ForegroundColor $(if ($passedCount -eq $results.Count) { "Green" } else { "Yellow" })

if ($passedCount -eq $results.Count) {
    Write-Host ""
    Write-Host "🎉 ALL VALIDATIONS PASSED!" -ForegroundColor Green
    Write-Host "The testing infrastructure is ready for use!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Some validations failed. Please review the errors above." -ForegroundColor Yellow
}
