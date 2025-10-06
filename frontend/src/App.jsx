import React, { useState, useContext, useEffect, useRef, Suspense, lazy } from 'react';
import { Route, Routes, Link, useNavigate, Outlet, useLocation } from 'react-router-dom';

// TASK-084: Core components loaded immediately (critical for initial render)
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './components/HomePage';
import DashboardPage from './components/DashboardPage';
import UtilityNavigation from './components/UtilityNavigation';
import LoadingSkeleton from './components/LoadingSkeleton';
import './App.css';
import AuthContext from './contexts/AuthContext';

// TASK-084: Code splitting - Lazy load all other components
// Phase 1 Components
const PostList = lazy(() => import('./components/PostList'));
const PostDetail = lazy(() => import('./components/PostDetail'));
const SearchPage = lazy(() => import('./components/SearchPage'));
const MarkdownViewer = lazy(() => import('./components/MarkdownViewer'));
const KnowledgeBase = lazy(() => import('./components/KnowledgeBase'));
const Resources = lazy(() => import('./components/Resources'));
const Chat = lazy(() => import('./components/Chat'));

// Phase 2 Components - CRM
const Contacts = lazy(() => import('./components/Contacts'));
const ContactDetail = lazy(() => import('./components/ContactDetail'));
const ContactForm = lazy(() => import('./components/ContactForm'));
const AccountList = lazy(() => import('./components/AccountList'));
const AccountDetail = lazy(() => import('./components/AccountDetail'));
const AccountForm = lazy(() => import('./components/AccountForm'));
const QuoteList = lazy(() => import('./components/QuoteList'));
const QuoteDetail = lazy(() => import('./components/QuoteDetail'));
const QuoteForm = lazy(() => import('./components/QuoteForm'));
const InteractionList = lazy(() => import('./components/InteractionList'));
const InteractionForm = lazy(() => import('./components/InteractionForm'));
const ActivityTimelinePage = lazy(() => import('./components/ActivityTimelinePage'));
const Deals = lazy(() => import('./components/Deals'));
const DealDetail = lazy(() => import('./components/DealDetail'));

// Phase 3 Components - Analytics & Advanced
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const DealPredictions = lazy(() => import('./components/DealPredictions'));
const CustomerLifetimeValue = lazy(() => import('./components/CustomerLifetimeValue'));
const RevenueForecast = lazy(() => import('./components/RevenueForecast'));
const AnalyticsSnapshots = lazy(() => import('./components/AnalyticsSnapshots'));
const ProjectTemplateList = lazy(() => import('./components/ProjectTemplateList'));
const ProjectTemplateForm = lazy(() => import('./components/ProjectTemplateForm'));
const CertificationList = lazy(() => import('./components/CertificationList'));
const CertificationForm = lazy(() => import('./components/CertificationForm'));
const TechnicianManagement = lazy(() => import('./components/TechnicianManagement'));
const TechnicianPayroll = lazy(() => import('./components/TechnicianPayroll'));

// Phase 4 Components - CMS & Admin
const BlogPostList = lazy(() => import('./components/BlogPostList'));
const BlogPostForm = lazy(() => import('./components/BlogPostForm'));
const PageList = lazy(() => import('./components/PageList'));
const PageForm = lazy(() => import('./components/PageForm'));
const TagManagerPage = lazy(() => import('./components/TagManagerPage'));
const NotificationCenter = lazy(() => import('./components/NotificationCenter'));
const ActivityLogList = lazy(() => import('./components/ActivityLogList'));
const SystemLogsList = lazy(() => import('./components/SystemLogsList'));

// Task Management
const TaskDashboard = lazy(() => import('./components/TaskDashboard'));
const TaskForm = lazy(() => import('./components/TaskForm'));
const TaskAdministration = lazy(() => import('./components/TaskAdministration'));
const TaskTypeSettings = lazy(() => import('./components/TaskTypeSettings'));
const TaskCalendar = lazy(() => import('./components/TaskCalendar'));
const TimeTracking = lazy(() => import('./components/TimeTracking'));

