import React, { useState, useEffect } from 'react';
import API from '../services/api';

const ClassroomDashboard = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [joinCode, setJoinCode] = useState('');

    // Fetch classes on load
    const fetchClassrooms = async () => {
        try {
            const res = await API.get('/api/classroom/classrooms/');
            setClassrooms(res.data);
        } catch (err) {
            console.error("Error fetching:", err);
        }
    };

    useEffect(() => {
        fetchClassrooms();
    }, []);

    // Create a new class
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await API.post('/api/classroom/classrooms/', { name, subject });
            fetchClassrooms(); // Refresh list
            setName(''); 
            setSubject('');
        } catch (err) {
            console.error("Error creating:", err);
            alert('Failed to create classroom.');
        }
    };

    // Join an existing class
    const handleJoin = async (e) => {
        e.preventDefault();
        try {
            // Using the custom @action defined in your Django views.py
            await API.post('/api/classroom/classrooms/join/', { invite_code: joinCode });
            alert('Joined classroom successfully!');
            fetchClassrooms(); // Refresh list to show the new joined class
            setJoinCode('');
        } catch (err) {
            console.error("Error joining:", err);
            alert('Invalid invite code or already joined.');
        }
    };

    return (
        <div>
            <h2>My Classrooms</h2>
            
            {/* Create Form */}
            <form onSubmit={handleCreate}>
                <h3>Create a Classroom</h3>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Class Name" required />
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required />
                <button type="submit">Create</button>
            </form>

            <hr />

            {/* Join Form */}
            <form onSubmit={handleJoin}>
                <h3>Join a Classroom</h3>
                <input 
                    value={joinCode} 
                    onChange={(e) => setJoinCode(e.target.value)} 
                    placeholder="Enter Invite Code" 
                    required 
                />
                <button type="submit">Join Class</button>
            </form>

            <ul>
                {classrooms.map(c => (
                    <li key={c.id}>
                        {c.name} ({c.subject}) - <strong>Code: {c.invite_code}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ClassroomDashboard;