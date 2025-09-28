import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get } from '../api';
import InteractionHistory from './InteractionHistory';

const ContactDetail = () => {
    const { id } = useParams();
    const [contact, setContact] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContactDetails = async () => {
            try {
                setLoading(true);
                const contactResponse = await get(`/api/contacts/${id}/`);
                setContact(contactResponse.data);

                const interactionsResponse = await get(`/api/interactions/?contact=${id}`);
                const interactionData = Array.isArray(interactionsResponse.data.results) ? interactionsResponse.data.results : [];
                setInteractions(interactionData);
                
                setError(null);
            } catch (err) {
                console.error('There was an error fetching the contact details!', err);
                setError('Failed to load contact details. You may not have permission to view this contact.');
            } finally {
                setLoading(false);
            }
        };

        fetchContactDetails();
    }, [id]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    if (!contact) {
        return <div>No contact found.</div>;
    }

    return (
        <div>
            <h2>{contact.first_name} {contact.last_name}</h2>
            <p><strong>Email:</strong> {contact.email}</p>
            <p><strong>Phone:</strong> {contact.phone_number}</p>
            <p><strong>Title:</strong> {contact.title}</p>
            {contact.account && <p><strong>Account:</strong> {contact.account.name}</p>}

            {contact.custom_fields && contact.custom_fields.length > 0 && (
                <div>
                    <h4>Custom Fields</h4>
                    {contact.custom_fields.map(field => (
                        <p key={field.id}><strong>{field.field_name}:</strong> {field.value}</p>
                    ))}
                </div>
            )}
            
            <hr />

            <Link to="/tasks/new" state={{ contact: { id: contact.id, name: `${contact.first_name} ${contact.last_name}` } }}>
                Create Task
            </Link>

            <InteractionHistory interactions={interactions} />
        </div>
    );
};

export default ContactDetail;
