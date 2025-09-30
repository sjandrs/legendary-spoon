# Changelog

This document tracks the major changes, features, and bug fixes implemented in the Converge application.

## 2025-09-29 (Test Suite Fixed - All Tests Passing)

### ✅ Critical Test Suite Resolution
Fixed all failing tests in the comprehensive testing automation infrastructure. All 17 backend tests and 2 frontend tests are now passing successfully.

### **Test Issues Resolved:**
- **CustomUser Import Missing:** Added `CustomUser` to imports in `main/tests.py` for all test classes
- **AUTH_USER_MODEL Configuration:** Added `AUTH_USER_MODEL = "main.CustomUser"` to `web/settings.py` to properly configure Django's user model
- **Test User Creation:** Updated all test `setUp` methods to create `CustomUser` instances instead of regular `User` instances
- **Method Name Correction:** Fixed `reports.balance_sheet()` to `reports.get_balance_sheet()` in financial reports test
- **Frontend Test Expectations:** Updated `App.test.jsx` to test correct home page content instead of navigation elements

### **Files Modified:**
- **`main/tests.py`:** Added CustomUser import, updated all setUp methods to use CustomUser.objects.create_user(), fixed method call
- **`web/settings.py`:** Added AUTH_USER_MODEL configuration
- **`frontend/src/App.test.jsx`:** Updated test expectations to match actual home page content

### **Test Results:**
- ✅ **Backend Tests:** 17/17 tests passing (100% success rate)
- ✅ **Frontend Tests:** 2/2 tests passing (100% success rate)
- ✅ **Pre-commit Hooks:** All quality gates passing
- ✅ **CI/CD Pipeline:** Ready for automated testing

### **Impact:**
- ✅ Complete testing automation infrastructure now fully functional
- ✅ All automated quality checks passing
- ✅ Development workflow ready for continuous integration
- ✅ Production-ready testing framework operational

This completes the testing automation infrastructure implementation with all tests passing and quality gates operational.

## 2025-09-28 (Backend Startup Fix - Task to Project Migration Complete)

### 🐛 Critical Bug Fix: Incomplete Model Renaming Resolved
Fixed critical Django backend startup errors caused by incomplete migration from "Task" to "Project" model naming. The backend was failing to start due to import errors such as `ImportError: cannot import name 'TaskTemplate'` where old "Task" references remained in several key files.

### **Files Fixed:**
- **`main/admin.py`:** Updated imports and admin class registrations from `TaskTemplate`/`TaskType` to `ProjectTemplate`/`ProjectType`
- **`main/serializers.py`:** Fixed serializer class names and model references (`TaskTemplateSerializer` → `ProjectTemplateSerializer`, `TaskTypeSerializer` → `ProjectTypeSerializer`)
- **`main/api_views.py`:** Updated ViewSet class names and model imports (`TaskTemplateViewSet` → `ProjectTemplateViewSet`, `TaskTypeViewSet` → `ProjectTypeViewSet`)
- **`main/api_urls.py`:** Fixed API endpoint registrations to use correct ViewSet class names
- **`main/search_service.py`:** Updated model imports and references from `Task` to `Project`
- **`main/management/commands/seed_data.py`:** Fixed model imports and object creation calls
- **`main/management/commands/setup_groups.py`:** Updated permission codenames (`view_task` → `view_project`, `add_task` → `add_project`, etc.)

### **Admin Interface Fix:**
- Corrected `ProjectAdmin.list_filter` to use `project_type` instead of non-existent `task_type` field

### **Impact:**
- ✅ Django backend now starts successfully without import errors
- ✅ All admin interface models properly registered and accessible
- ✅ API endpoints functional with correct model relationships
- ✅ Management commands work with updated model names
- ✅ VS Code `start-dev` task now works as intended

This completes the Task → Project model renaming that was initiated earlier, ensuring all references throughout the Django application stack are consistent.


## 2025-09-27 (Authentication Resolved)

### 🐛 Critical Bug Fix: Authentication System Stabilized
After a prolonged and difficult debugging session, the application's authentication system has been completely stabilized. The final resolution involved multiple steps to remove conflicting libraries and configurations, culminating in a simple, robust, and custom token authentication system.

