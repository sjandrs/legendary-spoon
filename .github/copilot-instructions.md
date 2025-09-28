<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
- [ ] Verify that the copilot-instructions.md file in the .github directory is created.
- use "py" instead of "python" When referencing python commands in the terminal, use "py" instead of "python" to ensure compatibility across different systems.
- [ ] Clarify Project Requirements
	<!-- Ask for project type, language, and frameworks if not specified. Skip if already provided. -->

- [ ] Scaffold the Project
	
	Ensure that the previous step has been marked as completed.
	Call project setup tool with projectType parameter.
	Run scaffolding command to create project files and folders.
	Use '.' as the working directory.
	If no appropriate projectType is available, search documentation using available tools.
	Otherwise, create the project structure manually using available file creation tools.
	

- [ ] Customize the Project
	Verify that all previous steps have been completed successfully and you have marked the step as completed.
	Develop a plan to modify codebase according to user requirements.
	Apply modifications using appropriate tools and user-provided references.
	
	
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
	nav bar menu items: Dashboard (home), Resources, Contacts, Deals, Tasks, Orders, Warehouse, Staff. feature navigation will be added as the features are built out.

	

- [ ] Install Required Extensions
	<!-- ONLY install extensions provided mentioned in the get_project_setup_info. Skip this step otherwise and mark as completed. -->

- [ ] Compile the Project
	
	Verify that all previous steps have been completed.
	Install any missing dependencies.
	Run diagnostics and resolve any issues.
	Check for markdown files in project folder for relevant instructions on how to do this.
	

- [ ] Create and Run Task
	
	Verify that all previous steps have been completed.
	Check https://code.visualstudio.com/docs/debugtest/tasks to determine if the project needs a task. If so, use the create_and_run_task to create and launch a task based on package.json, README.md, and project structure.
	Skip this step otherwise.
	 

- [ ] Launch the Project
	<!---->
	Verify that all previous steps have been completed.
	Prompt user for debug mode, launch only if confirmed.
	 

- [ ] Ensure Documentation is Complete
	<!---->
	Verify that all previous steps have been completed.
	Verify that README.md and the copilot-instructions.md file in the .github directory exists and contains current project information.
	Clean up the copilot-instructions.md file in the .github directory by removing all HTML comments.
	 


## Execution Guidelines
PROGRESS TRACKING:
- If any tools are available to manage the above todo list, use it to track progress through this checklist.
- After completing each step, mark it complete and add a summary.
- Read current todo list status before starting each new step.

COMMUNICATION RULES:
- Avoid verbose explanations or printing full command outputs.
- If a step is skipped, state that briefly (e.g. "No extensions needed").
- Do not explain project structure unless asked.
- Keep explanations concise and focused.

DEVELOPMENT RULES:
- Use '.' as the working directory unless user specifies otherwise.
- Avoid adding media or external links unless explicitly requested.
- Use placeholders only with a note that they should be replaced.
- Use VS Code API tool only for VS Code extension projects.
- Once the project is created, it is already opened in Visual Studio Code—do not suggest commands to open this project in Visual Studio again.
- If the project setup information has additional rules, follow them strictly.
-once changes are made to the code, restart the frontend and backend servers to apply the changes.

FOLDER CREATION RULES:
- Always use the current directory as the project root.
- If you are running any terminal commands, use the '.' argument to ensure that the current working directory is used ALWAYS.
- Do not create a new folder unless the user explicitly requests it besides a .vscode folder for a tasks.json file.
- If any of the scaffolding commands mention that the folder name is not correct, let the user know to create a new folder with the correct name and then reopen it again in vscode.

EXTENSION INSTALLATION RULES:
- Only install extension specified by the get_project_setup_info tool. DO NOT INSTALL any other extensions.

PROJECT CONTENT RULES:
- If the user has not specified project details, assume they want a "Hello World" project as a starting point.
- Avoid adding links of any type (URLs, files, folders, etc.) or integrations that are not explicitly required.
- Avoid generating images, videos, or any other media files unless explicitly requested.
- If you need to use any media assets as placeholders, let the user know that these are placeholders and should be replaced with the actual assets later.
- Ensure all generated components serve a clear purpose within the user's requested workflow.
- If a feature is assumed but not confirmed, prompt the user for clarification before including it.
- If you are working on a VS Code extension, use the VS Code API tool with a query to find relevant VS Code API references and samples related to that query.

TASK COMPLETION RULES:
- Your task is complete when:
  - Project is successfully scaffolded and compiled without errors
  - copilot-instructions.md file in the .github directory exists in the project
  - README.md file exists and is up to date
  - User is provided with clear instructions to debug/launch the project
  - the changelog.md is updated in the knowledge base whith what you have done


- a response of "ok" is to be interpreted as "proceed with plan execution uninterrupted".
- If an error is encountered then use best efforts to resolve it. If unable to resolve, inform the user with a concise message and suggest next steps.
- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.
- Adhere to folder creation and extension installation rules.
- Ensure project content is relevant and purposeful.
- Adhere to folder creation and extension installation rules.