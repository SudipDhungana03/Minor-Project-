import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchClassrooms = async () => {
        try {
            const res = await API.get('/api/classroom/classrooms/');
            setClassrooms(res.data);
        } catch (err) {
            console.error('Error loading dashboards:', err);
        }
    };

    useEffect(() => {
        const load = async () => {
            await fetchClassrooms();
            setLoading(false);
        };
        load();
    }, []);

    const handleJoin = async (e) => {
        e.preventDefault();
        try {
            await API.post('/api/classroom/classrooms/join/', { invite_code: joinCode.trim() });
            alert('Join request submitted. Check with your teacher for approval.');
            setJoinCode('');
        } catch (err) {
            console.error('Error joining classroom:', err);
            const message = err.response?.data?.error || err.response?.data?.message || 'Invalid invite code or request failed.';
            alert(message);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' }}>
            <header style={{ marginBottom: '40px' }}>
                <h1 style={{ color: '#333', fontSize: '2rem' }}>My Classrooms</h1>
                <p style={{ color: '#666' }}>Welcome back! Select a classroom to view your assignments and submit work.</p>
            </header>

            <section style={{ marginBottom: '30px', padding: '24px', borderRadius: '16px', backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>Join a classroom</h2>
                <form onSubmit={handleJoin} style={{ marginTop: '18px', display: 'grid', gap: '14px' }}>
                    <input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Enter classroom code"
                        required
                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                    <button type="submit" style={{ width: 'fit-content', padding: '12px 20px', backgroundColor: '#2563eb', color: '#fff', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
                        Request Join
                    </button>
                </form>
            </section>

            {loading ? <p>Loading your courses...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                    {classrooms.map(c => (
                        <div key={c.id} style={{ 
                            border: '1px solid #e1e4e8', borderRadius: '12px', padding: '24px', 
                            backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                            display: 'flex', flexDirection: 'column', gap: '10px'
                        }}>
                            <h3 style={{ margin: 0, color: '#2c3e50' }}>{c.name}</h3>
                            <p style={{ margin: 0, color: '#7f8c8d' }}>Subject: {c.subject}</p>
                            <Link to="/assignments" style={{ 
                                marginTop: '15px', padding: '10px', backgroundColor: '#007acc', 
                                color: '#fff', borderRadius: '6px', textDecoration: 'none', 
                                textAlign: 'center', fontWeight: '600' 
                            }}>
                                View Assignments →
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;