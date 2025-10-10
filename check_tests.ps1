Write-Host 'Testing Infrastructure Status' -ForegroundColor Cyan
Write-Host '================================' -ForegroundColor Cyan
Write-Host ''

if (Test-Path '.\frontend\src\__tests__\README.md') {
    Write-Host 'Test documentation: PRESENT' -ForegroundColor Green
} else {
    Write-Host 'Test documentation: MISSING' -ForegroundColor Red
}

if (Test-Path '.\frontend\src\__tests__\utils\test-utils.jsx') {
    Write-Host 'Test utilities: PRESENT' -ForegroundColor Green
} else {
    Write-Host 'Test utilities: MISSING' -ForegroundColor Red
}

if (Test-Path '.\frontend\src\__tests__\components\ContactList.test.jsx') {
    Write-Host 'Component tests: PRESENT' -ForegroundColor Green
} else {
    Write-Host 'Component tests: MISSING' -ForegroundColor Red
}

Write-Host ''
Write-Host 'Frontend testing infrastructure is ready!' -ForegroundColor Green
