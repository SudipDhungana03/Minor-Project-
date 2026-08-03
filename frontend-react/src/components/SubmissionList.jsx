import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Card, Button, Badge, EmptyState } from './ui';

const getMediaUrl = (path) => path?.startsWith('http') ? path : `${API.defaults.baseURL}${path}`;

// Color palette for highlighting matching chunks
const HIGHLIGHT_COLORS = [
    '#FEF3C7', '#E0F2FE', '#ECFDF5', '#FCE7F3', '#EFF6FF',
    '#F5F3FF', '#FFF7ED', '#F8FAFC', '#FDF2F8', '#EFF6EE',
    '#FFF1F2', '#EFFAFB', '#FAF5FF', '#FFFBEB', '#EDE9FE'
];

const getChunkColor = (colorId) => {
    if (colorId < 0) return '#fde68a';
    return HIGHLIGHT_COLORS[colorId % HIGHLIGHT_COLORS.length];
};

const highlightText = (text, highlights = []) => {
    if (!text) return null;
    const safeText = text;
    const validHighlights = [...highlights]
        .filter((highlight) => highlight && typeof highlight.start === 'number' && typeof highlight.end === 'number' && highlight.end > highlight.start)
        .sort((a, b) => (a.start || 0) - (b.start || 0))
        .reduce((acc, highlight) => {
            const start = Math.max(highlight.start, acc.cursor);
            const end = Math.min(highlight.end, safeText.length);
            if (end > start) {
                acc.highlights.push({ ...highlight, start, end });
                acc.cursor = end;
            }
            return acc;
        }, { highlights: [], cursor: 0 }).highlights;
    const parts = [];
    let cursor = 0;

    validHighlights.forEach((highlight, index) => {
        const start = highlight.start;
        const end = highlight.end;
        if (start > cursor) {
            parts.push(<span key={`text-${index}`}>{safeText.slice(cursor, start)}</span>);
        }
        const backgroundColor = getChunkColor(highlight?.color_id ?? -1);
        parts.push(
            <mark
                key={`mark-${index}`}
                className="highlight-tooltip"
                data-tooltip={`J: ${highlight?.jaccard}, T: ${highlight?.tfidf}, S: ${highlight?.semantic}`}
                style={{
                    backgroundColor,
                    padding: '0 3px',
                    borderRadius: '6px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    cursor: 'help',
                    position: 'relative',
                    display: 'inline-block',
                }}
                title={`J: ${highlight?.jaccard}, T: ${highlight?.tfidf}, S: ${highlight?.semantic}`}
            >
                {safeText.slice(start, end)}
            </mark>
        );
        cursor = Math.max(cursor, end);
    });

    if (cursor < safeText.length) {
        parts.push(<span key="tail">{safeText.slice(cursor)}</span>);
    }

    return <>{parts}</>;
};

