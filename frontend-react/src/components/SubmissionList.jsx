import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const getMediaUrl = (path) => path?.startsWith('http') ? path : `${API.defaults.baseURL}${path}`;

const SubmissionList = ({ assignmentId }) => {
    const [submissions, setSubmissions] = useState([]);
    const [analyzing, setAnalyzing] = useState({});
    const [analysisMap, setAnalysisMap] = useState({});
    const navigate = useNavigate();

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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>

                                        {/* Analyze button placed where the red mark is in the screenshot */}
                                        <button
                                            onClick={async () => {
                                                if (analyzing[sub.id]) return;
                                                setAnalyzing(prev => ({ ...prev, [sub.id]: true }));
                                                try {
                                                    const res = await API.post('/api/analyze/', { submission_id: sub.id });
                                                    const report = res.data.report || res.data;
                                                    setAnalysisMap(prev => ({ ...prev, [sub.id]: report }));
                                                } catch (err) {
                                                    console.error('Analyze failed for submission', sub.id, err);
                                                } finally {
                                                    setAnalyzing(prev => ({ ...prev, [sub.id]: false }));
                                                }
                                            }}
                                            disabled={!!analyzing[sub.id]}
                                            style={{
                                                backgroundColor: analyzing[sub.id] ? '#a78bfa' : '#4f46e5',
                                                color: '#fff',
                                                padding: '8px 12px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                cursor: analyzing[sub.id] ? 'wait' : 'pointer',
                                                fontWeight: 600
                                            }}
                                        >
                                            {analyzing[sub.id] ? 'Analyzing...' : 'Analyze for AI Content'}
                                        </button>

                                        {analysisMap[sub.id] && (
                                            <button onClick={() => navigate(`/submission/${sub.id}`)} style={{ background: 'transparent', border: 'none', color: '#4338ca', fontWeight: 700, cursor: 'pointer' }}>
                                                View analysis
                                            </button>
                                        )}
                                    </div>
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
