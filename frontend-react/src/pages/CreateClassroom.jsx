
import React, { useState } from 'react';
import API from '../services/api';

const CreateClassroom = () => {
    const [formData, setFormData] = useState({ name: '', subject: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/api/classroom/classrooms/', formData);
            alert('Classroom created successfully!');
        } catch (error) {
            console.error('Error creating classroom:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input placeholder="Name" onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <input placeholder="Subject" onChange={(e) => setFormData({...formData, subject: e.target.value})} />
            <button type="submit">Create Class</button>
        </form>
    );
};

export default CreateClassroom;