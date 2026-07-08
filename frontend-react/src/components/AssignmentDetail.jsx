import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import SubmissionForm from './SubmissionForm.jsx';
import SubmissionList from './SubmissionList.jsx';

const getMediaUrl = (path) => path?.startsWith('http') ? path : `${API.defaults.baseURL}${path}`;

const AssignmentDetail = () => {
    const { id } = useParams();
    const [assignment, setAssignment] = useState(null);

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const res = await API.get(`/api/classroom/assignments/${id}/`);
                setAssignment(res.data);
            } catch (err) {
                console.error("Error fetching assignment:", err);
            }
        };
        fetchAssignment();
    }, [id]);

    if (!assignment) return <div>Loading assignment...</div>;

    const role = localStorage.getItem('role');

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Segoe UI, sans-serif' }}>
            <div style={{ marginBottom: '24px', padding: '24px', borderRadius: '24px', backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>{assignment.title}</h1>
                <p style={{ margin: '0', color: '#6b7280', fontSize: '0.95rem' }}>{assignment.classroom_name} · {assignment.classroom_subject}</p>
                <p style={{ marginTop: '18px', color: '#334155', lineHeight: '1.8', whiteSpace: 'pre-line' }}>{assignment.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '22px', color: '#475569', fontSize: '0.95rem' }}>
                    <span><strong>Due:</strong> {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'Not set'}</span>
                    {assignment.file && (
                        <a href={getMediaUrl(assignment.file)} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', fontWeight: 600 }}>
                            Download assignment attachment
                        </a>
                    )}
                </div>
            </div>

            {role === 'student' && (
                <div style={{ marginBottom: '24px' }}>
                    <SubmissionForm assignmentId={id} />
                </div>
            )}

            {role === 'teacher' && (
                <div>
                    <SubmissionList assignmentId={id} />
                </div>
            )}
        </div>
    );
};

export default AssignmentDetail;