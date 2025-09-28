import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './ContactForm.css';

const ContactForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        title: '',
        account: null,
    });
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch accounts for the dropdown
                const accResponse = await api.get('/api/accounts/');
                setAccounts(accResponse.data.results || accResponse.data);

                // If editing, fetch the contact's data
                if (isEditing) {
                    const contactResponse = await api.get(`/api/contacts/${id}/`);
                    const contactData = contactResponse.data;
                    setFormData({
                        first_name: contactData.first_name,
                        last_name: contactData.last_name,
                        email: contactData.email,
                        phone_number: contactData.phone_number,
                        title: contactData.title,
                        account: contactData.account ? contactData.account.id : null,
                    });
                }
                setError(null);
            } catch (err) {
                console.error("Failed to fetch data", err);
                setError("Failed to load necessary data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const payload = { ...formData };
        // Ensure account is a valid ID or null
        if (payload.account === '' || payload.account === 'null') {
            payload.account = null;
        }

        try {
            let response;
            if (isEditing) {
                response = await api.put(`/api/contacts/${id}/`, payload);
            } else {
                response = await api.post('/api/contacts/', payload);
            }
            navigate(`/contacts/${response.data.id}`);
        } catch (err) {
            console.error("Failed to save contact", err.response.data);
            const errorData = err.response.data;
            // Format errors for display
            const errorMessages = Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
            setError(errorMessages.join('; '));
            setLoading(false);
        }
    };

    if (loading && !accounts.length) {
        return <div>Loading form...</div>;
    }

    return (
        <div className="contact-form-container">
            <h2>{isEditing ? 'Edit Contact' : 'Create New Contact'}</h2>
            {error && <div className="error-message form-error">{error}</div>}
            <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                    <label htmlFor="first_name">First Name</label>
                    <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="last_name">Last Name</label>
                    <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="phone_number">Phone Number</label>
                    <input type="text" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="account">Account</label>
                    <select id="account" name="account" value={formData.account || ''} onChange={handleChange}>
                        <option value="">None</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Contact'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(isEditing ? `/contacts/${id}` : '/contacts')}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ContactForm;
