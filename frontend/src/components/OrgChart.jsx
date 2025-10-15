import React, { useState, useEffect, useRef } from 'react';
import { getEnhancedUsers } from '../api';
import LoadingSkeleton from './LoadingSkeleton';
import './OrgChart.css';

const OrgChart = ({ departmentFilter = null, onUserSelect }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('tree'); // 'tree', 'grid', 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(departmentFilter || '');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getEnhancedUsers();
      const userData = response.data.results || response.data || [];

      setUsers(userData);

      // Auto-expand root level nodes
      const rootUsers = userData.filter(user => !user.manager);
      setExpandedNodes(new Set(rootUsers.map(user => user.id)));

    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load organizational data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = React.useCallback(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.job_title && user.job_title.toLowerCase().includes(term)) ||
        (user.department && user.department.toLowerCase().includes(term))
      );
    }

    // Apply department filter
    if (selectedDepartment) {
      filtered = filtered.filter(user => user.department === selectedDepartment);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedDepartment]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const buildHierarchy = (parentId = null) => {
    return filteredUsers
      .filter(user => user.manager === parentId)
      .map(user => ({
        ...user,
        children: buildHierarchy(user.id)
      }))
      .sort((a, b) => {
        // Sort by job level (higher first), then by name
        const levelA = getJobLevel(a.job_title);
        const levelB = getJobLevel(b.job_title);
        if (levelA !== levelB) return levelB - levelA;
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      });
  };

  const getJobLevel = (jobTitle) => {
    if (!jobTitle) return 0;
    const title = jobTitle.toLowerCase();
    if (title.includes('ceo') || title.includes('president')) return 10;
    if (title.includes('cto') || title.includes('cfo') || title.includes('coo')) return 9;
    if (title.includes('director') || title.includes('vp')) return 8;
    if (title.includes('manager')) return 7;
    if (title.includes('lead') || title.includes('supervisor')) return 6;
    if (title.includes('senior')) return 5;
    if (title.includes('technician') || title.includes('specialist')) return 4;
    return 3;
  };

  const toggleNodeExpansion = (userId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
      // Also collapse all descendants
      const collapseDescendants = (nodeId) => {
        const children = filteredUsers.filter(u => u.manager === nodeId);
        children.forEach(child => {
          newExpanded.delete(child.id);
          collapseDescendants(child.id);
        });
      };
      collapseDescendants(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  const expandAll = () => {
    setExpandedNodes(new Set(filteredUsers.map(user => user.id)));
  };

  const collapseAll = () => {
    const rootUsers = filteredUsers.filter(user => !user.manager);
    setExpandedNodes(new Set(rootUsers.map(user => user.id)));
  };

  const getDepartments = () => {
    const departments = [...new Set(users.map(user => user.department).filter(Boolean))];
    return departments.sort();
  };

  const getDirectReports = (managerId) => {
    return filteredUsers.filter(user => user.manager === managerId);
  };

  const getManagerChain = (user) => {
    const chain = [user];
    let current = user;
    while (current.manager) {
      const manager = filteredUsers.find(u => u.id === current.manager);
      if (manager) {
        chain.unshift(manager);
        current = manager;
      } else {
        break;
      }
    }
    return chain;
  };

  // Tree View Component
  const TreeNode = ({ user, level = 0 }) => {
    const hasChildren = user.children && user.children.length > 0;
    const isExpanded = expandedNodes.has(user.id);
    const directReports = getDirectReports(user.id);

    return (
      <div className={`tree-node level-${level}`}>
        <div
          className={`tree-node-content ${selectedUser?.id === user.id ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 24}px` }}
        >
          {hasChildren && (
            <button
              className={`expand-button ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleNodeExpansion(user.id)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={isExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
              </svg>
            </button>
          )}

          <div
            className="user-info"
            onClick={() => handleUserClick(user)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleUserClick(user)}
          >
            <div className="user-avatar">
              {user.photo ? (
                <img src={user.photo} alt={`${user.first_name} ${user.last_name}`} />
              ) : (
                <div className="avatar-placeholder">
                  {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                </div>
              )}
            </div>

            <div className="user-details">
              <div className="user-name">{user.first_name} {user.last_name}</div>
              <div className="user-title">{user.job_title || 'No title specified'}</div>
              {user.department && (
                <div className="user-department">{user.department}</div>
              )}
              {directReports.length > 0 && (
                <div className="reports-count">
                  {directReports.length} direct report{directReports.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="user-status">
              <span className={`status-indicator ${user.is_active ? 'active' : 'inactive'}`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="tree-children">
            {user.children.map(child => (
              <TreeNode key={child.id} user={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Grid View Component
  const GridView = () => {
    const hierarchy = buildHierarchy();

    return (
      <div className="grid-view">
        {hierarchy.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    );
  };

  const UserCard = ({ user }) => {
    const directReports = getDirectReports(user.id);

    return (
      <div className="user-card" onClick={() => handleUserClick(user)}>
        <div className="card-header">
          <div className="user-avatar">
            {user.photo ? (
              <img src={user.photo} alt={`${user.first_name} ${user.last_name}`} />
            ) : (
              <div className="avatar-placeholder">
                {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="card-status">
            <span className={`status-indicator ${user.is_active ? 'active' : 'inactive'}`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="card-body">
          <h3 className="user-name">{user.first_name} {user.last_name}</h3>
          <p className="user-title">{user.job_title || 'No title specified'}</p>
          {user.department && (
            <p className="user-department">{user.department}</p>
          )}
          <p className="user-email">{user.email}</p>

          {directReports.length > 0 && (
            <div className="reports-section">
              <p className="reports-count">
                {directReports.length} Direct Report{directReports.length !== 1 ? 's' : ''}
              </p>
              <div className="reports-preview">
                {directReports.slice(0, 3).map(report => (
                  <div key={report.id} className="report-avatar" title={`${report.first_name} ${report.last_name}`}>
                    {report.photo ? (
                      <img src={report.photo} alt={`${report.first_name} ${report.last_name}`} />
                    ) : (
                      <div className="avatar-placeholder small">
                        {report.first_name?.charAt(0)}{report.last_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
                {directReports.length > 3 && (
                  <div className="more-reports">+{directReports.length - 3}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // List View Component
  const ListView = () => {
    return (
      <div className="list-view">
        <div className="list-header">
          <div className="list-column">Name</div>
          <div className="list-column">Title</div>
          <div className="list-column">Department</div>
          <div className="list-column">Manager</div>
          <div className="list-column">Reports</div>
          <div className="list-column">Status</div>
        </div>

        {filteredUsers.map(user => {
          const manager = user.manager ? filteredUsers.find(u => u.id === user.manager) : null;
          const directReports = getDirectReports(user.id);

          return (
            <div
              key={user.id}
              className={`list-row ${selectedUser?.id === user.id ? 'selected' : ''}`}
              onClick={() => handleUserClick(user)}
            >
              <div className="list-column name-column">
                <div className="user-avatar small">
                  {user.photo ? (
                    <img src={user.photo} alt={`${user.first_name} ${user.last_name}`} />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="user-name">{user.first_name} {user.last_name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>

              <div className="list-column">{user.job_title || '—'}</div>
              <div className="list-column">{user.department || '—'}</div>
              <div className="list-column">
                {manager ? `${manager.first_name} ${manager.last_name}` : '—'}
              </div>
              <div className="list-column">{directReports.length}</div>
              <div className="list-column">
                <span className={`status-indicator ${user.is_active ? 'active' : 'inactive'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && !users.length) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="org-chart space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Chart</h1>
          <p className="text-gray-600">
            Visualize team structure and relationships across the organization
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Mode Selector */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="Tree View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 text-sm font-medium border-t border-b ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="Grid View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="List View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={fetchUsers}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search by name, email, title, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department Filter */}
          <div className="min-w-48">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {getDepartments().map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Tree Controls */}
          {viewMode === 'tree' && (
            <div className="flex space-x-2">
              <button
                onClick={expandAll}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-3 rounded text-sm"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded text-sm"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mt-2 text-sm text-gray-500">
          Showing {filteredUsers.length} of {users.length} team members
          {selectedDepartment && ` in ${selectedDepartment}`}
        </div>
      </div>

      {/* Chart Content */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6" ref={chartRef}>
        {filteredUsers.length > 0 ? (
          <>
            {viewMode === 'tree' && (
              <div className="tree-view">
                {buildHierarchy().map(user => (
                  <TreeNode key={user.id} user={user} />
                ))}
              </div>
            )}

            {viewMode === 'grid' && <GridView />}

            {viewMode === 'list' && <ListView />}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">
              {searchTerm || selectedDepartment
                ? 'No team members match your current filters.'
                : 'No team members found.'
              }
            </p>
            {(searchTerm || selectedDepartment) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDepartment('');
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          managerChain={getManagerChain(selectedUser)}
          directReports={getDirectReports(selectedUser.id)}
          onClose={() => setShowUserDetails(false)}
        />
      )}
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, managerChain, directReports, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Team Member Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Profile */}
          <div className="flex items-start space-x-4">
            <div className="user-avatar large">
              {user.photo ? (
                <img src={user.photo} alt={`${user.first_name} ${user.last_name}`} />
              ) : (
                <div className="avatar-placeholder">
                  {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h4 className="text-xl font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </h4>
              <p className="text-gray-600">{user.job_title || 'No title specified'}</p>
              {user.department && (
                <p className="text-gray-500">{user.department}</p>
              )}
              <div className="mt-2">
                <span className={`status-indicator ${user.is_active ? 'active' : 'inactive'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h5 className="text-sm font-medium text-gray-900 mb-2">Contact Information</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Email:</span>
                <div className="font-medium">{user.email}</div>
              </div>
              {user.phone && (
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <div className="font-medium">{user.phone}</div>
                </div>
              )}
            </div>
          </div>

          {/* Manager Chain */}
          {managerChain.length > 1 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Reporting Chain</h5>
              <div className="flex items-center space-x-2 text-sm">
                {managerChain.map((person, index) => (
                  <React.Fragment key={person.id}>
                    <span className={index === managerChain.length - 1 ? 'font-medium' : 'text-gray-600'}>
                      {person.first_name} {person.last_name}
                    </span>
                    {index < managerChain.length - 1 && (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Direct Reports */}
          {directReports.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">
                Direct Reports ({directReports.length})
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {directReports.map(report => (
                  <div key={report.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <div className="user-avatar small">
                      {report.photo ? (
                        <img src={report.photo} alt={`${report.first_name} ${report.last_name}`} />
                      ) : (
                        <div className="avatar-placeholder">
                          {report.first_name?.charAt(0)}{report.last_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {report.first_name} {report.last_name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {report.job_title || 'No title'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Details */}
          {(user.hire_date || user.notes) && (
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h5>
              <div className="space-y-2 text-sm">
                {user.hire_date && (
                  <div>
                    <span className="text-gray-600">Hire Date:</span>
                    <div className="font-medium">
                      {new Date(user.hire_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
                {user.notes && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <div className="font-medium">{user.notes}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrgChart;
