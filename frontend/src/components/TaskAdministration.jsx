import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import './TaskAdministration.css';

const TaskAdministration = () => {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingTemplate, setEditingTemplate] = useState(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get('/api/project-templates/');
            setTemplates(response.data.results || response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load templates. You may not have the required permissions.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTemplate = async (templateData) => {
        const isNew = !templateData.id;
        const url = isNew ? '/api/project-templates/' : `/api/project-templates/${templateData.id}/`;
        const method = isNew ? 'post' : 'put';

        try {
            await apiClient[method](url, templateData);
            setEditingTemplate(null);
            fetchTemplates();
        } catch (err) {
            setError(`Failed to save template. ${err.response?.data?.detail || ''}`);
            console.error(err);
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                await apiClient.delete(`/api/project-templates/${templateId}/`);
                fetchTemplates();
            } catch (err) {
                setError('Failed to delete template.');
                console.error(err);
            }
        }
    };

    if (isLoading) {
        return <div>Loading templates...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (editingTemplate) {
        return (
            <TemplateForm
                template={editingTemplate}
                onSave={handleSaveTemplate}
                onCancel={() => setEditingTemplate(null)}
            />
        );
    }

    return (
        <div className="task-admin-container">
            <div className="task-admin-header">
                <h2>Task Template Management</h2>
                <button onClick={() => setEditingTemplate({})} className="btn-primary">
                    + Create New Template
                </button>
            </div>

            <div className="template-list">
                {templates.length === 0 ? (
                    <p>No task templates found. Create one to get started.</p>
                ) : (
                    templates.map(template => (
                        <div key={template.id} className="template-card">
                            <h3>{template.name}</h3>
                            <p>{template.description || 'No description'}</p>
                            <div className="template-actions">
                                <button onClick={() => setEditingTemplate(template)} className="btn-secondary">
                                    Edit
                                </button>
                                <button onClick={() => handleDeleteTemplate(template.id)} className="btn-danger">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const TemplateForm = ({ template, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ ...template, default_items: template.default_items || [] });
    const [taskTypes, setTaskTypes] = useState([]);

    useEffect(() => {
        const fetchTaskTypes = async () => {
            try {
                const response = await apiClient.get('/api/project-types/');
                const activeTypes = response.data.results
                    ? response.data.results.filter(t => t.is_active)
                    : response.data.filter(t => t.is_active);
                setTaskTypes(activeTypes);
                // Set a default if the current one is not set or invalid
                if (!formData.default_task_type && activeTypes.length > 0) {
                    setFormData(prev => ({ ...prev, default_task_type: activeTypes[0].id }));
                }
            } catch (err) {
                console.error("Failed to fetch task types for template form", err);
            }
        };
        fetchTaskTypes();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const items = [...formData.default_items];
        items[index] = { ...items[index], [name]: value };
        setFormData(prev => ({ ...prev, default_items: items }));
    };

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            default_items: [
                ...prev.default_items,
                { item_type: 'part', description: '', quantity: 1, unit_price: 0.00, serial_number: '' }
            ]
        }));
    };

    const removeItem = (index) => {
        const items = [...formData.default_items];
        items.splice(index, 1);
        setFormData(prev => ({ ...prev, default_items: items }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="template-form-container">
            <h2>{template.id ? 'Edit' : 'Create'} Task Template</h2>
            <form onSubmit={handleSubmit}>
                {/* ... existing form fields for template name, description, etc. ... */}
                <div className="form-group">
                    <label>Template Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Template Description</label>
                    <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleChange}
                    />
                </div>
                <hr />
                <h4>Default Task Values</h4>
                <div className="form-group">
                    <label>Default Project Title</label>
                    <input
                        type="text"
                        name="default_title"
                        value={formData.default_title || ''}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Default Project Description</label>
                    <textarea
                        name="default_description"
                        value={formData.default_description || ''}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Default Priority</label>
                        <select name="default_priority" value={formData.default_priority || 'medium'} onChange={handleChange}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Default Task Type</label>
                        <select
                            name="default_task_type"
                            value={formData.default_task_type || ''}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a Task Type</option>
                            {taskTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <hr />
                <h4>Default Work Order Items</h4>
                <div className="work-items-list">
                    {formData.default_items.map((item, index) => (
                        <div key={index} className="work-item-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type</label>
                                    <select name="item_type" value={item.item_type} onChange={(e) => handleItemChange(index, e)}>
                                        <option value="part">Part</option>
                                        <option value="labor">Labor</option>
                                        <option value="equipment">Serialized Equipment</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label>Description</label>
                                    <input type="text" name="description" value={item.description} onChange={(e) => handleItemChange(index, e)} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} required />
                                </div>
                                <div className="form-group">
                                    <label>Unit Price</label>
                                    <input type="number" step="0.01" name="unit_price" value={item.unit_price} onChange={(e) => handleItemChange(index, e)} required />
                                </div>
                                {item.item_type === 'equipment' && (
                                    <div className="form-group">
                                        <label>Serial Number</label>
                                        <input type="text" name="serial_number" value={item.serial_number} onChange={(e) => handleItemChange(index, e)} required />
                                    </div>
                                )}
                            </div>
                            <button type="button" onClick={() => removeItem(index)} className="btn-danger btn-remove-item">Remove</button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addItem} className="btn-secondary">+ Add Item</button>

                <div className="form-actions">
                    <button type="button" onClick={onCancel} className="btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                        Save Template
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TaskAdministration;
