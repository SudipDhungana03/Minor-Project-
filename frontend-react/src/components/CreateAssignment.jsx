
import React, { useState } from 'react';
import API from '../services/api';

const CreateAssignment = ({ classroomId, onCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('classroom', classroomId);
        formData.append('title', title);
        formData.append('description', description);
        if (file) formData.append('file', file);

        await API.post('/api/classroom/assignments/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        onCreated(); // Callback to refresh the list
    };

    return (
        <form onSubmit={handleSubmit}>
            <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
            <textarea placeholder="Description" onChange={(e) => setDescription(e.target.value)} />
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button type="submit">Publish Assignment</button>
        </form>
    );
};