// Operations & Accounting
const WorkOrders = lazy(() => import('./components/WorkOrders'));
const WorkOrderList = lazy(() => import('./components/WorkOrderList'));
const WorkOrderForm = lazy(() => import('./components/WorkOrderForm'));
const Invoicing = lazy(() => import('./components/Invoicing'));
const Accounting = lazy(() => import('./components/Accounting'));
const Orders = lazy(() => import('./components/Orders'));
const Warehouse = lazy(() => import('./components/Warehouse'));
const LedgerAccountList = lazy(() => import('./components/LedgerAccountList'));
const LedgerAccountForm = lazy(() => import('./components/LedgerAccountForm'));
const JournalEntryList = lazy(() => import('./components/JournalEntryList'));
const JournalEntryForm = lazy(() => import('./components/JournalEntryForm'));
const LineItemList = lazy(() => import('./components/LineItemList'));
const LineItemForm = lazy(() => import('./components/LineItemForm'));
const PaymentList = lazy(() => import('./components/PaymentList'));
const PaymentForm = lazy(() => import('./components/PaymentForm'));
const Reports = lazy(() => import('./components/Reports'));
const ExpenseList = lazy(() => import('./components/ExpenseList'));
const ExpenseForm = lazy(() => import('./components/ExpenseForm'));
const BudgetList = lazy(() => import('./components/BudgetList'));
const BudgetForm = lazy(() => import('./components/BudgetForm'));
const TaxReport = lazy(() => import('./components/TaxReport'));
const EmailCommunication = lazy(() => import('./components/EmailCommunication'));

// Field Service Management
const SchedulePage = lazy(() => import('./components/SchedulePage'));
const PaperworkTemplateManager = lazy(() => import('./components/PaperworkTemplateManager'));
const CustomerPortal = lazy(() => import('./components/CustomerPortal'));
const AppointmentRequestQueue = lazy(() => import('./components/AppointmentRequestQueue'));
const DigitalSignaturePad = lazy(() => import('./components/DigitalSignaturePad'));
const SchedulingDashboard = lazy(() => import('./components/SchedulingDashboard'));

// Staff Management
const Staff = lazy(() => import('./components/Staff'));
const UserRoleManagement = lazy(() => import('./components/UserRoleManagement'));
const CustomFieldsSettings = lazy(() => import('./components/CustomFieldsSettings'));

// TASK-084: Loading fallback component for Suspense
const SuspenseFallback = () => (
  <div style={{ padding: '20px' }}>
    <LoadingSkeleton variant="rectangle" height="200px" />
    <LoadingSkeleton variant="text" count={5} />
  </div>
);

