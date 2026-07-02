import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const fetchClassrooms = async () => {
            const res = await API.get('/api/classroom/classrooms/');
            setClassrooms(res.data);
        };

        const fetchAssignments = async () => {
            try {
                const res = await API.get('/api/classroom/assignments/');
                setAssignments(res.data);
            } catch (err) {
                console.error('Error loading assignments:', err);
            }
        };

        const fetchPending = async () => {
            try {
                const res = await API.get('/api/classroom/classrooms/pending_requests/');
                setPendingCount(res.data?.length || 0);
            } catch (err) {
                console.error('Error loading pending requests:', err);
            }
        };

        fetchClassrooms();
        fetchAssignments();
        fetchPending();
    }, []);

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ color: '#333' }}>Teacher Dashboard</h1>
                    {pendingCount > 0 && (
                        <p style={{ margin: '8px 0 0', color: '#b45309' }}>
                            You have <strong>{pendingCount}</strong> pending join request{pendingCount === 1 ? '' : 's'}.
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Link to="/manage-classes" style={{ padding: '12px 24px', background: '#fbbf24', color: '#1f2937', borderRadius: '6px', textDecoration: 'none', fontWeight: '600', boxShadow: '0 2px 4px rgba(251, 191, 36, 0.2)' }}>
                        Manage Requests{pendingCount > 0 ? ` (${pendingCount})` : ''}
                    </Link>
                    <Link to="/create-classroom" style={{ 
                        padding: '12px 24px', background: '#28a745', color: '#fff', 
                        borderRadius: '6px', textDecoration: 'none', fontWeight: '600',
                        boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)'
                    }}>
                        + Create Classroom
                    </Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px', marginBottom: '40px' }}>
                {classrooms.map(c => (
                    <div key={c.id} style={{ 
                        border: '1px solid #e1e4e8', borderRadius: '12px', padding: '24px', 
                        backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                    }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{c.name}</h3>
                        <p style={{ margin: '0 0 20px 0', color: '#7f8c8d' }}>Subject: {c.subject}</p>
                        <Link to={`/classroom/${c.id}`} style={{ 
                            color: '#007acc', fontWeight: '600', textDecoration: 'none',
                            border: '1px solid #007acc', padding: '8px 16px', borderRadius: '6px'
                        }}>
                            View Assignments & Submissions
                        </Link>
                    </div>
                ))}
            </div>

            <section style={{ border: '1px solid #e5e7eb', borderRadius: '24px', backgroundColor: '#ffffff', padding: '30px', boxShadow: '0 15px 30px rgba(15, 23, 42, 0.05)' }}>
                <h2 style={{ margin: '0 0 16px', color: '#111827' }}>Published Assignments</h2>
                {assignments.length === 0 ? (
                    <div style={{ color: '#6b7280', padding: '24px', borderRadius: '18px', backgroundColor: '#f8fafc' }}>
                        No published assignments yet. Publish assignments from your classrooms to see them here.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {assignments.map((assignment) => (
                            <div key={assignment.id} style={{ border: '1px solid #e2e8f0', borderRadius: '20px', padding: '22px', backgroundColor: '#f9fafb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 8px', color: '#111827', fontSize: '1.1rem' }}>{assignment.title}</h3>
                                        <p style={{ margin: 0, color: '#475569' }}>{assignment.classroom_name} · {assignment.classroom_subject}</p>
                                    </div>
                                    <Link to={`/assignment/${assignment.id}`} style={{ color: '#1d4ed8', fontWeight: '600', textDecoration: 'none' }}>
                                        View Assignment and Submissions
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default TeacherDashboard;