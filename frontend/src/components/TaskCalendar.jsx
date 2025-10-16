import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import apiClient, { getProjects, updateProject, createProject } from '../api';
import './TaskCalendar.css';

const localizer = momentLocalizer(moment);

const TaskCalendar = () => {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    // Convert tasks to calendar events
    if (Array.isArray(tasks)) {
      const calendarEvents = tasks.map(task => ({
        id: task.id,
        title: task.title,
        start: new Date(task.due_date),
        end: new Date(task.due_date),
        resource: task,
        className: getEventClassName(task)
      }));
      setEvents(calendarEvents);
    }
  }, [tasks]);

  const loadTasks = async () => {
    try {
  const response = await getProjects();
      setTasks(response.data);
    } catch (_err) {
      console.error('Error loading tasks:', _err);
    }
  };

  const getEventClassName = (task) => {
    if (task.status === 'completed') return 'task-completed';
    if (task.is_overdue) return 'task-overdue';
    if (task.priority === 'urgent') return 'task-urgent';
    if (task.priority === 'high') return 'task-high';
    return 'task-normal';
  };

  const handleSelectEvent = (event) => {
    setSelectedTask(event.resource);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedTask({
      title: '',
      description: '',
      due_date: moment(start).format('YYYY-MM-DD'),
      priority: 'medium',
      task_type: 'other',
      status: 'pending'
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (isEditing) {
        await updateProject(selectedTask.id, taskData);
      } else {
        await createProject(taskData);
      }
      setShowModal(false);
      setSelectedTask(null);
      loadTasks();
    } catch (_err) {
      console.error('Error saving task:', _err);
    }
  };

  const eventStyleGetter = (event, _start, _end, _isSelected) => {
    const task = event.resource;
    let backgroundColor = '#3174ad';

    if (task.status === 'completed') backgroundColor = '#28a745';
    else if (task.is_overdue) backgroundColor = '#dc3545';
    else if (task.priority === 'urgent') backgroundColor = '#fd7e14';
    else if (task.priority === 'high') backgroundColor = '#ffc107';

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  return (
    <div className="task-calendar-container">
      <div className="calendar-header">
        <h2>Task Calendar</h2>
        <div className="calendar-legend">
          <span className="legend-item">
            <span className="legend-color task-completed"></span>
            Completed
          </span>
          <span className="legend-item">
            <span className="legend-color task-overdue"></span>
            Overdue
          </span>
          <span className="legend-item">
            <span className="legend-color task-urgent"></span>
            Urgent
          </span>
          <span className="legend-item">
            <span className="legend-color task-high"></span>
            High Priority
          </span>
          <span className="legend-item">
            <span className="legend-color task-normal"></span>
            Normal
          </span>
        </div>
      </div>

      <div className="calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
          popup
        />
      </div>

      {showModal && (
        <TaskModal
          task={selectedTask}
          isEditing={isEditing}
          onSave={handleSaveTask}
          onClose={() => {
            setShowModal(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

const TaskModal = ({ task, isEditing, onSave, onClose }) => {
  const defaultTask = {
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    status: 'pending',
    task_type: ''
  };

  const [formData, setFormData] = useState({ ...defaultTask, ...task });
  const modalRef = React.useRef(null);
  const previouslyFocusedRef = React.useRef(null);
  const [taskTypes, setTaskTypes] = useState([]);

  useEffect(() => {
    setFormData({ ...defaultTask, ...task });
  }, [task]);

  useEffect(() => {
    const fetchTaskTypes = async () => {
        try {
            const response = await apiClient.get('/api/task-types/');
            const activeTypes = response.data.results
                ? response.data.results.filter(t => t.is_active)
                : response.data.filter(t => t.is_active);
            setTaskTypes(activeTypes);
            // Set a default if the current one is not set or invalid
            if (!formData.task_type && activeTypes.length > 0) {
                setFormData(prev => ({ ...prev, task_type: activeTypes[0].id }));
            }
        } catch (_err) {
            console.error("Failed to fetch task types for modal", _err);
        }
    };
    fetchTaskTypes();
  }, []);

  // Focus trap and restoration
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;
    const modalEl = modalRef.current;
    if (!modalEl) return;
    const focusableSelectors = [
      'a[href]','button:not([disabled])','textarea','input','select','[tabindex]:not([tabindex="-1"])'
    ];
    const focusables = modalEl.querySelectorAll(focusableSelectors.join(','));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!modalEl.hasAttribute('tabindex')) modalEl.setAttribute('tabindex', '-1');
    if (first) first.focus(); else modalEl.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && focusables.length > 0) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    modalEl.addEventListener('keydown', handleKeyDown);
    return () => {
      modalEl.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedRef.current && typeof previouslyFocusedRef.current.focus === 'function') {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
      <div className="modal-content" ref={modalRef} aria-describedby="task-modal-desc">
        <div className="modal-header">
          <h3 id="task-modal-title">{isEditing ? 'Edit Task' : 'Create New Task'}</h3>
          <p id="task-modal-desc" className="sr-only">Create or edit a scheduled task. Press Escape to close.</p>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="task-title">Title</label>
            <input
              type="text"
              id="task-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-due-date">Due Date</label>
              <input
                type="date"
                id="task-due-date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select id="task-priority" name="priority" value={formData.priority || 'medium'} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-type">Type</label>
              <select id="task-type" name="task_type" value={formData.task_type} onChange={handleChange} required>
                <option value="">Select a Type</option>
                {taskTypes.map(type => (
                    <option key={type.id} value={type.id}>
                        {type.name}
                    </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select id="task-status" name="status" value={formData.status || 'pending'} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-save">
              {isEditing ? 'Update' : 'Create'} Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCalendar;
