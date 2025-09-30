# Converge CRM

**Converge** is a powerful, all-in-one Business Management and Customer Relationship Management (CRM) platform designed to help small and medium-sized businesses streamline operations, foster customer relationships, and drive growth.

Built with a robust **Django** backend and a dynamic **React** frontend, Converge offers a seamless, intuitive, and professional user experience for managing every aspect of your business.

![Converge Dashboard](https://via.placeholder.com/1200x600.png?text=Converge+CRM+Dashboard+Screenshot)

## ✨ Key Features

*   **Dashboard:** An interactive, at-a-glance overview of your business, including sales performance and deals by stage.
*   **Contact Management:** A centralized database for all your customer and lead information.
*   **Deal Tracking:** A visual pipeline to manage sales opportunities from prospecting to close.
*   **Task Management:** Create, assign, and track tasks related to contacts, deals, or internal projects.
*   **Clickable Charts:** Interactive dashboard charts that allow you to click through to filtered data views.
*   **Knowledge Base:** An internal documentation system for storing articles, guides, and changelogs.
*   **User Roles & Permissions:** Manage user access with roles like "Sales Rep" and "Sales Manager".

## � Documentation

*   **[Testing Automation Guide](docs/TESTING_AUTOMATION.md)**: Comprehensive documentation for automated testing, CI/CD, and quality assurance
*   **[API Documentation](docs/API.md)**: REST API endpoints and usage examples
*   **[Development Guide](docs/DEVELOPMENT.md)**: Setup, conventions, and development workflows

## �🛠️ Tech Stack

*   **Backend:** Django, Django REST Framework
*   **Frontend:** React, Vite, React Router
*   **Database:** SQLite (for development)
*   **Styling:** CSS with a focus on a clean, professional, and compact UI.

## 🚀 Getting Started

Follow these instructions to get the Converge CRM application running on your local machine for development and testing purposes.

### Prerequisites

*   Python (3.9 or higher)
*   Node.js (v18 or higher) and npm
*   A Python virtual environment tool (e.g., `venv`)

### Backend Setup (Django)

1.  **Navigate to Project Root:**
    Open a terminal in the project's root directory (`c:\Users\sjand\ws`).

2.  **Create & Activate Virtual Environment:**
    ```powershell
    # Create the virtual environment (only needs to be done once)
    python -m venv venv

    # Activate the virtual environment
    .\venv\Scripts\Activate.ps1
    ```

3.  **Install Python Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Apply Database Migrations:**
    This command sets up your database schema.
    ```bash
    py manage.py migrate
    ```

5.  **Seed the Database (Important!):**
    To populate the application with essential sample data for testing, run the seed command.
    ```bash
    py manage.py seed_data
    ```

6.  **Start the Backend Server:**
    The Django development server will start, typically on `http://localhost:8000`.
    ```bash
    py manage.py runserver
    ```

### Frontend Setup (React)

1.  **Navigate to Frontend Directory:**
    Open a *new* terminal for the frontend.
    ```powershell
    cd frontend
    ```

2.  **Install Node.js Dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Frontend Server:**
    The Vite development server will start, typically on `http://localhost:5173`.
    ```bash
    npm run dev
    ```

### Accessing the Application

Once both servers are running, you can access the Converge application by navigating to **`http://localhost:5173`** in your web browser.

## 🧪 Testing & Quality Assurance

Converge CRM includes comprehensive automated testing to ensure code quality and prevent regressions.

### Automated Testing Setup

1. **Run the setup script:**
   ```bash
   # Windows
   .\setup_testing.bat

   # Linux/Mac
   ./setup_testing.sh
   ```

2. **Install pre-commit hooks:**
   ```bash
   pre-commit install
   ```

### Running Tests

#### VS Code Tasks (Recommended)
- `Ctrl+Shift+P` → `Tasks: Run Task` → Select from:
  - `run-tests`: Run all Django backend tests
  - `run-tests-coverage`: Run tests with coverage reporting
  - `run-tests-frontend`: Run React frontend tests
  - `run-tests-all`: Run both backend and frontend tests
  - `run-quality-check`: Run linting and tests

#### Manual Commands
```bash
# Backend tests
python manage.py test                    # All tests
python manage.py test main.tests        # Main app tests only
python -m coverage run manage.py test   # With coverage
python -m coverage report               # Coverage report

# Frontend tests
cd frontend
npm test                                # Run tests
npm run test:watch                      # Watch mode
npm run test:coverage                   # With coverage

# Quality checks
python -m flake8 main web               # Python linting
npm run lint                           # JavaScript linting
pre-commit run --all-files             # All pre-commit checks
```

### CI/CD Pipeline

Tests run automatically on:
- **Push** to `main`, `develop`, or `Feature-Bootcamp` branches
- **Pull Requests** targeting these branches

The pipeline includes:
- Backend unit/integration tests with coverage
- Frontend component tests
- Code quality checks (linting, formatting)
- Security scanning
- Automated deployment on successful builds

### Test Coverage

Current test suite covers:
- **Backend (Django):**
  - Phase 1: Accounting (ledger, expenses, budgets, payments)
  - Phase 2: Workflow (inventory, time tracking, work orders)
  - Authentication & permissions
  - API endpoints & business logic

- **Frontend (React):**
  - Component rendering and interactions
  - API integration
  - User interface functionality

### Writing Tests

#### Backend Tests
```python
# main/tests.py
class MyFeatureTests(TestCase):
    def setUp(self):
        # Test data setup

    def test_feature_functionality(self):
        # Test implementation
```

#### Frontend Tests
```jsx
// src/Component.test.jsx
import { render, screen } from '@testing-library/react';

test('renders component correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

## 🔑 Key Conventions & Development Notes

*   **Database Seeding:** The `py manage.py seed_data` command is crucial for development. It populates the database with users, deal stages, task types, and sample CRM data, which is necessary for many UI components to render correctly.
*   **API Endpoints:** The backend provides a RESTful API. The primary API routes are defined in `main/api_urls.py`.
*   **UI Styling:** The project uses a global `.striped-table` class for zebra-striping on tables and lists to improve readability. The UI aims for a compact and professional feel on desktop.
*   **Knowledge Base:** The changelog and other documentation are stored as Markdown files in the `static/kb/` directory and served via the API.
*   **Authentication:** The application uses a token-based authentication system managed by Django.

## 🤝 Contributing

Please refer to the project's contribution guidelines and code of conduct before submitting a pull request. Ensure that your changes align with the project's coding style and conventions.