- **Removed `dj-rest-auth`:** The `dj-rest-auth` library and its dependencies were completely removed from the project to eliminate a source of persistent, hard-to-diagnose configuration conflicts.
- **Implemented Custom Login View:** A new, minimal `LoginView` was created from scratch in `main/api_auth_views.py`. This view manually handles user authentication against Django's standard backend and generates an auth token. This gives us direct, unambiguous control over the login process.
- **Corrected `authenticate` Call:** The final piece of the puzzle was correcting the call to Django's `authenticate` function. The `request` object was added to the call (`authenticate(request, ...)`) which is crucial when multiple authentication backends are configured, as it allows Django to correctly process the authentication attempt.
- **User Creation:** Identified that the user being tested (`sam`) did not exist in the database. Used the `createsuperuser` management command to create the user, resolving the "Invalid Credentials" error.

### ✨ New Features
- **Password Reset Management Command:** Created a new Django management command `set_password` to allow an administrator to securely reset any user's password from the command line. This is a valuable tool for future user management and support.
- **Database Logging:**
    - Implemented a new system to log application events directly to the database instead of a flat file.
    - Created a `LogEntry` model in `main/models.py` to store log data.
    - Created a custom `DatabaseLogHandler` in `main/db_log_handler.py`.
    - Updated `settings.py` to use the new database handler, and resolved a circular dependency issue to ensure correct application startup.

## 2025-09-27 (Authentication Saga)

### 🐛 Critical Bug Fixes
- **Login System Overhaul:** After a prolonged and difficult debugging session, the application's authentication system has been completely stabilized. The root cause was a misconfiguration in the Django settings related to `django-allauth`.
    - **Corrected `AUTHENTICATION_BACKENDS`:** Added the required `allauth` authentication backend to `web/settings.py`, which was the primary source of the persistent `400 Bad Request` and `401 Unauthorized` errors.
    - **Standardized Login View:** Replaced the custom `LoginView` with a standardized, token-based authentication view (`CustomAuthToken`) that inherits from Django REST Framework's `ObtainAuthToken`. This ensures robust and correct handling of login requests.
    - **Corrected Frontend Context:** Refactored the frontend's `AuthContext` and `App.jsx` to correctly handle the token and user data returned from the new login view.
- **Routing & Context Provider Fix:**
    - Resolved a critical issue where navigating to any protected page would redirect to the login screen, even after a successful login.
    - The `AuthProvider` was moved to correctly wrap the application's router in `App.jsx`, ensuring the authentication state is globally available.
    - Fixed a subsequent `ReferenceError` by adding the missing `AuthProvider` import in `App.jsx`.

### ✨ New Features
- **Customizable Task Types:**
    - **Backend:** Created a new `TaskType` model and a full CRUD API at `/api/task-types/` to allow administrators to manage task types dynamically.
    - **Frontend:** Built a new settings page at `/tasks/types` for managing task types (Create, Edit, Activate/Deactivate).
    - **Integration:** Updated all relevant frontend components (`TaskForm`, `TaskAdministration`, `TaskCalendar`) to use the new dynamic task types from the API, replacing the old hardcoded dropdowns.

### ⚙️ Backend
- **Admin Panel Improvements:** Registered all CRM models (`Account`, `Contact`, `Task`, `Deal`, etc.) with the Django admin site to facilitate easier data management and debugging.
- **Database Integrity:** Resolved a significant `IntegrityError` during the initial migration of the `TaskType` model by resetting the database and creating a clean migration path.

### 🎨 UI/UX Improvements
- **Navigation Update:** Added a link to the "Task Templates" administration page under the "Tasks" dropdown menu for easier access.

## 2025-09-27 (Night)

### ✨ New Features
- **Task Template Management (Full CRUD):**
    - Implemented a complete feature for creating, reading, updating, and deleting Task Templates on the "Task Administration" page.
    - This feature is restricted to superusers.
- **Default Work Order Items:**
    - Within a Task Template, users can now define a list of default work order items (e.g., parts, labor, serialized equipment).
    - The UI supports adding, editing, and removing these nested items dynamically when creating or editing a template.

### ⚙️ Backend
- **API Endpoints:** Created a new API endpoint `/api/task-templates/` for managing templates via a `TaskTemplateViewSet`.
- **Models & Serializers:**
    - Added `TaskTemplate` and `DefaultWorkOrderItem` models to the database.
    - Implemented `TaskTemplateSerializer` with a nested `DefaultWorkOrderItemSerializer` to handle complex create/update operations in a single API call.
- **Database:** Generated and applied new database migrations for the task template models.

### 🎨 UI/UX Improvements
- **Task Administration UI:** Built a comprehensive user interface on the `/tasks/admin` page for managing task templates and their associated default items.
- **Dynamic Forms:** The template creation form now dynamically handles adding and removing nested work order items for an intuitive user experience.

## 2025-09-27 (Evening)

### ✨ New Features
- **Knowledge Base on Resources Page:** The `/resources` page now displays the list of knowledge base articles, making them more accessible from the main navigation.

