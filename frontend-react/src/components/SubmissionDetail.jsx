import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';

const SubmissionDetail = () => {
    const { id } = useParams();
    const [submission, setSubmission] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const contentRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await API.get(`/api/classroom/submissions/${id}/`);
                setSubmission(res.data);
                // If backend already provided analysis with submission, use it
                if (res.data.analysis_report) {
                    setAnalysis(res.data.analysis_report);
                }
            } catch (err) {
                console.error('Error loading submission', err);
                setError('Failed to load submission');
            }
        };
        load();
    }, [id]);

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await API.post('/api/analyze/', {
                submission_id: id
            });
            // Expecting { report: { chunks: [...] } } or { chunks: [...] }
            const report = res.data.report || res.data;
            setAnalysis(report);
                // Debug: log report for developer inspection
                console.debug('Submission analysis report loaded', report);
        } catch (err) {
            console.error('Analysis failed', err);
            setError('Analysis failed. Try again later.');
        } finally {
            setLoading(false);
        }
    };

    const openSource = (url) => {
        if (!url) return;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (!submission && !error) return <div className="p-6">Loading submission...</div>;

    return (
        <div className="ml-72 p-8">{/* shift right to account for sidebar width */}
            <div className="max-w-4xl bg-white rounded-xl shadow-md p-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{submission?.title || 'Submission'}</h2>
                        <p className="text-sm text-gray-500">Student: <strong>{submission?.student_name}</strong></p>
                        <p className="text-sm text-gray-500">Submitted: {submission?.submitted_at}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg font-semibold transition ${loading ? 'bg-indigo-300 text-white cursor-wait' : 'bg-indigo-700 text-white hover:bg-indigo-600'}`}
                        >
                            {loading ? 'Analyzing...' : 'Analyze for AI Content'}
                        </button>
                        {error && <div className="text-sm text-red-600">{error}</div>}
                    </div>
                </div>

                <div ref={contentRef} className="mt-6 text-gray-800 leading-relaxed">
                    {analysis && Array.isArray(analysis.chunks) && analysis.chunks.length > 0 ? (
                        <div className="prose max-w-none">
                            {analysis.chunks.map((chunk, idx) => {
                                const isFlagged = !!chunk.is_ai;
                                const sourceUrl = chunk.source?.source_url || null;

                                return (
                                    <span
                                        key={idx}
                                        className={`inline-block mr-1 ${isFlagged ? 'ai-flagged' : ''}`}
                                        data-source={sourceUrl || ''}
                                        role={isFlagged ? 'button' : undefined}
                                        aria-label={isFlagged ? (sourceUrl ? `Source: ${sourceUrl}` : 'AI detected') : undefined}
                                        title={isFlagged ? (sourceUrl ? `Source: ${sourceUrl}` : 'AI detected (no source)') : ''}
                                        onClick={(e) => { if (isFlagged && sourceUrl) { e.stopPropagation(); openSource(sourceUrl); } }}
                                    >
                                        {chunk.text}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="prose max-w-none">
                            <p>{submission?.content || submission?.extracted_text || 'No text content available for this submission.'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionDetail;