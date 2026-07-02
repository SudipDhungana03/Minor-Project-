import React, { useState, useEffect } from 'react';
import API from '../services/api';

const getMediaUrl = (path) => path?.startsWith('http') ? path : `${API.defaults.baseURL}${path}`;

const SubmissionList = ({ assignmentId }) => {
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await API.get(`/api/classroom/submissions/for_assignment/?assignment_id=${assignmentId}`);
                setSubmissions(res.data);
            } catch (err) {
                console.error("Error fetching submissions:", err);
            }
        };
        fetchSubmissions();
    }, [assignmentId]);

    return (
        <div>
            <h4>Student Submissions</h4>
            {submissions.map(sub => (
                <div key={sub.id} style={{ border: '1px solid #ddd', margin: '10px 0', padding: '12px', borderRadius: '14px' }}>
                    <p><strong>Student:</strong> {sub.student_username || sub.student}</p>
                    <p><strong>Note:</strong> {sub.content || 'No note provided'}</p>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '8px' }}><strong>Submitted:</strong> {new Date(sub.submitted_at).toLocaleString()}</p>
                    {sub.file ? (
                        <a href={getMediaUrl(sub.file)} target="_blank" rel="noreferrer" style={{ color: '#4338ca', fontWeight: 600 }}>
                            Download Submission
                        </a>
                    ) : (
                        <span style={{ color: '#9ca3af' }}>No file attached</span>
                    )}
                </div>
            ))}
        </div>
    );
};

export default SubmissionList;
