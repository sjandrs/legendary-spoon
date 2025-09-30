@echo off
REM Automated Testing Setup Script for Converge CRM
echo Setting up automated testing environment...

REM Install Python testing dependencies
echo Installing Python testing tools...
pip install -r requirements.txt

REM Install frontend testing dependencies
echo Installing frontend testing tools...
cd frontend
npm install
cd ..

REM Install pre-commit hooks
echo Installing pre-commit hooks...
pre-commit install

REM Run initial test suite
echo Running initial test suite...
python manage.py test

echo.
echo Automated testing setup complete!
echo.
echo Available commands:
echo - VS Code Tasks: Ctrl+Shift+P -> Tasks: Run Task
echo   - run-tests: Run all Django tests
echo   - run-tests-coverage: Run tests with coverage
echo   - run-tests-frontend: Run React tests
echo   - run-quality-check: Run linting and tests
echo.
echo - Manual commands:
echo   - python manage.py test: Run Django tests
echo   - cd frontend && npm test: Run React tests
echo   - pre-commit run --all-files: Run all pre-commit checks
echo.
echo GitHub Actions CI/CD is configured in .github/workflows/ci-cd.yml
echo Tests will run automatically on push/PR to main/develop/Feature-Bootcamp branches
