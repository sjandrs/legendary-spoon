import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../api';
import './TagManager.css';

const TagManager = ({ associatedTags, onTagsUpdate, entityId, entityType }) => {
    const [allTags, setAllTags] = useState([]);
    const [newTagName, setNewTagName] = useState('');
    const [selectedTagId, setSelectedTagId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await api.get('/api/tags/');
                setAllTags(response.data.results || []);
                setLoading(false);
            } catch (err) {
                setError('Failed to load tags.');
                console.error(err);
                setLoading(false);
            }
        };
        fetchTags();
    }, []);

    const handleAddTag = async (tagId) => {
        if (!tagId) return;
        const currentTagIds = associatedTags.map(t => t.id);
        if (currentTagIds.includes(tagId)) return; // Tag already exists

        const updatedTagIds = [...currentTagIds, tagId];
        try {
            const response = await api.patch(`/api/${entityType}/${entityId}/`, { tag_ids: updatedTagIds });
            onTagsUpdate(response.data.tags);
        } catch (err) {
            setError(`Failed to add tag. ${err.response?.data?.detail || ''}`);
            console.error(err);
        }
    };

    const handleRemoveTag = async (tagId) => {
        const updatedTagIds = associatedTags.map(t => t.id).filter(id => id !== tagId);
        try {
            const response = await api.patch(`/api/${entityType}/${entityId}/`, { tag_ids: updatedTagIds });
            onTagsUpdate(response.data.tags);
        } catch (err) {
            setError(`Failed to remove tag. ${err.response?.data?.detail || ''}`);
            console.error(err);
        }
    };

    const handleCreateAndAddTag = async () => {
        if (!newTagName.trim()) return;
        try {
            // 1. Create the new tag
            const createResponse = await api.post('/api/tags/', { name: newTagName, slug: newTagName.toLowerCase().replace(/\s+/g, '-') });
            const newTag = createResponse.data;

            // 2. Update the list of all tags
            setAllTags(prevTags => [...prevTags, newTag]);

            // 3. Add the new tag to the contact
            const currentTagIds = associatedTags.map(t => t.id);
            const updatedTagIds = [...currentTagIds, newTag.id];
            const updateResponse = await api.patch(`/api/${entityType}/${entityId}/`, { tag_ids: updatedTagIds });

            onTagsUpdate(updateResponse.data.tags);
            setNewTagName(''); // Clear input
        } catch (err) {
            setError(`Failed to create and add tag. ${err.response?.data?.detail || ''}`);
            console.error(err);
        }
    };

    if (loading) return <p>Loading tags...</p>;

    return (
        <div className="tag-manager">
            <h4>Tags</h4>
            {error && <p className="error-message">{error}</p>}
            <div className="tag-list">
                {associatedTags.map(tag => (
                    <span key={tag.id} className="tag">
                        {tag.name}
                        <button onClick={() => handleRemoveTag(tag.id)} className="remove-tag-btn">&times;</button>
                    </span>
                ))}
            </div>
            <div className="tag-controls">
                <div className="available-tags-cloud">
                    <h5>Available Tags</h5>
                    <div className="tag-list">
                        {Array.isArray(allTags) && allTags.filter(tag => !associatedTags.some(at => at.id === tag.id)).map(tag => (
                            <span key={tag.id} className="tag available-tag" onClick={() => handleAddTag(tag.id)}>
                                {tag.name}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="create-new-tag">
                    <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Create new tag"
                    />
                    <button onClick={handleCreateAndAddTag}>Create & Add</button>
                </div>
            </div>
        </div>
    );
};

TagManager.propTypes = {
    associatedTags: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
    })).isRequired,
    onTagsUpdate: PropTypes.func.isRequired,
    entityId: PropTypes.string.isRequired,
    entityType: PropTypes.oneOf(['contacts', 'accounts']).isRequired,
};

export default TagManager;
