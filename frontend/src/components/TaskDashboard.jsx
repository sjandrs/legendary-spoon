import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { getTasks, getActivityLogs } from '../api';
import TaskCalendar from './TaskCalendar';
import ActivityTimeline from './ActivityTimeline';
import AuthContext from '../contexts/AuthContext';
import './TaskDashboard.css';

const TaskDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('calendar');
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    upcomingWeek: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaskStats();
  }, []);

  const loadTaskStats = async () => {
    try {
      setLoading(true);
      const [tasksResponse, overdueResponse, upcomingResponse] = await Promise.all([
        getTasks(),
        getTasks('/api/tasks/overdue/'),
        getTasks('/api/tasks/upcoming/')
      ]);

      const tasks = Array.isArray(tasksResponse.data) ? tasksResponse.data : tasksResponse.data.results || [];
      const overdueTasks = Array.isArray(overdueResponse.data) ? overdueResponse.data : overdueResponse.data.results || [];
      const upcomingTasks = Array.isArray(upcomingResponse.data) ? upcomingResponse.data : upcomingResponse.data.results || [];

      const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: overdueTasks.length,
        upcomingWeek: upcomingTasks.length
      };

      setTaskStats(stats);
      
      // Get recent tasks (last 5)
      const sortedTasks = tasks
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0, 5);
      setRecentTasks(sortedTasks);

    } catch (error) {
      console.error('Error loading task stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'in_progress':
        return '#007bff';
      case 'pending':
        return '#ffc107';
      case 'cancelled':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return '#dc3545';
      case 'high':
        return '#fd7e14';
      case 'medium':
        return '#007bff';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const StatCard = ({ title, value, color, icon }) => (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="task-dashboard loading">Loading dashboard...</div>;
  }

  return (
    <div className="task-dashboard">
      <div className="dashboard-header">
        <h1>Task & Activity Management</h1>
        <div className="header-actions">
          <button 
            onClick={() => window.location.reload()} 
            className="refresh-btn"
          >
            🔄 Refresh
          </button>
          {user && user.is_superuser && (
            <Link to="/tasks/admin" className="settings-btn" title="Task Settings">
              ⚙️
            </Link>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Tasks"
          value={taskStats.total}
          color="#007bff"
          icon="📋"
        />
        <StatCard
          title="Pending"
          value={taskStats.pending}
          color="#ffc107"
          icon="⏳"
        />
        <StatCard
          title="In Progress"
          value={taskStats.inProgress}
          color="#17a2b8"
          icon="🔄"
        />
        <StatCard
          title="Completed"
          value={taskStats.completed}
          color="#28a745"
          icon="✅"
        />
        <StatCard
          title="Overdue"
          value={taskStats.overdue}
          color="#dc3545"
          icon="⚠️"
        />
        <StatCard
          title="Due This Week"
          value={taskStats.upcomingWeek}
          color="#fd7e14"
          icon="📅"
        />
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          📅 Calendar View
        </button>
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📝 Task List
        </button>
        <button
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          ⏱️ Activity Timeline
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'calendar' && (
          <div className="tab-panel">
            <TaskCalendar />
          </div>
        )}

        {activeTab === 'list' && (
          <div className="tab-panel">
            <div className="task-list-container">
              <div className="task-list-header">
                <h3>Recent Tasks</h3>
                <a href="/tasks" className="view-all-link">View All Tasks →</a>
              </div>
              
              {recentTasks.length === 0 ? (
                <div className="no-tasks">
                  <p>No tasks found. Create your first task to get started!</p>
                </div>
              ) : (
                <div className="task-list">
                  {recentTasks.map(task => (
                    <div key={task.id} className="task-item">
                      <div className="task-header">
                        <h4 className="task-title">{task.title}</h4>
                        <div className="task-meta">
                          <span 
                            className="task-priority"
                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                          >
                            {task.priority}
                          </span>
                          <span 
                            className="task-status"
                            style={{ color: getStatusColor(task.status) }}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="task-details">
                        {task.description && (
                          <p className="task-description">{task.description}</p>
                        )}
                        <div className="task-info">
                          <span className="task-type">📋 {task.task_type.replace('_', ' ')}</span>
                          {task.due_date && (
                            <span className={`task-due ${task.is_overdue ? 'overdue' : ''}`}>
                              📅 Due: {new Date(task.due_date).toLocaleDateString()}
                              {task.is_overdue && ' (Overdue!)'}
                            </span>
                          )}
                          {task.assigned_to_name && (
                            <span className="task-assignee">
                              👤 {task.assigned_to_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="tab-panel">
            <ActivityTimeline limit={50} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDashboard;