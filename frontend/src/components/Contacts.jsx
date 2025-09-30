import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import './Contacts.css';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await api.get('/api/contacts/');
                setContacts(response.data.results);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch contacts.');
                setLoading(false);
                console.error(err);
            }
        };

        fetchContacts();
    }, []);

    if (loading) {
        return <div>Loading contacts...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="contacts-container">
            <h1>Contacts</h1>
            <p>This is the central repository for all people and companies the business interacts with.</p>

            <div className="contacts-actions">
                <Link to="/contacts/new" className="btn btn-primary">Create New Contact</Link>
            </div>

            {contacts.length > 0 ? (
                <table className="contacts-table striped-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone Number</th>
                            <th>Account</th>
                            <th>Owner</th>
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
                                <td>{contact.account ? contact.account.name : 'N/A'}</td>
                                <td>{contact.owner ? contact.owner.username : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No contacts found. Get started by creating one!</p>
            )}
        </div>
    );
};

export default Contacts;
