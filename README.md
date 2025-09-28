# Converge - Business Management & CRM

Converge is a comprehensive, all-in-one Business Management and Customer Relationship Management (CRM) tool designed for small to medium-sized businesses. It is built with a powerful Django backend and a modern, responsive React frontend.

This integrated solution helps businesses streamline their operations, manage customer interactions, and enhance productivity with features like contact management, deal tracking, task scheduling, and more.

## Project Structure

-   `django/` & `web/`: Contains the main Django project and configuration.
-   `main/`: The core Django app containing models, views, and APIs.
-   `frontend/`: The React frontend application, built with Vite.
-   `requirements.txt`: Python dependencies for the backend.
-   `manage.py`: Django's command-line utility.

## Getting Started

To get the project up and running, you will need to start both the backend and frontend servers.

### Backend Setup (Django)

1.  **Activate Virtual Environment:**
    Make sure you are in the project root directory (`c:\Users\sjand\ws`).
    ```powershell
    .\venv\Scripts\Activate.ps1
    ```

2.  **Install Dependencies:**
    If you haven't already, install the required Python packages.
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run Database Migrations:**
    Apply any pending database schema changes.
    ```bash
    py manage.py migrate
    ```

4.  **Start the Backend Server:**
    The Django development server will start, typically on `http://localhost:8000`.
    ```bash
    py manage.py runserver
    ```

### Frontend Setup (React)

1.  **Navigate to Frontend Directory:**
    Open a new terminal for the frontend.
    ```powershell
    cd frontend
    ```

2.  **Install Dependencies:**
    If you haven't already, install the required Node.js packages.
    ```bash
    npm install
    ```

3.  **Start the Frontend Server:**
    The Vite development server will start, typically on `http://localhost:5173`.
    ```bash
    npm run dev
    ```

Once both servers are running, you can access the Converge application by navigating to `http://localhost:5173` in your web browser.