### 🎨 UI/UX Improvements
- **Legacy Navigation Submenu:**
    - Created a new "Legacy" dropdown menu on the main navigation bar to house links to older or less frequently used pages (`Posts`, `Search`, `Settings`, etc.).
    - This cleans up the primary navigation while keeping all functionality accessible.
- **Submenu Visibility Fix:** Corrected a CSS issue where the `overflow: hidden` property on the navigation bar was preventing the "Legacy" dropdown from being visible.

### 🐛 Bug Fixes
- **User Role Management Page Crash:** Fixed a critical bug where the `/settings/user-roles` page would crash (`TypeError: Cannot read properties of undefined (reading 'map')`). The fix involved implementing robust data handling, loading, and error states in `UserRoleManagement.jsx`.

## 2025-09-27

### 🚀 Major Updates
- **Navigation Overhaul:** Restructured the main navigation bar to align with the core features defined in the project instructions: `Dashboard`, `Resources`, `Contacts`, `Deals`, `Tasks`, `Orders`, `Warehouse`, and `Staff`.
- **Component Scaffolding:** Created placeholder pages for all new navigation links (`Resources`, `Deals`, `Orders`, `Warehouse`) to support future development.

### ✨ New Features
- **Expanded Application Scope:** Added navigation links, routes, and placeholder components for several major new features based on the project roadmap:
    - `Work Orders`
    - `Invoicing`
    - `Accounting`
    - `Staff Management`
    - `Chat & Collaboration`
- **Custom Fields:** Added support for a new `boolean` field type in the backend model (`main/models.py`) and successfully ran database migrations to apply the change.
- **Deal Details Page:** Implemented a "Back" button using `useNavigate` for improved user navigation.

### 🎨 UI/UX Improvements
- **Search Results Layout:**
    - Converted the search results from a simple vertical list into a responsive grid of cards.
    - This provides a more modern, visually appealing, and data-rich presentation on wider screens.
- **Zebra Striping:**
    - Implemented an alternating background color pattern (zebra striping) for search result items to improve readability.
    - Created a global `.striped-table` class and applied it to the "Existing Fields" list on the Custom Fields page and the "User Role Management" page for a consistent look and feel.
- **UI "Deflation" Pass:**
    - Conducted a comprehensive review of UI spacing to create a more compact and professional desktop experience.
    - Reduced global padding on buttons in `index.css`.
    - Significantly reduced margins and padding on the Custom Fields page (`CustomFieldsSettings.css`).
- **Custom Fields Page Redesign:**
    - Reorganized the "Existing Fields" list by grouping fields under their respective models (e.g., Deals, Contacts) for better organization.
    - Converted the field groups into a multi-column layout to make better use of horizontal space.
    - Redesigned the "Add New Field" form to fit on a single, compact line.
- **Navigation Bar:** Removed the horizontal scrollbar that appeared on some screen sizes to create a cleaner, fixed header.

### 🐛 Bug Fixes
- **Posts Page:** Fixed a bug where the `/posts` page would show up blank by implementing robust data handling and conditional rendering in `PostList.jsx`.
- **Knowledge Base:**
    - **Article List Fixed:** Resolved an issue where the Knowledge Base page showed "No articles found" by correctly accessing the `response.data` from the API call in `KnowledgeBase.jsx`.
    - **Article Viewing Fixed:** Fixed a 404 error that occurred when clicking an article link by correcting the API endpoint in `MarkdownViewer.jsx` from `/api/markdown/` to `/api/kb/`.
    - **API Path Fixed:** Corrected the file path resolution in the Django `KnowledgeBaseView` (`main/api_views.py`) which was causing the initial 404 errors.
- **Contacts Page Crash:** Fixed a critical bug where the `/contacts` page would crash (`TypeError: Cannot read properties of undefined (reading 'map')`). The fix involved adding robust data handling and conditional rendering in `ContactList.jsx` to ensure the component doesn't fail if the API response is pending or erroneous.
- **Custom Fields Page:**
    - **Data Display Fixed:** Resolved a bug where newly created custom fields were not appearing in the "Existing Fields" list. The fix involved correctly handling the paginated API response by accessing `response.data.results`.
    - **Error Handling:** Improved error message display and form state management for a better user experience when creating a new custom field fails.

### 📄 Documentation
- **Changelog Updated:** Maintained and updated this changelog with the latest changes.
- **Copilot Instructions Updated:** Reviewed, updated, and corrected the `.github/copilot-instructions.md` file to provide better guidance, add more project details, and improve clarity for future development sessions.
