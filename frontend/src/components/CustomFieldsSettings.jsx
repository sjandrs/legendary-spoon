import React, { useState, useEffect } from 'react';
import { get, post } from '../api'; // Using the centralized API handler
import './CustomFieldsSettings.css'; // Assuming you'll create this for styling

const CustomFieldsSettings = () => {
    const [fields, setFields] = useState([]);
    const [newField, setNewField] = useState({ name: '', field_type: 'text', content_type: '' });
    const [contentTypes, setContentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                // In a real app, you'd fetch these from the Django ContentType model
                // This is a simplified, hardcoded example.
                setContentTypes([
                    { id: 7, name: 'contact' }, // Assuming ID 7 is for the Contact model
                    { id: 8, name: 'account' }, // Assuming ID 8 is for the Account model
                    { id: 11, name: 'deal' }, // Assuming ID 11 is for the Deal model
                ]);
                
                await fetchFields();
                setError(null);
            } catch (err) {
                console.error('Error fetching initial data', err);
                setError('Failed to load initial data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const fetchFields = async () => {
        try {
            const response = await get('/api/custom-fields/');
            // Handle paginated response from Django REST Framework
            setFields(response.data.results || []);
        } catch (err) {
            console.error('Error fetching custom fields', err);
            setError('Failed to load custom fields.');
            setFields([]); // Ensure fields is an array on error
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewField({ ...newField, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        if (!newField.name || !newField.content_type) {
            setError('Please fill out all fields.');
            return;
        }
        try {
            await post('/api/custom-fields/', newField);
            setNewField({ name: '', field_type: 'text', content_type: '' }); // Reset form
            await fetchFields(); // Refresh the list
        } catch (err) {
            console.error('Error creating custom field', err);
            const errorMessage = err.response?.data ? JSON.stringify(err.response.data) : 'An unknown error occurred.';
            setError(`Failed to create custom field: ${errorMessage}`);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this field?')) {
            try {
                // Assuming your API supports DELETE on /api/custom-fields/{id}/
                await post(`/api/custom-fields/${id}/`, null, { method: 'DELETE' });
                await fetchFields();
            } catch (err) {
                console.error('Error deleting custom field', err);
                setError('Failed to delete custom field.');
            }
        }
    };

    const getContentTypeName = (id) => {
        const ct = contentTypes.find(c => c.id === id);
        return ct ? ct.name : 'Unknown';
    };

    // Group fields by content type for organized display
    const groupedFields = fields.reduce((acc, field) => {
        const contentTypeName = getContentTypeName(field.content_type);
        if (!acc[contentTypeName]) {
            acc[contentTypeName] = [];
        }
        acc[contentTypeName].push(field);
        return acc;
    }, {});

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="custom-fields-settings">
            <h2>Manage Custom Fields</h2>
            
            <form onSubmit={handleSubmit} className="add-field-form">
                <h3>Add New Field</h3>
                <div className="form-row">
                    <input
                        type="text"
                        name="name"
                        value={newField.name}
                        onChange={handleInputChange}
                        placeholder="Field Name (e.g., 'Birthday')"
                        required
                    />
                    <select name="field_type" value={newField.field_type} onChange={handleInputChange}>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="boolean">Checkbox</option>
                    </select>
                    <select name="content_type" value={newField.content_type} onChange={handleInputChange} required>
                        <option value="">Select Model</option>
                        {contentTypes.map(ct => (
                            <option key={ct.id} value={ct.id}>{ct.name}</option>
                        ))}
                    </select>
                    <button type="submit">Add Field</button>
                </div>
            </form>

            <div className="fields-list">
                <h3>Existing Fields</h3>
                {fields.length > 0 ? (
                    Object.keys(groupedFields).map(groupName => (
                        <div key={groupName} className="field-group">
                            <h4>{groupName.charAt(0).toUpperCase() + groupName.slice(1)} Fields</h4>
                            <table className="striped-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedFields[groupName].map(field => (
                                        <tr key={field.id}>
                                            <td>{field.name}</td>
                                            <td>{field.field_type}</td>
                                            <td>
                                                <button onClick={() => handleDelete(field.id)} className="delete-btn">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))
                ) : (
                    <p>No custom fields have been created yet.</p>
                )}
            </div>
        </div>
    );
};

export default CustomFieldsSettings;
