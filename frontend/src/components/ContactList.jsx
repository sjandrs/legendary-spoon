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
            } catch (err) {
                console.error('There was an error fetching the contacts!', err);
                setError('Failed to load contacts.');
                setContacts([]); // Set to empty array on error
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, []);

    if (loading) return <p>Loading contacts...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div>
            <h2>My Contacts</h2>
            {contacts.length > 0 ? (
                <ul>
                    {contacts.map(contact => (
                        <li key={contact.id}>
                            <Link to={`/contacts/${contact.id}`}>{contact.first_name} {contact.last_name}</Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No contacts found.</p>
            )}
        </div>
    );
};

export default ContactList;
