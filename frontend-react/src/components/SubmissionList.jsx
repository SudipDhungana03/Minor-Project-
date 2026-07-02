import React, { useState, useEffect } from 'react';
import API from '../services/api';

const getMediaUrl = (path) => path?.startsWith('http') ? path : `${API.defaults.baseURL}${path}`;

const SubmissionList = ({ assignmentId }) => {
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await API.get(`/api/classroom/assignments/for_assignment/?assignment_id=${assignmentId}`);
                const sorted = res.data.slice().sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
                setSubmissions(sorted);
            } catch (err) {
                console.error('Error fetching submissions:', err);
            }
        };
        fetchSubmissions();
    }, [assignmentId]);

    return (
        <div>
            <h4 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Student Submissions</h4>
            {submissions.length === 0 ? (
                <div style={{ padding: '16px', color: '#6b7280', backgroundColor: '#f8fafc', borderRadius: '14px' }}>
                    No submissions have been received yet for this assignment.
                </div>
            ) : (
                submissions.map(sub => (
                    <div key={sub.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', margin: '12px 0', padding: '18px', backgroundColor: '#ffffff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                            <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>Student: {sub.student_username || sub.student}</p>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
                        </div>
                        <p style={{ margin: '12px 0 8px', color: '#334155' }}><strong>Description:</strong> {sub.content || 'No description provided.'}</p>
                        {sub.file ? (
                            <a href={getMediaUrl(sub.file)} target="_blank" rel="noreferrer" style={{ color: '#4338ca', fontWeight: 600 }}>
                                Download student attachment
                            </a>
                        ) : (
                            <p style={{ margin: 0, color: '#9ca3af' }}>No file attached.</p>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default SubmissionList;
