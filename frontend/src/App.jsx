import React, { useState, useContext } from 'react';
import { Route, Routes, Link, useNavigate, Outlet } from 'react-router-dom';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './components/HomePage';
import PostList from './components/PostList';
import PostDetail from './components/PostDetail';
import Contacts from './components/Contacts';
import ContactDetail from './components/ContactDetail';
import ContactForm from './components/ContactForm';
import DashboardPage from './components/DashboardPage';
import CustomFieldsSettings from './components/CustomFieldsSettings';
import UserRoleManagement from './components/UserRoleManagement';
import TaskDashboard from './components/TaskDashboard';
import TaskForm from './components/TaskForm';
import TaskAdministration from './components/TaskAdministration';
import TaskTypeSettings from './components/TaskTypeSettings';
import SearchPage from './components/SearchPage';
import MarkdownViewer from './components/MarkdownViewer';
import KnowledgeBase from './components/KnowledgeBase';
import DealDetail from './components/DealDetail';
import WorkOrders from './components/WorkOrders';
import Invoicing from './components/Invoicing';
import Accounting from './components/Accounting';
import Staff from './components/Staff';
import Chat from './components/Chat';
import Resources from './components/Resources';
import Deals from './components/Deals';
import Orders from './components/Orders';
import Warehouse from './components/Warehouse';
import './App.css';
import AuthContext from './contexts/AuthContext';

// This component contains the main application layout with navigation
const MainLayout = () => {
  const navigate = useNavigate();
  const [legacyMenuOpen, setLegacyMenuOpen] = useState(false);
  const [resourcesMenuOpen, setResourcesMenuOpen] = useState(false);
  const [tasksMenuOpen, setTasksMenuOpen] = useState(false);

  const handleLogout = () => {
    // We can get logout from context now, but this is also fine
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div className="container">
      <nav>
        <ul>
          <div className="nav-links">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li 
              className="dropdown-menu"
              onMouseEnter={() => setResourcesMenuOpen(true)}
              onMouseLeave={() => setResourcesMenuOpen(false)}
            >
              <button className="dropdown-button">Resources</button>
              {resourcesMenuOpen && (
                <div className="dropdown-menu-content">
                  <Link to="/resources">Company Resources</Link>
                  <Link to="/kb">Knowledge Base</Link>
                </div>
              )}
            </li>
            <li><Link to="/contacts">Contacts</Link></li>
            <li><Link to="/deals">Deals</Link></li>
            <li
              className="dropdown-menu"
              onMouseEnter={() => setTasksMenuOpen(true)}
              onMouseLeave={() => setTasksMenuOpen(false)}
            >
              <button className="dropdown-button">Tasks</button>
              {tasksMenuOpen && (
                <div className="dropdown-menu-content">
                  <Link to="/tasks">Task Dashboard</Link>
                  <Link to="/tasks/admin">Task Templates</Link>
                  <Link to="/tasks/types" element={<TaskTypeSettings />}>Manage Types</Link>
                </div>
              )}
            </li>
            <li><Link to="/orders">Orders</Link></li>
            <li><Link to="/warehouse">Warehouse</Link></li>
            <li><Link to="/staff">Staff</Link></li>
            <li 
              className="dropdown-menu"
              onMouseEnter={() => setLegacyMenuOpen(true)}
              onMouseLeave={() => setLegacyMenuOpen(false)}
            >
              <button className="dropdown-button">Legacy</button>
              {legacyMenuOpen && (
                <div className="dropdown-menu-content">
                  <Link to="/posts">Posts</Link>
                  <Link to="/search">Search</Link>
                  <Link to="/settings/custom-fields">Custom Fields</Link>
                  <Link to="/settings/user-roles">User Roles</Link>
                  <Link to="/chat">Chat</Link>
                </div>
              )}
            </li>
          </div>
          <li><button onClick={handleLogout} className="logout-button">Logout</button></li>
        </ul>
      </nav>
      <main>
        {/* The Outlet component renders the matched child route's element */}
        <Outlet />
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

      {/* Protected Routes */}
      {/* All routes within this ProtectedRoute will render inside the MainLayout's <Outlet> */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/tasks" element={<TaskDashboard />} />
          <Route path="/tasks/new" element={<TaskForm />} />
          <Route path="/tasks/admin" element={<TaskAdministration />} />
          <Route path="/tasks/types" element={<TaskTypeSettings />} />
          <Route path="/posts" element={<PostList />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/new" element={<ContactForm />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/contacts/:id/edit" element={<ContactForm />} />
          <Route path="/deals/:id" element={<DealDetail />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/invoicing" element={<Invoicing />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/settings/custom-fields" element={<CustomFieldsSettings />} />
          <Route path="/settings/user-roles" element={<UserRoleManagement />} />
          <Route path="/kb" element={<KnowledgeBase />} />
          <Route path="/kb/:fileName" element={<MarkdownViewer />} />
        </Route>
      </Route>

      {/* This is a catch-all for any routes not defined above */}
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

export default App;
