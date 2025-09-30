import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import AuthContext from '../contexts/AuthContext';
import './TaskForm.css';

const TaskForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const { contact } = location.state || {};

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [taskType, setTaskType] = useState('');
    const [taskTypes, setTaskTypes] = useState([]);
    const [assignedTo, setAssignedTo] = useState('');
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [contactDetails, setContactDetails] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [usersResponse, taskTypesResponse] = await Promise.all([
                    api.get('/api/user-roles/'),
                    api.get('/api/project-types/')
                ]);

                const userList = Array.isArray(usersResponse.data.users) ? usersResponse.data.users : [];
                setUsers(userList);

                if (user && userList.some(u => u.id === user.id)) {
                    setAssignedTo(user.id);
                }

                const activeTypes = (taskTypesResponse.data.results || taskTypesResponse.data).filter(t => t.is_active);
                setTaskTypes(activeTypes);

                if (activeTypes.length > 0) {
                    setTaskType(activeTypes[0].id);
                }

                if (contact && contact.id) {
                    const contactResponse = await api.get(`/api/contacts/${contact.id}/`);
                    setContactDetails(contactResponse.data);
                }

            } catch (err) {
                console.error("Failed to fetch initial data", err);
                setError("Failed to load necessary data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [user, contact]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!title || !dueDate || !assignedTo || !taskType) {
            setError("Title, Due Date, Assigned To, and Task Type are required.");
            return;
        }

        const projectData = {
            title,
            description,
            due_date: dueDate,
            priority,
            task_type: taskType,
            assigned_to: assignedTo,
            contact: contactDetails ? contactDetails.id : null,
            account: contactDetails ? contactDetails.account?.id : null,
        };

        try {
            await api.post('/api/projects/', projectData);
            setSuccess('Task created successfully! Redirecting...');
            setTitle('');
            setDescription('');
            setDueDate('');
            setTimeout(() => navigate('/tasks'), 2000);
        } catch (err) {
            console.error("Failed to create task", err);
            const errorMessage = err.response?.data?.detail || 'Failed to create task. Please check the details and try again.';
            setError(errorMessage);
        }
    };

    if (isLoading) {
        return <div className="task-form-container"><h2>Loading Form...</h2></div>;
    }

    return (
        <div className="task-form-container">
            <h2>Create New Task</h2>

            {contactDetails && (
                <div className="task-form-contact-card">
                    <div className="contact-avatar">
                        {contactDetails.first_name && contactDetails.last_name
                            ? `${contactDetails.first_name[0]}${contactDetails.last_name[0]}`.toUpperCase()
                            : <span>👤</span>}
                    </div>
                    <div className="contact-card-details">
                        <div className="contact-card-name">{contactDetails.first_name} {contactDetails.last_name}</div>
                        <div className="contact-card-row"><span className="contact-card-label">Email:</span> {contactDetails.email || <span className="contact-card-faded">N/A</span>}</div>
                        <div className="contact-card-row"><span className="contact-card-label">Phone:</span> {contactDetails.phone_number || <span className="contact-card-faded">N/A</span>}</div>
                        {contactDetails.account && (
                            <div className="contact-card-row"><span className="contact-card-label">Account:</span> {contactDetails.account.name}</div>
                        )}
                    </div>
                </div>
            )}

            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <form onSubmit={handleSubmit} className="task-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="title">Title</label>
                        <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="due-date">Due Date</label>
                        <input id="due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="task-type">Task Type</label>
                        <select id="task-type" value={taskType} onChange={e => setTaskType(e.target.value)} required>
                            <option value="">Select a type</option>
                            {taskTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="priority">Priority</label>
                        <select id="priority" value={priority} onChange={e => setPriority(e.target.value)}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="assign-to">Assign To</label>
                        <select id="assign-to" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
                            <option value="">Select a user</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.username}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group full-width">
                    <label htmlFor="description">Description</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)}></textarea>
                </div>

                <button type="submit" className="submit-btn">Create Task</button>
            </form>
        </div>
    );
};

export default TaskForm;
