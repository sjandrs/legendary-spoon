import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../api'; // Using the custom 'get' function

const ContactList = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                setLoading(true);
                // The endpoint /api/my-contacts/ should return contacts for the logged-in user
                const response = await get('/api/my-contacts/');
                const contactData = Array.isArray(response.data) ? response.data : [];
                setContacts(contactData);
                setError(null);
            } catch (_err) {
                console.error('There was an error fetching the contacts!', _err);
                setError('Failed to load contacts.');
                setContacts([]); // Set to empty array on error
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, []);

    if (loading) return <p data-testid="loading">Loading contacts...</p>;
    if (error) return <p data-testid="error-message" className="error-message">{error}</p>;

    return (
        <div data-testid="contacts-page">
            <h2>My Contacts</h2>
            {contacts.length > 0 ? (
                <ul data-testid="contacts-list">
                    {contacts.map(contact => (
                        <li key={contact.id} data-testid={`contact-item-${contact.id}`}>
                            <Link
                                to={`/contacts/${contact.id}`}
                                data-testid={`contact-link-${contact.id}`}
                            >
                                {contact.first_name} {contact.last_name}
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p data-testid="no-contacts-message">No contacts found.</p>
            )}
            <button
                data-testid="add-contact-button"
                onClick={() => {}}
                style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
            >
                Add Contact
            </button>
        </div>
    );
};

export default ContactList;
