import React from 'react';

const InteractionHistory = ({ interactions }) => {
    if (!interactions || interactions.length === 0) {
        return <p>No interaction history.</p>;
    }

    return (
        <div className="interaction-history">
            <h4>Interaction History</h4>
            <ul>
                {interactions.map(interaction => (
                    <li key={interaction.id}>
                        <strong>{interaction.get_interaction_type_display}</strong> - {new Date(interaction.interaction_date).toLocaleString()}
                        <p><strong>{interaction.subject}</strong></p>
                        <p>{interaction.body}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default InteractionHistory;
