import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserRoleManagement = () => {
    const [users, setUsers] = useState([]);
    const [availableGroups, setAvailableGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserRoles();
    }, []);

    const fetchUserRoles = () => {
        setLoading(true);
        axios.get('/api/user-roles/')
            .then(response => {
                const usersData = Array.isArray(response.data.users) ? response.data.users : [];
                const groupsData = Array.isArray(response.data.available_groups) ? response.data.available_groups : [];
                setUsers(usersData);
                setAvailableGroups(groupsData);
                setError(null);
            })
            .catch(error => {
                console.error('Error fetching user roles:', error);
                setError('Failed to load user roles.');
                setUsers([]);
                setAvailableGroups([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const assignRole = (userId, groupName) => {
        axios.post('/api/user-roles/', {
            user_id: userId,
            group_name: groupName,
            action: 'add'
        })
            .then(() => {
                fetchUserRoles();
            })
            .catch(error => {
                console.error('Error assigning role:', error);
            });
    };

    const removeRole = (userId, groupName) => {
        axios.post('/api/user-roles/', {
            user_id: userId,
            group_name: groupName,
            action: 'remove'
        })
            .then(() => {
                fetchUserRoles();
            })
            .catch(error => {
                console.error('Error removing role:', error);
            });
    };

    if (loading) return <p>Loading user roles...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div>
            <h2>User Role Management</h2>
            {users.length === 0 ? (
                <p>No users found.</p>
            ) : (
                <table className="striped-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Username</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Email</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Current Roles</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.username}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.email}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    {user.groups.join(', ') || 'No roles assigned'}
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                    {availableGroups.map(group => (
                                        <div key={group.id} style={{ marginBottom: '5px' }}>
                                            {user.groups.includes(group.name) ? (
                                                <button
                                                    onClick={() => removeRole(user.id, group.name)}
                                                    style={{ marginRight: '5px', backgroundColor: '#f44336', color: 'white' }}
                                                >
                                                    Remove {group.name}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => assignRole(user.id, group.name)}
                                                    style={{ marginRight: '5px', backgroundColor: '#4caf50', color: 'white' }}
                                                >
                                                    Add {group.name}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default UserRoleManagement;