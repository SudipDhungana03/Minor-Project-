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

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await API.post('/api/analyze/', {
                submission_id: id
            });
            const report = res.data.report || res.data;
            setAnalysis(report);
            console.debug('Submission analysis report loaded', report);
        } catch (err) {
            console.error('Report generation failed', err);
            setError('Report generation failed. Try again later.');
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
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg font-semibold transition ${loading ? 'bg-indigo-300 text-white cursor-wait' : 'bg-indigo-700 text-white hover:bg-indigo-600'}`}
                        >
                            {loading ? 'Generating report...' : 'Generate Report'}
                        </button>
                        {error && <div className="text-sm text-red-600">{error}</div>}
                    </div>
                </div>

                <div ref={contentRef} className="mt-6 text-gray-800 leading-relaxed">
                    {analysis && Array.isArray(analysis.chunks) && analysis.chunks.length > 0 ? (
                        <div className="space-y-8">
                            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-900">AI Analysis Report</h3>
                                        <p className="mt-2 text-sm text-slate-600">Professional report summary with probability scoring, sources and verdict.</p>
                                    </div>
                                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm">{analysis.verdict}</div>
                                </div>

                                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Text</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{analysis.ai_text_percentage}%</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Chunks</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{analysis.ai_chunks} / {analysis.total_chunks}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Average Score</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{Math.round(analysis.average_probability * 100)}%</p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-sm font-semibold text-slate-700">Chunk probability chart</h4>
                                    <div className="mt-4 space-y-3">
                                        {analysis.chunks.map((chunk, idx) => {
                                            const percent = Math.round((chunk.probability || 0) * 100);
                                            const barColor = percent >= 70 ? 'bg-red-500' : percent >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
                                            return (
                                                <div key={idx}>
                                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                                        <span>Chunk {idx + 1}</span>
                                                        <span>{percent}%</span>
                                                    </div>
                                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                                        <div className={`${barColor} h-full rounded-full`} style={{ width: `${Math.min(100, percent)}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                {analysis.chunks.map((chunk, idx) => {
                                    const isFlagged = !!chunk.is_ai;
                                    const sourceUrl = chunk.source?.source_url || chunk.source?.source || null;
                                    const sourceScore = chunk.source?.score ?? chunk.source?.confidence ?? null;
                                    return (
                                        <article key={idx} className={`rounded-2xl border p-5 ${isFlagged ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Chunk {idx + 1}</p>
                                                    <h4 className="mt-1 text-lg font-semibold text-slate-900">{isFlagged ? 'AI-like text detected' : 'Human-like text'}</h4>
                                                </div>
                                                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">Score: {Math.round((chunk.probability || 0) * 100)}%</div>
                                            </div>
                                            <div className="mt-4 text-sm leading-7 text-slate-800">
                                                <p>{chunk.text}</p>
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                                                <span>Sentences: {chunk.sentence_count}</span>
                                                <span>Words: {chunk.word_count}</span>
                                                <span>Status: {isFlagged ? 'AI suspected' : 'Likely human'}</span>
                                            </div>
                                            <div className="mt-4 text-sm text-slate-700">
                                                <p className="font-semibold">Source:</p>
                                                {sourceUrl ? (
                                                    <button onClick={() => openSource(sourceUrl)} className="text-indigo-600 underline hover:text-indigo-800">
                                                        {sourceUrl}
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-500">No source found</span>
                                                )}
                                            </div>
                                            {sourceScore !== null && (
                                                <div className="mt-2 text-sm text-slate-600">Source confidence: {sourceScore}</div>
                                            )}
                                        </article>
                                    );
                                })}
                            </section>
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