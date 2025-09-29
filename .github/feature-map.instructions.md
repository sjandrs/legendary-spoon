# Converge Feature Map & Development Priority

This document outlines the planned features for the Converge application, listed in the agreed-upon order of implementation. It serves as a strategic guide for development.

## 1. Contacts (✅ Complete)
*   **Core Idea:** The central repository for all people and companies the business interacts with.
*   **Core Models:** `Account`, `Contact`, `Interaction`, `CustomField`, `CustomFieldValue`, `Tag`.
*   **Features:**
    *   **Account Management:** Create and manage Company/Organization profiles.
    *   **Contact Management:** Create and manage individual People profiles, linking them to an Account.
    *   **Interaction Logging:** Manually log calls, meetings, and emails associated with a contact or account.
    *   **Custom Fields:** Add custom data points to contacts and accounts.
    *   **Tagging and Segmentation:** Create and apply tags (e.g., "Lead," "Vendor," "VIP") to filter and group contacts.

## 2. Deals (✅ Complete)
*   **Core Idea:** Manage the sales pipeline from initial contact to closing.
*   **Core Models:** `Deal`, `DealStage`.
*   **Features:**
    *   **Deal Tracking:** Create deals with a value, expected close date, and associated contacts/accounts.
    *   **Pipeline Management:** Define and customize sales stages.
    *   **Kanban Board View:** A drag-and-drop interface to move deals between stages.
    *   **List/Table View:** A sortable and filterable table of all deals.

## 3. Tasks (✅ Complete)
*   **Core Idea:** A comprehensive task and project management system.
*   **Core Models:** `Task`, `TaskTemplate`, `Project`.
*   **Features:**
    *   **Task Creation & Assignment:** Create tasks, set due dates, assign them to staff members, and link them to other records.
    *   **Task Templates:** Pre-define common checklists or multi-step processes.
    *   **Project Boards:** Group related tasks into projects with their own statuses and timelines.
    *   **Calendar View:** Display tasks and events on a shared company or personal calendar.

## 4. Accounting (was Orders) (❌ Not Implemented)
*   **Core Idea:** A robust system for managing the company's finances, from work orders to a full general ledger.
*   **Core Models:** `WorkOrder`, `Invoice`, `Payment`, `LineItem`, `LedgerAccount`, `JournalEntry`.
*   **Features:**
    *   **Work Order Management:** Create detailed work orders from deals or tasks.
    *   **Invoicing:** Generate invoices from work orders, track payment status, and send reminders.
    *   **Payment Tracking:** Record full or partial payments against invoices.
    *   **General Ledger:** A full chart of accounts (Assets, Liabilities, Equity, Revenue, Expenses).
    *   **Journal Entries:** System-generated and manual entries to track all financial transactions.
    *   **Financial Reporting:** Generate core reports like Balance Sheet, Income Statement, and Cash Flow Statement.
    *   **Expense Tracking:** Log and categorize business expenses.

## 5. Warehouse (❌ Not Implemented)
*   **Core Idea:** Basic inventory management for products and parts.
*   **Core Models:** `Product`, `InventoryAdjustment`.
*   **Features:**
    *   **Product/Item Catalog:** A list of all sellable products or internal parts with SKU, name, and price.
    *   **Stock Level Tracking:** Manage on-hand quantities for each item.
    *   **Stock Adjustments:** Manually adjust stock levels for shipments, returns, or physical counts.
    *   **Low Stock Alerts:** Notifications when an item's quantity drops below a threshold.

## 6. Staff (🚧 Partial)
*   **Core Idea:** Manage internal users, roles, and payroll.
*   **Core Models:** `User`, `Role`, `TimeLog`, `PayrollProfile`.
*   **Features:**
    *   **User & Role Management:** Invite users and manage permissions with a Role-Based Access Control (RBAC) system.
    *   **Payroll Profiles:** Store pay rate and type (hourly/salary) for each user.
    *   **Time Tracking:** Allow staff to log hours worked on specific tasks or orders.
    *   **Payroll Reporting:** Generate reports to facilitate payroll processing.

## 7. Resources (✅ Complete)
*   **Core Idea:** A centralized place for internal and external documentation.
*   **Core Models:** `KnowledgeBaseArticle`, `Document`.
*   **Features:**
    *   **Knowledge Base:** An internal wiki for company processes and information.
    *   **Document Storage:** A secure place to upload and share files related to contacts, deals, or projects.

## 8. Converge Chat (❌ Not Implemented)
*   **Core Idea:** Integrated communication to reduce reliance on external apps.
*   **Core Models:** `ChatMessage`, `ChatChannel`.
*   **Features:**
    *   **Direct & Group Messaging:** Real-time chat between users.
    *   **Message Boards/Channels:** Persistent topic-based channels (e.g., #sales, #tech-support).
    *   **Contextual Chat:** Link conversations to specific records (e.g., a chat room for a specific Deal).

## 9. Dashboard (🚧 Partial)
*   **Core Idea:** A customizable, at-a-glance view of the most critical business metrics, built last to integrate all other modules.
*   **Features:**
    *   **KPI Widgets:** Display metrics from all other modules (New Deals, Unpaid Invoices, Open Tasks, etc.).
    *   **Sales Pipeline Funnel:** A visual representation of the `Deals by Stage` data.
    *   **Upcoming Tasks & Appointments:** A list of tasks and events for the logged-in user.
    *   **Recent Activity Feed:** A real-time stream of significant events from across the application.
    *   **User-Customizable Layout:** Allow users to add, remove, and rearrange widgets.
