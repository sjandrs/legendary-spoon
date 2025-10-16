import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import InteractionHistory from './InteractionHistory';
import TagManager from './TagManager';
import './ContactDetail.css';

const ContactDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const [contact, setContact] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContactDetails = async () => {
            try {
                setLoading(true);
                // Use the serializer that includes custom fields and tags
                const contactResponse = await api.get(`/api/contacts/${id}/`);
                setContact(contactResponse.data);
                setError(null);
            } catch (_err) {
                console.error('There was an error fetching the contact details!', _err);
                setError(t('errors:api.not_found', 'Failed to load contact details. You may not have permission to view this contact.'));
            } finally {
                setLoading(false);
            }
        };

        const fetchInteractions = async () => {
            try {
                // Fetch interactions separately
                const interactionsResponse = await api.get(`/api/interactions/?contact=${id}`);
                // The response might be paginated, so check for a 'results' property
                const interactionData = Array.isArray(interactionsResponse.data.results)
                    ? interactionsResponse.data.results
                    : (Array.isArray(interactionsResponse.data) ? interactionsResponse.data : []);
                setInteractions(interactionData);
            } catch (_err) {
                console.error('There was an error fetching the contact details!', _err);
                // Don't set main error for interaction failures - let InteractionHistory handle this
                setInteractions([]);
            }
        };

        fetchContactDetails();
        fetchInteractions();
    }, [id, t]);

    const handleTagsUpdate = (updatedTags) => {
        setContact(prevContact => ({ ...prevContact, tags: updatedTags }));
    };

    if (loading) {
        return <div>{t('common:status.loading', 'Loading...')}</div>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    if (!contact) {
        return <div>{t('crm:contacts.not_found', 'No contact found.')}</div>;
    }

    return (
        <div className="contact-detail-container">
            <div className="contact-header">
                <h2>{contact.first_name} {contact.last_name}</h2>
                <div className="contact-actions">
                    <Link to={`/contacts/${id}/edit`} className="btn btn-secondary">{t('common:actions.edit', 'Edit')}</Link>
                    <Link
                        to="/tasks/new"
                        state={{ contact: contact }} // Pass the full contact object, or adjust as needed for TaskForm
                        className="btn btn-primary"
                    >
                        {t('crm:contacts.create_task', 'Create Task')}
                    </Link>
                </div>
            </div>

            <div className="contact-body">
                <div className="contact-info">
                    <p><strong>{t('common:common.email', 'Email')}:</strong> {contact.email || t('common:common.not_available', 'N/A')}</p>
                    <p><strong>{t('common:common.phone', 'Phone')}:</strong> {contact.phone_number || t('common:common.not_available', 'N/A')}</p>
                    <p><strong>{t('forms:labels.job_title', 'Title')}:</strong> {contact.title || t('common:common.not_available', 'N/A')}</p>
                    {contact.account && <p><strong>{t('crm:accounts.title', 'Account')}:</strong> <Link to={`/accounts/${contact.account.id}`}>{contact.account.name}</Link></p>}
                    {contact.owner && <p><strong>{t('forms:labels.owner', 'Owner')}:</strong> {contact.owner.username}</p>}

                    {contact.custom_fields && contact.custom_fields.length > 0 && (
                        <div className="custom-fields-section">
                            <h4>{t('crm:contacts.custom_fields', 'Custom Fields')}</h4>
                            {contact.custom_fields.map(field => (
                                <p key={field.id}><strong>{field.field_name}:</strong> {String(field.value)}</p>
                            ))}
                        </div>
                    )}
                </div>

                <div className="contact-main-content">
                    <TagManager
                        associatedTags={contact.tags || []}
                        onTagsUpdate={handleTagsUpdate}
                        entityId={id}
                        entityType="contacts"
                    />
                    <hr />
                    <InteractionHistory interactions={interactions} contactId={id} />
                </div>
            </div>
        </div>
    );
};

export default ContactDetail;
