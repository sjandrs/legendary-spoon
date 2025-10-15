import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import './Contacts.css';

const Contacts = () => {
    const { t } = useTranslation();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await api.get('/api/contacts/');
                setContacts(response.data.results || response.data || []);
                setLoading(false);
            } catch (_err) {
                setError(t('errors:api.contacts.fetch_failed', 'Failed to fetch contacts.'));
                setLoading(false);
                console.error(_err);
            }
        };

        fetchContacts();
    }, [t]);

    if (loading) {
        return <div>{t('common:status.loading', 'Loading contacts...')}</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="contacts-container">
            <h1>{t('crm:contacts.title', 'Contacts')}</h1>
            <p>{t('crm:contacts.description', 'This is the central repository for all people and companies the business interacts with.')}</p>

            <div className="contacts-actions">
                <Link to="/contacts/new" className="btn btn-primary">{t('crm:contacts.create_new', 'Create New Contact')}</Link>
            </div>

            {contacts && contacts.length > 0 ? (
                <table className="contacts-table striped-table">
                    <thead>
                        <tr>
                            <th>{t('common:common.name', 'Name')}</th>
                            <th>{t('common:common.email', 'Email')}</th>
                            <th>{t('common:common.phone', 'Phone Number')}</th>
                            <th>{t('crm:accounts.title', 'Account')}</th>
                            <th>{t('crm:contacts.owner', 'Owner')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map(contact => (
                            <tr key={contact.id}>
                                <td>
                                    <Link to={`/contacts/${contact.id}`}>
                                        {contact.first_name} {contact.last_name}
                                    </Link>
                                </td>
                                <td>{contact.email}</td>
                                <td>{contact.phone_number}</td>
                                <td>{contact.account ? contact.account.name : t('common:common.not_available', 'N/A')}</td>
                                <td>{contact.owner ? contact.owner.username : t('common:common.not_available', 'N/A')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>{t('crm:contacts.no_contacts_get_started', 'No contacts found. Get started by creating one!')}</p>
            )}
        </div>
    );
};

export default Contacts;
