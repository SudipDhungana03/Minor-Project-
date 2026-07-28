import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const getMediaUrl = (path) => path?.startsWith('http') ? path : `${API.defaults.baseURL}${path}`;

const highlightText = (text, highlights = []) => {
    if (!text) return null;
    const safeText = text;
    const sortedHighlights = [...highlights].sort((a, b) => (a?.start ?? 0) - (b?.start ?? 0));
    const parts = [];
    let cursor = 0;

    sortedHighlights.forEach((highlight, index) => {
        const start = highlight?.start ?? 0;
        const end = highlight?.end ?? start;
        if (start > cursor) {
            parts.push(<span key={`text-${index}`}>{safeText.slice(cursor, start)}</span>);
        }
        if (end > start) {
            parts.push(<mark key={`mark-${index}`} style={{ backgroundColor: '#fde68a', padding: '0 2px', borderRadius: '4px' }}>{safeText.slice(start, end)}</mark>);
        }
        cursor = Math.max(cursor, end);
    });

    if (cursor < safeText.length) {
        parts.push(<span key="tail">{safeText.slice(cursor)}</span>);
    }

    return <>{parts}</>;
};

const SubmissionList = ({ assignmentId }) => {
    const [submissions, setSubmissions] = useState([]);
    const [analyzing, setAnalyzing] = useState({});
    const [analysisMap, setAnalysisMap] = useState({});
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [batchLoading, setBatchLoading] = useState(false);
    const [batchReport, setBatchReport] = useState(null);
    const [batchError, setBatchError] = useState('');
    const [comparisonPair, setComparisonPair] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await API.get(`/api/classroom/assignments/for_assignment/?assignment_id=${assignmentId}`);
                const sorted = res.data.slice().sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
                setSubmissions(sorted);
                setSelectedIds(sorted.map((submission) => submission.id));
            } catch (err) {
                console.error('Error fetching submissions:', err);
            }
        };
        fetchSubmissions();
    }, [assignmentId]);

    const toggleSelection = (submissionId) => {
        setSelectedIds((prev) => (prev.includes(submissionId) ? prev.filter((id) => id !== submissionId) : [...prev, submissionId]));
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === submissions.length) {
            setSelectedIds([]);
            return;
        }
        setSelectedIds(submissions.map((submission) => submission.id));
    };

    const handleBatchAnalysis = async () => {
        if (!selectedIds.length) {
            setBatchError('Select at least one submission to compare.');
            return;
        }

        setBatchLoading(true);
        setBatchError('');
        try {
            const response = await API.post('/api/plagiarism/batch/', { submission_ids: selectedIds });
            setBatchReport(response.data);
            setShowBatchModal(true);
        } catch (error) {
            console.error('Batch plagiarism analysis failed:', error);
            setBatchError('Batch comparison could not be completed.');
        } finally {
            setBatchLoading(false);
        }
    };

    const openPairComparison = (leftSubmission, rightSubmission, cell) => {
        if (!leftSubmission || !rightSubmission || !cell) return;
        setComparisonPair({ leftSubmission, rightSubmission, cell });
    };

    const getSubmissionById = (submissionId) => submissions.find((item) => item.id === submissionId) || null;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <h4 style={{ fontSize: '1.2rem', margin: 0 }}>Student Submissions</h4>
                <button
                    onClick={() => setShowBatchModal(true)}
                    style={{ background: 'linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)', color: '#fff', border: 'none', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}
                >
                    Check Plagiarism
                </button>
            </div>

            {submissions.length === 0 ? (
                <div style={{ padding: '16px', color: '#6b7280', backgroundColor: '#f8fafc', borderRadius: '14px' }}>
                    No submissions have been received yet for this assignment.
                </div>
            ) : (
                submissions.map((sub) => (
                    <div key={sub.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', margin: '12px 0', padding: '18px', backgroundColor: '#ffffff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="checkbox" checked={selectedIds.includes(sub.id)} onChange={() => toggleSelection(sub.id)} />
                                <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>Student: {sub.student_username || sub.student}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
                                <button
                                    onClick={async () => {
                                        if (analyzing[sub.id]) return;
                                        setAnalyzing((prev) => ({ ...prev, [sub.id]: true }));
                                        try {
                                            const res = await API.post('/api/analyze/', { submission_id: sub.id });
                                            const report = res.data.report || res.data;
                                            setAnalysisMap((prev) => ({ ...prev, [sub.id]: report }));
                                        } catch (err) {
                                            console.error('Analyze failed for submission', sub.id, err);
                                        } finally {
                                            setAnalyzing((prev) => ({ ...prev, [sub.id]: false }));
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
                                        fontWeight: 600,
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

            {showBatchModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Batch plagiarism comparison</h3>
                                <p style={{ margin: '4px 0 0', color: '#64748b' }}>Select the files you want to compare and review overlap across the selected set.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button onClick={toggleSelectAll} style={{ padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                                    {selectedIds.length === submissions.length ? 'Clear All' : 'Select All'}
                                </button>
                                <button onClick={handleBatchAnalysis} disabled={batchLoading} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: batchLoading ? 'wait' : 'pointer', fontWeight: 700 }}>
                                    {batchLoading ? 'Comparing...' : 'Run Comparison'}
                                </button>
                                <button onClick={() => { setShowBatchModal(false); setBatchReport(null); setBatchError(''); setComparisonPair(null); }} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer' }}>
                                    Close
                                </button>
                            </div>
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {submissions.map((submission) => (
                                <label key={submission.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '999px', background: selectedIds.includes(submission.id) ? '#ede9fe' : '#f8fafc', color: '#111827' }}>
                                    <input type="checkbox" checked={selectedIds.includes(submission.id)} onChange={() => toggleSelection(submission.id)} />
                                    <span>{submission.student_username || submission.student}</span>
                                </label>
                            ))}
                        </div>

                        {batchError ? <div style={{ marginTop: '16px', color: '#b91c1c' }}>{batchError}</div> : null}

                        {batchReport ? (
                            <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Submission</th>
                                            {batchReport.submitted_files.map((file) => (
                                                <th key={file.id} style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{file.student_name || file.title}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batchReport.matrix.map((row, index) => {
                                            const leftFile = batchReport.submitted_files[index];
                                            return (
                                                <tr key={leftFile.id}>
                                                    <td style={{ padding: '10px', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>{leftFile.student_name || leftFile.title}</td>
                                                    {row.map((cell) => {
                                                        const rightFile = batchReport.submitted_files.find((item) => item.id === cell.submission_id);
                                                        return (
                                                            <td key={`${leftFile.id}-${cell.submission_id}`} style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>
                                                                {cell.is_diagonal ? (
                                                                    <span style={{ color: '#64748b' }}>Self</span>
                                                                ) : (
                                                                    <button onClick={() => openPairComparison(getSubmissionById(leftFile.id), getSubmissionById(rightFile?.id), cell)} style={{ color: cell.flagged ? '#b45309' : '#4f46e5', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                                                                        {cell.flagged ? 'Review' : 'Low'}
                                                                    </button>
                                                                )}
                                                                <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#475569', title: 'J=Jaccard (token overlap) · T=TF-IDF (term frequency) · S=Semantic (weighted overlap)' }}>
                                                                    J: {cell.scores?.jaccard ?? 0} · T: {cell.scores?.tfidf ?? 0} · S: {cell.scores?.semantic ?? 0}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {comparisonPair && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Side-by-side comparison</h3>
                                <p style={{ margin: '4px 0 0', color: '#64748b' }}>Highlights show the overlapping text segments detected by the comparison engine.</p>
                            </div>
                            <button onClick={() => setComparisonPair(null)} style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer' }}>
                                Close
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '18px' }}>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', background: '#f8fafc' }}>
                                <h4 style={{ marginTop: 0 }}>{comparisonPair.leftSubmission?.student_username || comparisonPair.leftSubmission?.student || 'Left submission'}</h4>
                                <div style={{ marginTop: '10px', minHeight: '280px', maxHeight: '420px', overflowY: 'auto', lineHeight: 1.7 }}>
                                    {comparisonPair.leftSubmission?.file ? (
                                        <div>
                                            {(() => {
                                                const fileUrl = getMediaUrl(comparisonPair.leftSubmission.file);
                                                const isPdf = /\.pdf$/i.test(fileUrl);
                                                if (isPdf) {
                                                    return <iframe title="left-document" src={fileUrl} style={{ width: '100%', height: '320px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />;
                                                }
                                                return <div>{highlightText(comparisonPair.leftSubmission?.content || comparisonPair.leftSubmission?.extracted_text || '', comparisonPair.cell?.highlights?.map((item) => item.left) || [])}</div>;
                                            })()}
                                        </div>
                                    ) : (
                                        <div>{highlightText(comparisonPair.leftSubmission?.content || '', comparisonPair.cell?.highlights?.map((item) => item.left) || [])}</div>
                                    )}
                                </div>
                            </div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', background: '#f8fafc' }}>
                                <h4 style={{ marginTop: 0 }}>{comparisonPair.rightSubmission?.student_username || comparisonPair.rightSubmission?.student || 'Right submission'}</h4>
                                <div style={{ marginTop: '10px', minHeight: '280px', maxHeight: '420px', overflowY: 'auto', lineHeight: 1.7 }}>
                                    {comparisonPair.rightSubmission?.file ? (
                                        <div>
                                            {(() => {
                                                const fileUrl = getMediaUrl(comparisonPair.rightSubmission.file);
                                                const isPdf = /\.pdf$/i.test(fileUrl);
                                                if (isPdf) {
                                                    return <iframe title="right-document" src={fileUrl} style={{ width: '100%', height: '320px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />;
                                                }
                                                return <div>{highlightText(comparisonPair.rightSubmission?.content || comparisonPair.rightSubmission?.extracted_text || '', comparisonPair.cell?.highlights?.map((item) => item.right) || [])}</div>;
                                            })()}
                                        </div>
                                    ) : (
                                        <div>{highlightText(comparisonPair.rightSubmission?.content || '', comparisonPair.cell?.highlights?.map((item) => item.right) || [])}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmissionList;
