#!/bin/bash
set -e
# Automated Testing Setup Script for Converge CRM
echo "Setting up automated testing environment..."

# Install Python testing dependencies
echo "Installing Python testing tools..."
pip install -r requirements.txt

# Install frontend testing dependencies (include devDependencies like MSW)
echo "Installing frontend testing tools..."
cd frontend
# Prefer clean install; ensure dev deps are included
export NODE_ENV=development
if [ -f package-lock.json ]; then
  npm ci --include=dev || npm ci
else
  npm install
fi
# Fallback: explicitly install MSW if missing
if ! npm ls msw >/dev/null 2>&1; then
  npm install --save-dev msw@^2.11.3
fi
cd ..

# Install pre-commit hooks
echo "Installing pre-commit hooks..."
pre-commit install

# Run initial test suite
echo "Running initial test suite..."
python manage.py test
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Django tests failed during setup. Please review the errors above."
  exit 1
fi

echo ""
echo "Automated testing setup complete!"
echo ""
echo "Available commands:"
echo "- VS Code Tasks: Ctrl+Shift+P -> Tasks: Run Task"
echo "  - run-tests: Run all Django tests"
echo "  - run-tests-coverage: Run tests with coverage"
echo "  - run-tests-frontend: Run React tests"
echo "  - run-quality-check: Run linting and tests"
echo ""
echo "- Manual commands:"
echo "  - python manage.py test: Run Django tests"
echo "  - cd frontend && npm test: Run React tests"
echo "  - pre-commit run --all-files: Run all pre-commit checks"
echo ""
echo "GitHub Actions CI/CD is configured in .github/workflows/ci-cd.yml"
echo "Tests will run automatically on push/PR to main/develop/Feature-Bootcamp branches"
