import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import './TaskTypeSettings.css';

const TaskTypeSettings = () => {
    const [taskTypes, setTaskTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingType, setEditingType] = useState(null);
    const [newTypeName, setNewTypeName] = useState('');

    useEffect(() => {
        fetchTaskTypes();
    }, []);

    const fetchTaskTypes = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get('/api/task-types/');
            setTaskTypes(response.data.results || response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load task types. You may not have the required permissions.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTypeName.trim()) return;

        try {
            await apiClient.post('/api/task-types/', { name: newTypeName, is_active: true });
            setNewTypeName('');
            fetchTaskTypes();
        } catch (err) {
            setError(`Failed to create task type. ${err.response?.data?.name?.[0] || ''}`);
            console.error(err);
        }
    };

    const handleUpdate = async (type) => {
        try {
            await apiClient.put(`/api/task-types/${type.id}/`, type);
            setEditingType(null);
            fetchTaskTypes();
        } catch (err) {
            setError('Failed to update task type.');
            console.error(err);
        }
    };

    const handleDelete = async (typeId) => {
        if (window.confirm('Are you sure you want to delete this task type? This cannot be undone.')) {
            try {
                await apiClient.delete(`/api/task-types/${typeId}/`);
                fetchTaskTypes();
            } catch (err) {
                setError('Failed to delete task type. It might be in use.');
                console.error(err);
            }
        }
    };

    const handleToggleActive = (type) => {
        const updatedType = { ...type, is_active: !type.is_active };
        handleUpdate(updatedType);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="task-type-settings-container">
            <h2>Manage Task Types</h2>
            <p>Add, edit, or deactivate task types available across the application.</p>

            <form onSubmit={handleCreate} className="add-type-form">
                <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Enter new task type name"
                    required
                />
                <button type="submit" className="btn-primary">Add Type</button>
            </form>

            <div className="task-type-list">
                {taskTypes.map(type => (
                    <div key={type.id} className={`task-type-item ${!type.is_active ? 'deactivated' : ''}`}>
                        {editingType?.id === type.id ? (
                            <input
                                type="text"
                                value={editingType.name}
                                onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                                onBlur={() => handleUpdate(editingType)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdate(editingType)}
                                autoFocus
                            />
                        ) : (
                            <span onDoubleClick={() => setEditingType(type)}>{type.name}</span>
                        )}
                        <div className="item-actions">
                            <button onClick={() => handleToggleActive(type)} className={`btn-toggle ${type.is_active ? 'active' : ''}`}>
                                {type.is_active ? 'Active' : 'Inactive'}
                            </button>
                            <button onClick={() => setEditingType(type)} className="btn-secondary">Edit</button>
                            <button onClick={() => handleDelete(type.id)} className="btn-danger">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskTypeSettings;