const annotateSideHighlights = (highlights, side) => {
    return (highlights || [])
        .map((item) => {
            if (!item || !item[side]) return null;
            return {
                start: item[side].start,
                end: item[side].end,
                color_id: item.color_id,
                jaccard: item.jaccard,
                tfidf: item.tfidf,
                semantic: item.semantic,
            };
        })
        .filter(Boolean);
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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <h4 className="text-xl font-bold text-ink m-0">Student submissions</h4>
                <Button onClick={() => setShowBatchModal(true)}>Check plagiarism</Button>
            </div>

            {submissions.length === 0 ? (
                <EmptyState
                    title="No submissions yet"
                    description="Submissions from your students will appear here once they turn in their work."
                />
            ) : (
                <div className="space-y-4">
                    {submissions.map((sub) => (
                        <Card key={sub.id} className="!p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-brand-600"
                                        checked={selectedIds.includes(sub.id)}
                                        onChange={() => toggleSelection(sub.id)}
                                    />
                                    <p className="m-0 font-semibold text-ink">
                                        {sub.student_username || sub.student}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <p className="m-0 text-sm text-ink-soft">
                                        {new Date(sub.submitted_at).toLocaleString()}
                                    </p>
                                    <div className="flex flex-col items-end gap-2">
                                        <Button
                                            size="sm"
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
                                        >
                                            {analyzing[sub.id] ? 'Analyzing...' : 'Analyze for AI content'}
                                        </Button>
                                        {analysisMap[sub.id] && (
                                            <button
                                                onClick={() => navigate(`/submission/${sub.id}`)}
                                                className="bg-transparent border-0 text-brand-600 font-bold cursor-pointer hover:text-brand-700"
                                            >
                                                View analysis
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className="mt-3 mb-2 text-ink-soft">
                                <span className="font-semibold text-ink-muted">Description:</span>{' '}
                                {sub.content || 'No description provided.'}
                            </p>
                            {sub.file ? (
                                <a
                                    href={getMediaUrl(sub.file)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                                >
                                    Download student attachment
                                </a>
                            ) : (
                                <p className="m-0 text-slate-400">No file attached.</p>
                            )}
                        </Card>
                    ))}
                </div>
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
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', alignItems: 'center' }}>
                                    <div style={{ display: 'inline-flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ padding: '8px 12px', background: '#eff6ff', color: '#2563eb', borderRadius: '999px', fontSize: '0.88rem', fontWeight: 600 }}>Files: {batchReport.submitted_files.length}</span>
                                        <span style={{ padding: '8px 12px', background: '#fef9c3', color: '#a16207', borderRadius: '999px', fontSize: '0.88rem', fontWeight: 600 }}>Flagged pairs: {batchReport.summary?.flagged_pairs ?? 0}</span>
                                    </div>
                                    <div style={{ color: '#475569', fontSize: '0.95rem' }}>Click verdict buttons to review exact text overlap.</div>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <th style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Submission</th>
                                            {batchReport.submitted_files.map((file) => (
                                                <th key={file.id} style={{ padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>{file.student_name || file.title}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {batchReport.matrix.map((row, index) => {
                                            const leftFile = batchReport.submitted_files[index];
                                            return (
                                                <tr key={leftFile.id}>
                                                    <td style={{ padding: '12px 14px', fontWeight: 700, borderBottom: '1px solid #e2e8f0', background: '#fff' }}>{leftFile.student_name || leftFile.title}</td>
                                                    {row.map((cell) => {
                                                        const rightFile = batchReport.submitted_files.find((item) => item.id === cell.submission_id);
                                                        const cellBackground = cell.is_diagonal ? '#f8fafc' : cell.verdict === 'High similarity' ? '#fee2e2' : cell.verdict === 'Moderate similarity' ? '#fef3c7' : cell.verdict === 'Low similarity' ? '#e0f2fe' : '#ecfdf5';
                                                        return (
                                                            <td key={`${leftFile.id}-${cell.submission_id}`} style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', background: cellBackground }}>
                                                                {cell.is_diagonal ? (
                                                                    <span style={{ color: '#64748b', fontWeight: 600 }}>Self</span>
                                                                ) : (
                                                                    <button onClick={() => openPairComparison(getSubmissionById(leftFile.id), getSubmissionById(rightFile?.id), cell)} style={{ color: '#fff', background: cell.verdict === 'High similarity' ? '#c2410c' : cell.verdict === 'Moderate similarity' ? '#ca8a04' : cell.verdict === 'Low similarity' ? '#2563eb' : '#10b981', border: 'none', borderRadius: '999px', padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>
                                                                        {cell.verdict}
                                                                    </button>
                                                                )}
                                                                <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#475569' }} title='J=Jaccard (token overlap) · T=TF-IDF (term frequency) · S=Semantic (weighted overlap)'>
                                                                    Score: {cell.overall_score ?? 0} · J: {cell.scores?.jaccard ?? 0} · T: {cell.scores?.tfidf ?? 0} · S: {cell.scores?.semantic ?? 0}
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
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', background: '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <h4 style={{ marginTop: 0, marginBottom: 0 }}>{comparisonPair.leftSubmission?.student_username || comparisonPair.leftSubmission?.student || 'Left submission'}</h4>
                                    <span style={{ background: '#eef2ff', color: '#3730a3', borderRadius: '999px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 700 }}>Score: {comparisonPair.cell?.overall_score ?? 0}</span>
                                </div>
                                <div style={{ marginTop: '10px', minHeight: '280px', maxHeight: '420px', overflowY: 'auto', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                                    {(() => {
                                        // Always render the ORIGINAL document content (extracted text preserving
                                        // its original arrangement) with the plagiarism highlights applied in place.
                                        const leftFile = batchReport?.submitted_files?.find((f) => f.id === comparisonPair.leftSubmission.id);
                                        const displayText = leftFile?.text || comparisonPair.leftSubmission?.content || '';
                                        return (
                                            <div>
                                                {highlightText(displayText, annotateSideHighlights(comparisonPair.cell?.highlights, 'left'))}
                                                {comparisonPair.leftSubmission?.file && (
                                                    <div style={{ marginTop: '10px' }}>
                                                        <a href={getMediaUrl(comparisonPair.leftSubmission.file)} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', fontWeight: 600, fontSize: '0.85rem' }}>
                                                            Open original file
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', background: '#f8fafc' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <h4 style={{ marginTop: 0, marginBottom: 0 }}>{comparisonPair.rightSubmission?.student_username || comparisonPair.rightSubmission?.student || 'Right submission'}</h4>
                                    <span style={{ background: comparisonPair.cell?.verdict === 'High similarity' ? '#fee2e2' : comparisonPair.cell?.verdict === 'Moderate similarity' ? '#fef3c7' : comparisonPair.cell?.verdict === 'Low similarity' ? '#e0f2fe' : '#ecfdf5', color: comparisonPair.cell?.verdict === 'High similarity' ? '#991b1b' : comparisonPair.cell?.verdict === 'Moderate similarity' ? '#92400e' : comparisonPair.cell?.verdict === 'Low similarity' ? '#1d4ed8' : '#065f46', borderRadius: '999px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 700 }}>{comparisonPair.cell?.verdict}</span>
                                </div>
                                <div style={{ marginTop: '10px', minHeight: '280px', maxHeight: '420px', overflowY: 'auto', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                                    {(() => {
                                        // Always render the ORIGINAL document content with highlights in place.
                                        const rightFile = batchReport?.submitted_files?.find((f) => f.id === comparisonPair.rightSubmission.id);
                                        const displayText = rightFile?.text || comparisonPair.rightSubmission?.content || '';
                                        return (
                                            <div>
                                                {highlightText(displayText, annotateSideHighlights(comparisonPair.cell?.highlights, 'right'))}
                                                {comparisonPair.rightSubmission?.file && (
                                                    <div style={{ marginTop: '10px' }}>
                                                        <a href={getMediaUrl(comparisonPair.rightSubmission.file)} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', fontWeight: 600, fontSize: '0.85rem' }}>
                                                            Open original file
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                            <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem' }}>Hover over highlighted segments for J / T / S similarity details.</p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '999px', background: '#f0f9ff', color: '#1d4ed8', fontSize: '0.85rem' }}>High</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '999px', background: '#fdf2f8', color: '#9d174d', fontSize: '0.85rem' }}>Moderate</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '999px', background: '#ecfdf5', color: '#047857', fontSize: '0.85rem' }}>Clear</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmissionList;
