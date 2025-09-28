import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { post, get } from '../api';

const TaskForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Pre-populate contact from navigation state if available
    const { contactId, contactName } = location.state || {};

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

    useEffect(() => {
        // Fetch users for the "Assign To" dropdown
        get('/api/user-roles/')
            .then(response => {
                const userList = Array.isArray(response.data.users) ? response.data.users : [];
                setUsers(userList);
                // Optionally, set a default assignee (e.g., the current user)
            })
            .catch(err => {
                console.error("Failed to fetch users", err);
                setError("Could not load user list for assignment.");
            });

        // Fetch task types
        get('/api/task-types/')
            .then(response => {
                const activeTypes = response.data.results ? response.data.results.filter(t => t.is_active) : response.data.filter(t => t.is_active);
                setTaskTypes(activeTypes);
                if (activeTypes.length > 0) {
                    setTaskType(activeTypes[0].id);
                }
            })
            .catch(err => {
                console.error("Failed to fetch task types", err);
                setError(prev => prev ? `${prev} And could not load task types.` : "Could not load task types.");
            });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!title || !dueDate || !assignedTo || !taskType) {
            setError("Title, Due Date, Assigned To, and Task Type are required.");
            return;
        }

        const taskData = {
            title,
            description,
            due_date: dueDate,
            priority,
            task_type: taskType,
            assigned_to: assignedTo,
            contact: contactId, // Link to the contact
        };

        try {
            await post('/api/tasks/', taskData);
            setSuccess('Task created successfully!');
            // Clear form
            setTitle('');
            setDescription('');
            setDueDate('');
            // Optionally navigate away after a delay
            setTimeout(() => navigate('/tasks'), 2000);
        } catch (err) {
            console.error("Failed to create task", err);
            setError('Failed to create task. Please check the details and try again.');
        }
    };

    return (
        <div>
            <h2>Create New Task</h2>
            {contactName && <h3>For Contact: {contactName}</h3>}
            
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div>
                    <label>Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)}></textarea>
                </div>
                <div>
                    <label>Due Date</label>
                    <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                </div>
                <div>
                    <label>Priority</label>
                    <select value={priority} onChange={e => setPriority(e.target.value)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <div>
                    <label>Task Type</label>
                    <select value={taskType} onChange={e => setTaskType(e.target.value)} required>
                        <option value="">Select a type</option>
                        {taskTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Assign To</label>
                    <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
                        <option value="">Select a user</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="button">Create Task</button>
            </form>
        </div>
    );
};

export default TaskForm;
