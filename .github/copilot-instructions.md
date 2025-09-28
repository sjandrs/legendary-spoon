<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->


	The software, named Converge is a CRM/Business Management tool. 
	Another branch of the software is Converge Chat, which focuses on communication and collaboration features. 
	The software will be built using Django and React. 
	The workflow will be that the backend will be built with Django and the frontend with React. 
	The backend will provide RESTful APIs for the frontend to consume. 
	The project will be structured to separate concerns between the backend and frontend, ensuring maintainability and scalability. The software will include features such as user authentication, contact management, task management, and communication tools. The project will follow best practices for both Django and React development, including the use of virtual environments, modular code structure, and responsive design principles. 
	The goal is to create a robust, fully customizable and user-friendly application that meets the needs of businesses effectively for the following (but not limited to): managing their operations, accounting (in and out), staff (with payroll),  technicians(with payroll) and communications via instant messages and message boards, work order generation and mangement with invoicing. 
	The users of the software are small to medium-sized businesses looking for an integrated solution to manage their customer relationships and business operations efficiently. 
	They require a user-friendly interface, seamless communication tools, and robust management features to streamline their workflows and enhance productivity. 
	The software should cater to various industries, providing customizable options to fit specific business needs while ensuring scalability for future growth.
	The software will be thoughtfully designed with a modern and intuitive user interface, ensuring ease of use and accessibility for all users and on all devices and platforms.
	Navigating the software should be straightforward, with a clear layout and logical flow between different sections. The user experience will be prioritized to minimize the learning curve and maximize efficiency.
	The navigation will be visible from all pages in the software.
	nav bar menu items: Dashboard (home), Resources, Contacts, Deals, Tasks, Orders, Warehouse, Staff. 
	Feature navigation will be added as the features are built out.


	## Key Features & Conventions (from Changelog)
	- **Authentication:** The project uses a custom, token-based authentication system. The primary login logic is handled in `main/api_auth_views.py`.
	- **User Management:** A `set_password` Django management command exists for administrators to reset user passwords.
	- **Database Seeding:** A management command `py manage.py seed_data` is available to populate the database with test data. This is crucial for development and testing.
	- **Dynamic Task Types:** Task Types are not hardcoded. They are managed by administrators via a full CRUD API at `/api/task-types/` and a UI at `/tasks/types`.
	- **Task Templates:** A full CRUD system for managing Task Templates (including nested default work order items) is available for superusers. The API is at `/api/task-templates/`.
	- **Knowledge Base:** The knowledge base, including the `changelog.md`, is comprised of Markdown files located in the `static/kb/` directory. They are served to the frontend via an API.
	- **UI Conventions:**
		- **Zebra Striping:** Use the global `.striped-table` class on tables and lists to get an alternating background color for rows, improving readability. the zebra striping should be used on all tables and lists where appropriate. the colors used in the striping should be subtle and not distract from the content.
		- **Compact UI:** The UI has undergone a "deflation" pass to make it better optimized for horizontal space. Strive to maintain this by being mindful of padding and margins.
	- **Admin Panel:** Most core CRM models are registered in the Django admin panel for easy data access and debugging.


	Verify that README.md and the copilot-instructions.md file in the .github directory exists and contains current project information.
	Clean up the copilot-instructions.md file in the .github directory by removing all HTML comments.
	Update the copilot-instructions.md file with any changes made during project setup.
	Update changelog.md in the knowledge base with a summary of changes made during project setup.

	## Additional Instructions
file:./a11y.instructions.md
file:./ai-prompt-engineering-safety-best-practices.instructions.md
<!-- file:./angular.instructions.md -->
<!-- file:./aspnet-rest-apis.instructions.md -->
<!-- file:./azure-devops-pipelines.instructions.md -->
<!-- file:./azure-functions-typescript.instructions.md -->
<!-- file:./azure-logic-apps-power-automate.instructions.md -->
<!-- file:./azure-verified-modules-terraform.instructions.md -->
<!-- file:./bicep-code-best-practices.instructions.md -->
<!-- file:./blazor.instructions.md -->
<!-- file:./clojure-memory.instructions.md -->
<!-- file:./cmake-vcpkg.instructions.md -->
<!-- file:./coldfusion-cfc.instructions.md -->
<!-- file:./coldfusion-cfm.instructions.md -->
<!-- file:./collections.instructions.md -->
file:./containerization-docker-best-practices.instructions.md
file:./conventional-commit.prompt.md
<!-- file:./convert-jpa-to-spring-data-cosmos.instructions.md -->
file:./copilot-thought-logging.instructions.md
<!-- file:./csharp-ja.instructions.md -->
<!-- file:./csharp-ko.instructions.md -->
<!-- file:./csharp.instructions.md -->
<!-- file:./dart-n-flutter.instructions.md -->
<!-- file:./declarative-agents-microsoft365.instructions.md -->
<!-- file:./devbox-image-definition.instructions.md -->
file:./devops-core-principles.instructions.md
<!-- file:./dotnet-architecture-good-practices.instructions.md -->
<!-- file:./dotnet-framework.instructions.md -->
<!-- file:./dotnet-maui.instructions.md -->
<!-- file:./dotnet-wpf.instructions.md -->
<!-- file:./genaiscript.instructions.md -->
<!-- file:./generate-modern-terraform-code-for-azure.instructions.md -->
file:./gilfoyle-code-review.instructions.md
file:./github-actions-ci-cd-best-practices.instructions.md
<!-- file:./go.instructions.md -->
<!-- file:./java-11-to-java-17-upgrade.instructions.md -->
<!-- file:./java-17-to-java-21-upgrade.instructions.md -->
<!-- file:./java-21-to-java-25-upgrade.instructions.md -->
<!-- file:./java.instructions.md -->
<!-- file:./joyride-user-project.instructions.md -->
<!-- file:./joyride-workspace-automation.instructions.md -->
file:./kubernetes-deployment-best-practices.instructions.md
file:./localization.instructions.md
file:./markdown.instructions.md
file:./memory-bank.instructions.md
<!-- file:./ms-sql-dba.instructions.md -->
<!-- file:./nestjs.instructions.md -->
<!-- file:./nextjs-tailwind.instructions.md -->
<!-- file:./nextjs.instructions.md -->
<!-- file:./nodejs-javascript-vitest.instructions.md -->
file:./object-calisthenics.instructions.md
<!-- file:./oqtane.instructions.md -->
file:./performance-optimization.instructions.md
file:./playwright-python.instructions.md
file:./playwright-typescript.instructions.md
<!-- file:./power-apps-canvas-yaml.instructions.md -->
<!-- file:./power-apps-code-apps.instructions.md -->
<!-- file:./power-platform-connector.instructions.md -->
file:./powershell-pester-5.instructions.md
file:./powershell.instructions.md
file:./python.instructions.md
<!-- file:./quarkus-mcp-server-sse.instructions.md -->
<!-- file:./quarkus.instructions.md -->
file:./reactjs.instructions.md
<!-- file:./ruby-on-rails.instructions.md -->
<!-- file:./rust.instructions.md -->
file:./security-and-owasp.instructions.md
file:./self-explanatory-code-commenting.instructions.md
file:./spec-driven-workflow-v1.instructions.md
<!-- file:./springboot.instructions.md -->
<!-- file:./sql-sp-generation.instructions.md -->
file:./taming-copilot.instructions.md
<!-- file:./tanstack-start-shadcn-tailwind.instructions.md -->
file:./task-implementation.instructions.md
file:./tasksync.instructions.md
file:./terraform-azure.instructions.md
file:./terraform.instructions.md
<!-- file:./vuejs3.instructions.md -->