// This component contains the main application layout with navigation
const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation(); // TASK-082: Track current route for active highlighting
  const [accountingMenuOpen, setAccountingMenuOpen] = useState(false);
  const [resourcesMenuOpen, setResourcesMenuOpen] = useState(false);
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(false);
  const [staffMenuOpen, setStaffMenuOpen] = useState(false);
  const [fieldServiceMenuOpen, setFieldServiceMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [crmMenuOpen, setCrmMenuOpen] = useState(false);
  const [advancedMenuOpen, setAdvancedMenuOpen] = useState(false);
  const [salesMarketingMenuOpen, setSalesMarketingMenuOpen] = useState(false);
  const [operationsMenuOpen, setOperationsMenuOpen] = useState(false);
  
  // TASK-081: Keyboard navigation support
  const [focusedMenuIndex, setFocusedMenuIndex] = useState(-1);
  const menuRefs = useRef([]);
  
  // Helper function to check if route is active - TASK-082
  const isRouteActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  // TASK-081: Handle keyboard navigation
  const handleKeyDown = (e, menuSetter, isOpen, menuLinks) => {
    switch (e.key) {
      case 'Escape':
        menuSetter(false);
        e.currentTarget.focus();
        break;
      case 'Enter':
      case ' ':
        if (!isOpen) {
          e.preventDefault();
          menuSetter(true);
        }
        break;
      case 'ArrowDown':
        if (!isOpen) {
          e.preventDefault();
          menuSetter(true);
        } else {
          e.preventDefault();
          // Focus first link in dropdown
          const dropdown = e.currentTarget.nextElementSibling;
          if (dropdown) {
            const firstLink = dropdown.querySelector('a');
            if (firstLink) firstLink.focus();
          }
        }
        break;
      case 'ArrowUp':
        if (isOpen) {
          e.preventDefault();
          // Focus last link in dropdown
          const dropdown = e.currentTarget.nextElementSibling;
          if (dropdown) {
            const links = dropdown.querySelectorAll('a');
            if (links.length > 0) links[links.length - 1].focus();
          }
        }
        break;
      default:
        break;
    }
  };
  
  // TASK-081: Handle keyboard navigation within dropdown menus
  const handleDropdownKeyDown = (e, menuSetter) => {
    const currentLink = e.currentTarget;
    const dropdown = currentLink.parentElement;
    const links = Array.from(dropdown.querySelectorAll('a'));
    const currentIndex = links.indexOf(currentLink);
    
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        menuSetter(false);
        // Focus back on dropdown button
        const button = dropdown.previousElementSibling;
        if (button) button.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < links.length - 1) {
          links[currentIndex + 1].focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          links[currentIndex - 1].focus();
        } else {
          // Focus back on dropdown button
          const button = dropdown.previousElementSibling;
          if (button) button.focus();
        }
        break;
      case 'Tab':
        // Allow natural tab behavior but close menu
        menuSetter(false);
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    // We can get logout from context now, but this is also fine
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div className="container">
      {/* Utility Navigation Bar - Phase 1 TASK-003 */}
      <UtilityNavigation />
      
      <nav>
        <ul>
          <div className="nav-links">
            {/* Core Navigation */}
            <li><Link to="/dashboard" data-testid="nav-dashboard">Dashboard</Link></li>
            <li><Link to="/analytics" data-testid="nav-analytics">Analytics</Link></li>
            
            {/* Advanced Analytics Dropdown */}
            <li
              className="dropdown-menu"
              onMouseEnter={() => setAdvancedMenuOpen(true)}
              onMouseLeave={() => setAdvancedMenuOpen(false)}
            >
              <button className="dropdown-button" data-testid="nav-advanced">Advanced</button>
              {advancedMenuOpen && (
                <div className="dropdown-menu-content">
                  <Link to="/analytics/deal-predictions">Deal Predictions</Link>
                  <Link to="/analytics/customer-lifetime-value">Customer Lifetime Value</Link>
                  <Link to="/analytics/revenue-forecast">Revenue Forecast</Link>
                  <Link to="/analytics/snapshots">Analytics Snapshots</Link>
                </div>
              )}
            </li>
            
            {/* CRM Dropdown - TASK-081 (keyboard nav), TASK-082 (active highlighting) */}
            <li
              className="dropdown-menu"
              onMouseEnter={() => setCrmMenuOpen(true)}
              onMouseLeave={() => setCrmMenuOpen(false)}
            >
              <button 
                className="dropdown-button" 
                data-testid="nav-crm"
                onKeyDown={(e) => handleKeyDown(e, setCrmMenuOpen, crmMenuOpen)}
                aria-haspopup="true"
                aria-expanded={crmMenuOpen}
              >
                CRM
              </button>
              {crmMenuOpen && (
                <div className="dropdown-menu-content" role="menu">
                  <Link 
                    to="/accounts" 
                    className={isRouteActive('/accounts') ? 'active' : ''}
                    onKeyDown={(e) => handleDropdownKeyDown(e, setCrmMenuOpen)}
                    role="menuitem"
                  >
                    Accounts
                  </Link>
                  <Link 
                    to="/contacts"
                    className={isRouteActive('/contacts') ? 'active' : ''}
                    onKeyDown={(e) => handleDropdownKeyDown(e, setCrmMenuOpen)}
                    role="menuitem"
                  >
                    Contacts
                  </Link>
                  <Link 
                    to="/deals"
                    className={isRouteActive('/deals') ? 'active' : ''}
                    onKeyDown={(e) => handleDropdownKeyDown(e, setCrmMenuOpen)}
                    role="menuitem"
                  >
                    Deals
                  </Link>
                  <Link 
                    to="/quotes"
                    className={isRouteActive('/quotes') ? 'active' : ''}
                    onKeyDown={(e) => handleDropdownKeyDown(e, setCrmMenuOpen)}
                    role="menuitem"
                  >
                    Quotes
                  </Link>
                  <Link 
                    to="/interactions"
                    className={isRouteActive('/interactions') ? 'active' : ''}
                    onKeyDown={(e) => handleDropdownKeyDown(e, setCrmMenuOpen)}
                    role="menuitem"
                  >
                    Interactions
                  </Link>
                  <Link 
                    to="/activity-timeline"
                    className={isRouteActive('/activity-timeline') ? 'active' : ''}
                    onKeyDown={(e) => handleDropdownKeyDown(e, setCrmMenuOpen)}
                    role="menuitem"
                  >
                    Activity Timeline
                  </Link>
                </div>
              )}
            </li>
            
            {/* Sales & Marketing Dropdown - TASK-061, 062 */}
            <li
              className="dropdown-menu"
              onMouseEnter={() => setSalesMarketingMenuOpen(true)}
              onMouseLeave={() => setSalesMarketingMenuOpen(false)}
            >
              <button className="dropdown-button">Sales & Marketing</button>
              {salesMarketingMenuOpen && (
                <div className="dropdown-menu-content">
                  <Link to="/blog">Blog Posts</Link>
                  <Link to="/pages">CMS Pages</Link>
                  <Link to="/tags">Tags</Link>
                </div>
              )}
            </li>
            
            {/* Projects & Tasks Dropdown - TASK-078 (renamed from "Tasks") */}
            <li
              className="dropdown-menu"
              onMouseEnter={() => setProjectsMenuOpen(true)}
              onMouseLeave={() => setProjectsMenuOpen(false)}
            >
              <button className="dropdown-button">Projects & Tasks</button>
              {projectsMenuOpen && (
                <div className="dropdown-menu-content">
                  <Link to="/tasks">Task Dashboard</Link>
                  <Link to="/time-tracking">Time Tracking</Link>
                  <Link to="/tasks/calendar">Task Calendar</Link>
                  <Link to="/tasks/admin">Task Templates</Link>
                  <Link to="/tasks/types" element={<TaskTypeSettings />}>Manage Types</Link>
                  <Link to="/project-templates">Project Templates</Link>
                </div>
              )}
            </li>
            
            {/* Operations Dropdown - TASK-080 (consolidates Orders, Invoices, Work Orders, Warehouse) */}
            <li
              className="dropdown-menu"
              onMouseEnter={() => setOperationsMenuOpen(true)}
              onMouseLeave={() => setOperationsMenuOpen(false)}
            >
              <button className="dropdown-button">Operations</button>
              {operationsMenuOpen && (
                <div className="dropdown-menu-content">
                  <Link to="/orders">Orders</Link>
                  <Link to="/invoicing">Invoicing</Link>
                  <Link to="/work-orders/list">Work Orders</Link>
                  <Link to="/warehouse">Warehouse</Link>
                </div>
              )}
            </li>
            
            {/* Staff & Resources Dropdown - TASK-079 (renamed from "Staff") */}
            <li
              className="dropdown-menu"
              onMouseEnter={() => setStaffMenuOpen(true)}
              onMouseLeave={() => setStaffMenuOpen(false)}
            >
              <button className="dropdown-button">Staff & Resources</button>
              {staffMenuOpen && (
                <div className="dropdown-menu-content">
                  <Link to="/staff">User Management</Link>
                  <Link to="/settings/user-roles">User Role Management</Link>
                  <Link to="/technicians">Technicians</Link>
                  <Link to="/technician-payroll">Technician Payroll</Link>
                  <Link to="/certifications">Certifications</Link>
                  <Link to="/resources">Company Resources</Link>
                  <Link to="/kb">Knowledge Base</Link>
                </div>
              )}
            </li>
            
            {/* Field Service Dropdown */}
            <li className="dropdown-menu"
                onMouseEnter={() => setFieldServiceMenuOpen(true)}
                onMouseLeave={() => setFieldServiceMenuOpen(false)}
            >
              <button className="dropdown-button">Field Service</button>
              {fieldServiceMenuOpen && (
                <div className="dropdown-menu-content">
                  <Link to="/schedule">Schedule</Link>
                  <Link to="/paperwork-templates">Paperwork Templates</Link>
                  <Link to="/customer-portal">Customer Portal</Link>
                  <Link to="/appointment-requests">Appointment Requests</Link>
                  <Link to="/digital-signature">Digital Signature</Link>
                  <Link to="/scheduling-dashboard">Scheduling Dashboard</Link>
                </div>
              )}
            </li>
            
            {/* Accounting Dropdown */}
            <li className="dropdown-menu"
                onMouseEnter={() => setAccountingMenuOpen(true)}
                onMouseLeave={() => setAccountingMenuOpen(false)}
            >
              <button className="dropdown-button">Accounting</button>
              {accountingMenuOpen && (
                <div className="dropdown-menu-content">
                  <Link to="/reports">Financial Reports</Link>
                  <Link to="/email-communication">Email Communication</Link>
                  <Link to="/ledger-accounts">Ledger Accounts</Link>
                  <Link to="/journal-entries">Journal Entries</Link>
                  <Link to="/line-items">Line Items</Link>
                  <Link to="/payments">Payments</Link>
                  <Link to="/expenses">Expenses</Link>
                  <Link to="/budgets">Budgets</Link>
                  <Link to="/tax-report">Tax Reports</Link>
                </div>
              )}
            </li>
            
            {/* Settings Dropdown - TASK-075, 076 (enhanced with admin tools) */}
            <li className="dropdown-menu"
                onMouseEnter={() => setSettingsMenuOpen(true)}
                onMouseLeave={() => setSettingsMenuOpen(false)}
            >
              <button className="dropdown-button">Settings</button>
              {settingsMenuOpen && (
                <div className="dropdown-menu-content">
                  <Link to="/settings/custom-fields">Custom Fields</Link>
                  <Link to="/notifications">Notifications</Link>
                  <Link to="/admin/activity-logs">Activity Logs</Link>
                  <Link to="/admin/system-logs">System Logs</Link>
                </div>
              )}
            </li>
          </div>
          <li><button onClick={handleLogout} className="logout-button" data-testid="logout-button">Logout</button></li>
        </ul>
      </nav>
      <main>
        {/* TASK-084: Suspense boundary for all lazy-loaded route components */}
        <Suspense fallback={<SuspenseFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

function App() {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<HomePage />} />

      {/* Protected Routes - TASK-084: Code splitting with React.lazy() */}
      {/* Suspense boundary is in MainLayout for all lazy-loaded components */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/tasks" element={<TaskDashboard />} />
          <Route path="/time-tracking" element={<TimeTracking />} />
          <Route path="/tasks/new" element={<TaskForm />} />
          <Route path="/tasks/admin" element={<TaskAdministration />} />
          <Route path="/tasks/types" element={<TaskTypeSettings />} />
          <Route path="/tasks/calendar" element={<TaskCalendar />} />
          <Route path="/posts" element={<PostList />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/new" element={<ContactForm />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/contacts/:id/edit" element={<ContactForm />} />
          
          {/* Account Management Routes - Phase 2 */}
          <Route path="/accounts" element={<AccountList />} />
          <Route path="/accounts/new" element={<AccountForm />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/accounts/:id/edit" element={<AccountForm />} />
          
          {/* Quote Management Routes - Phase 2 */}
          <Route path="/quotes" element={<QuoteList />} />
          <Route path="/quotes/new" element={<QuoteForm />} />
          <Route path="/quotes/:id" element={<QuoteDetail />} />
          <Route path="/quotes/:id/edit" element={<QuoteForm />} />
          
          {/* Interaction Management Routes - Phase 2 */}
          <Route path="/interactions" element={<InteractionList />} />
          <Route path="/interactions/new" element={<InteractionForm />} />
          
          {/* Activity Timeline Route - Phase 2 */}
          <Route path="/activity-timeline" element={<ActivityTimelinePage />} />
          
          {/* AI/Analytics Routes - Phase 3 */}
          <Route path="/analytics/deal-predictions" element={<DealPredictions />} />
          <Route path="/analytics/deal-predictions/:dealId" element={<DealPredictions />} />
          <Route path="/analytics/customer-lifetime-value" element={<CustomerLifetimeValue />} />
          <Route path="/analytics/customer-lifetime-value/:contactId" element={<CustomerLifetimeValue />} />
          <Route path="/analytics/revenue-forecast" element={<RevenueForecast />} />
          <Route path="/analytics/snapshots" element={<AnalyticsSnapshots />} />
          
          {/* Project Templates Routes - Phase 3 */}
          <Route path="/project-templates" element={<ProjectTemplateList />} />
          <Route path="/project-templates/new" element={<ProjectTemplateForm />} />
          <Route path="/project-templates/:id/edit" element={<ProjectTemplateForm />} />
          
          <Route path="/deals/:id" element={<DealDetail />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/invoicing" element={<Invoicing />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/technicians" element={<TechnicianManagement />} />
          <Route path="/technician-payroll" element={<TechnicianPayroll />} />
          <Route path="/technician-payroll/:id" element={<TechnicianPayroll />} />
          <Route path="/certifications" element={<CertificationList />} />
          <Route path="/certifications/new" element={<CertificationForm />} />
          <Route path="/certifications/:id/edit" element={<CertificationForm />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/settings/custom-fields" element={<CustomFieldsSettings />} />
          <Route path="/settings/user-roles" element={<UserRoleManagement />} />
          <Route path="/kb" element={<KnowledgeBase />} />
          <Route path="/kb/:fileName" element={<MarkdownViewer />} />

          {/* Accounting Feature Routes */}
          <Route path="/ledger-accounts" element={<LedgerAccountList />} />
          <Route path="/ledger-accounts/new" element={<LedgerAccountForm />} />
          <Route path="/journal-entries" element={<JournalEntryList />} />
          <Route path="/journal-entries/new" element={<JournalEntryForm />} />
          <Route path="/work-orders/list" element={<WorkOrderList />} />
          <Route path="/work-orders/new" element={<WorkOrderForm />} />
          <Route path="/line-items" element={<LineItemList />} />
          <Route path="/line-items/new" element={<LineItemForm />} />
          <Route path="/payments" element={<PaymentList />} />
          <Route path="/payments/new" element={<PaymentForm />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/email-communication" element={<EmailCommunication />} />
          
          {/* Expense & Budget Management */}
          <Route path="/expenses" element={<ExpenseList />} />
          <Route path="/expenses/new" element={<ExpenseForm />} />
          <Route path="/expenses/:id/edit" element={<ExpenseForm />} />
          <Route path="/budgets" element={<BudgetList />} />
          <Route path="/budgets/new" element={<BudgetForm />} />
          <Route path="/budgets/:id/edit" element={<BudgetForm />} />
          <Route path="/tax-report" element={<TaxReport />} />

          {/* Field Service Management Routes - Consolidated */}
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/scheduling-dashboard" element={<SchedulingDashboard />} />
          <Route path="/paperwork-templates" element={<PaperworkTemplateManager />} />
          <Route path="/customer-portal" element={<CustomerPortal />} />
          <Route path="/appointment-requests" element={<AppointmentRequestQueue />} />
          <Route path="/digital-signature" element={<DigitalSignaturePad />} />
          <Route path="/digital-signature/:workOrderId" element={<DigitalSignaturePad />} />
          
          {/* Phase 4: Blog CMS Routes - TASK-060 */}
          <Route path="/blog" element={<BlogPostList />} />
          <Route path="/blog/new" element={<BlogPostForm />} />
          <Route path="/blog/:id" element={<PostDetail />} />
          <Route path="/blog/:id/edit" element={<BlogPostForm />} />
          
          {/* Phase 4: CMS Pages Routes - TASK-065, 066 */}
          <Route path="/pages" element={<PageList />} />
          <Route path="/pages/new" element={<PageForm />} />
          <Route path="/pages/:id/edit" element={<PageForm />} />
          
          {/* Phase 4: Tags Route - TASK-068 */}
          <Route path="/tags" element={<TagManagerPage />} />
          
          {/* Phase 4: Notifications Route - TASK-070 */}
          <Route path="/notifications" element={<NotificationCenter />} />
          
          {/* Phase 4: Admin Routes - TASK-072, 074 */}
          <Route path="/admin/activity-logs" element={<ActivityLogList />} />
          <Route path="/admin/system-logs" element={<SystemLogsList />} />
          
          {/* Route Redirects for Backward Compatibility - TASK-009 */}
          <Route path="/scheduling" element={<SchedulePage />} />
          <Route path="/field-service" element={<SchedulingDashboard />} />
        </Route>
      </Route>

      {/* This is a catch-all for any routes not defined above */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

export default App;
