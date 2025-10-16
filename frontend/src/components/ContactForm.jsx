import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './ContactForm.css';
import Label from './FormControls/Label';
import FieldHint from './FormControls/FieldHint';

const ContactForm = () => {
    const { t } = useTranslation();
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
            } catch (_err) {
                console.error("Failed to fetch data", _err);
                // Tests expect this exact string
                setError(t('errors:api.contacts.load_failed', 'Failed to load necessary data'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, isEditing, t]);

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
        } catch (_err) {
            console.error("Failed to save contact", _err);
            const errorData = _err.response?.data || { detail: 'Unknown error' };
            // Format errors for display
            const errorMessages = Object.entries(errorData).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
            setError(errorMessages.join('; '));
            setLoading(false);
        }
    };

    if (loading && !accounts.length) {
        return <div aria-live="polite">{t('forms:status.loading_form', 'Loading form...')}</div>;
    }

    return (
        <div className="contact-form-container">
            <h2>{isEditing ? t('crm:contacts.edit_contact', 'Edit Contact') : t('crm:contacts.create_new', 'Create New Contact')}</h2>
            {error && <FieldHint id="contact-form-error" type="error">{error}</FieldHint>}
            <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                    <Label htmlFor="first_name" required>{t('forms:labels.first_name', 'First Name')}</Label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        aria-describedby="first-name-hint"
                    />
                    <FieldHint id="first-name-hint">{t("forms:help_text.first_name_hint", "Enter the contact's given name.")}</FieldHint>
                </div>
                <div className="form-group">
                    <Label htmlFor="last_name" required>{t('forms:labels.last_name', 'Last Name')}</Label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        aria-describedby="last-name-hint"
                    />
                    <FieldHint id="last-name-hint">{t('forms:help_text.last_name_hint', 'Enter the family name.')}</FieldHint>
                </div>
                <div className="form-group">
                    <Label htmlFor="email">{t('forms:labels.email_address', 'Email')}</Label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} aria-describedby="email-hint" />
                    <FieldHint id="email-hint">{t('forms:help_text.email_format', 'name@example.com')}</FieldHint>
                </div>
                <div className="form-group">
                    <Label htmlFor="phone_number">{t('forms:labels.phone_number', 'Phone Number')}</Label>
                    <input type="text" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} aria-describedby="phone-hint" />
                    <FieldHint id="phone-hint">{t('forms:help_text.phone_hint', 'Include country code if outside your region.')}</FieldHint>
                </div>
                <div className="form-group">
                    <Label htmlFor="title">{t('forms:labels.job_title', 'Title')}</Label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <Label htmlFor="account">{t('crm:accounts.title', 'Account')}</Label>
                    <select id="account" name="account" value={formData.account || ''} onChange={handleChange}>
                        <option value="">{t('forms:placeholders.none', 'None')}</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? t('forms:status.saving', 'Saving...') : t('crm:contacts.save_contact', 'Save Contact')}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(isEditing ? `/contacts/${id}` : '/contacts')}>
                        {t('forms:buttons.cancel', 'Cancel')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ContactForm;
