import React, { useState } from 'react';
import API from '../services/api';

const AssignmentForm = ({ classroomId, onAssignmentCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Your API call remains consistent with our established pattern
            await API.post('/api/classroom/assignments/', {
                classroom: classroomId,
                title,
                description
            });
            
            // Success: clear form and trigger refresh
            setTitle('');
            setDescription('');
            if (onAssignmentCreated) onAssignmentCreated();
        } catch (err) {
            console.error("Error creating assignment:", err);
            alert("Failed to create assignment. Please check your permissions.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
            <h4>Add New Assignment</h4>
            <input 
                type="text"
                placeholder="Title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)} 
                required 
            />
            <textarea 
                placeholder="Description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)} 
                required 
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Assignment'}
            </button>
        </form>
    );
};

export default AssignmentForm;