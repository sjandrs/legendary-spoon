# Converge Development Process for Technical Managers (v2)

This document outlines the development process, technical stack, and key conventions for the Converge CRM project. It is intended to give a technical manager a clear overview of the project's architecture and how to manage the development workflow.

## 1. Project Overview

Converge is a modern, web-based CRM and business management tool designed for small to medium-sized businesses. It is built with a decoupled architecture, featuring a Django backend that serves a RESTful API and a React frontend that consumes it.

- **Backend:** Django, Django REST Framework
- **Frontend:** React, Vite
- **Database:** SQLite (for development), PostgreSQL (for production)
- **Authentication:** Custom token-based authentication.

## 2. Development Environment Setup

To get a new developer started, follow these steps:

1.  **Clone the Repository:**
    ```bash
    git clone <repository_url>
    cd legendary-spoon
    ```

2.  **Backend Setup (Django):**
    - Ensure Python 3.10+ is installed.
    - Create and activate a virtual environment:
      ```bash
      py -m venv venv
      .\venv\Scripts\Activate.ps1
      ```
    - Install dependencies:
      ```bash
      pip install -r requirements.txt
      ```
    - Run database migrations:
      ```bash
      py manage.py migrate
      ```
    - **Crucially, seed the database with initial data:** This step is vital for the application to function correctly, as many UI components depend on initial data being present.
      ```bash
      py manage.py seed_data
      ```
    - Start the backend server:
      ```bash
      py manage.py runserver
      ```
    The backend will be available at `http://localhost:8000`.

3.  **Frontend Setup (React):**
    - Ensure Node.js and npm are installed.
    - Navigate to the frontend directory:
      ```bash
      cd frontend
      ```
    - Install dependencies:
      ```bash
      npm install
      ```
    - Start the frontend development server:
      ```bash
      npm run dev
      ```
    The frontend will be available at `http://localhost:5173`.

## 3. Key Backend Conventions & Features

- **API:** The core of the backend is the RESTful API built with Django REST Framework. All new features that require data persistence or business logic should be exposed via an API endpoint. API views are located in `main/api_views.py` and `main/search_views.py`. URLs are in `main/api_urls.py`.
- **Models:** All database models are defined in `main/models.py`. When adding or changing a model, a new database migration must be created (`py manage.py makemigrations`) and applied (`py manage.py migrate`).
- **Admin Panel:** For ease of debugging and data management, most new models should be registered in the Django admin panel (`main/admin.py`).
- **Database Seeding:** The `py manage.py seed_data` command is essential. It populates the database with users, accounts, deals, and other necessary data. It is safe to run multiple times as it clears old data first.
- **User Management:** A custom management command, `py manage.py set_password <username> <password>`, exists for administrators to reset user passwords.

## 4. Key Frontend Conventions & Features

- **Component Structure:** Components are organized by feature within `frontend/src/components/`. Reusable charts, forms, and UI elements are in their own subdirectories.
- **API Interaction:** All API calls are handled by a pre-configured `axios` instance in `frontend/src/api.js`. This instance automatically handles authentication tokens.
- **State Management:** Authentication state is managed via a React Context (`AuthContext`). For other state needs, `useState` and `useEffect` are standard.
- **UI Design:** The project uses a compact UI design. Be mindful of padding and margins to maintain this. A global class, `.striped-table`, is available for zebra-striping lists and tables to improve readability.
- **Knowledge Base:** The KB articles, including the `changelog.md`, are Markdown files located in `static/kb/`. They are served via an API and rendered on the frontend.

## 5. Workflow for Adding a New Feature

*Example: Adding a "Projects" feature.*

1.  **Backend First:**
    - **Model:** Define the `Project` model in `main/models.py`.
    - **Migration:** Run `makemigrations` and `migrate`.
    - **Serializer:** Create a `ProjectSerializer` in `main/serializers.py`.
    - **API View:** Create a `ProjectViewSet` in `main/api_views.py`.
    - **URL:** Register the new viewset in `main/api_urls.py`.
    - **Admin:** Register the `Project` model in `main/admin.py`.
    - **Seed Data:** Update the `seed_data` command to create sample projects.

2.  **Frontend Second:**
    - **Route:** Add a new route for `/projects` in `frontend/src/App.jsx`.
    - **Navigation:** Add a link to "Projects" in the main navigation component.
    - **Component:** Create a new page component (e.g., `frontend/src/components/projects/ProjectPage.jsx`) to list, create, and edit projects.
    - **API Calls:** Use the `api.js` axios instance to fetch data from and send data to the new `/api/projects/` endpoint.

3.  **Documentation:**
    - Add a summary of the new feature to the `changelog.md` file in `static/kb/`.
    - If the feature introduces a new major convention, update this document.
