import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import './Contacts.css';

const Contacts = () => {
    const { t } = useTranslation(['crm', 'common', 'errors', 'a11y']);
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
    return <div>{t('common:status.loading', 'Loading...')}</div>;
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
                <table className="contacts-table striped-table" role="table" aria-label={t('crm:contacts.title', 'Contacts')}>
                    <caption className="sr-only">{t('a11y:contacts.caption', 'Contacts listing with name, email, phone, account, and owner')}</caption>
                    <thead>
                        <tr>
                            <th scope="col" id="contacts-name">{t('common:common.name', 'Name')}</th>
                            <th scope="col" id="contacts-email">{t('common:common.email', 'Email')}</th>
                            <th scope="col" id="contacts-phone">{t('common:common.phone', 'Phone Number')}</th>
                            <th scope="col" id="contacts-account">{t('crm:accounts.title', 'Account')}</th>
                            <th scope="col" id="contacts-owner">{t('crm:contacts.owner', 'Owner')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map(contact => (
                            <tr key={contact.id}>
                                <th scope="row" headers="contacts-name">
                                    <Link to={`/contacts/${contact.id}`}>
                                        {contact.first_name} {contact.last_name}
                                    </Link>
                                </th>
                                <td headers="contacts-email">{contact.email}</td>
                                <td headers="contacts-phone">{contact.phone_number}</td>
                                <td headers="contacts-account">{contact.account ? contact.account.name : t('common:common.not_available', 'N/A')}</td>
                                <td headers="contacts-owner">{contact.owner ? contact.owner.username : t('common:common.not_available', 'N/A')}</td>
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
