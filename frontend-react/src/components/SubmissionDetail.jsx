import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';

const SubmissionDetail = () => {
    const { id } = useParams();
    const [submission, setSubmission] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sourceLoading, setSourceLoading] = useState(false);
    const [sourceError, setSourceError] = useState(null);
    const [verifyStatus, setVerifyStatus] = useState(null);
    const contentRef = useRef(null);
    const pollTimeoutRef = useRef(null);

    const fetchSubmission = async () => {
        try {
            const res = await API.get(`/api/classroom/submissions/${id}/`);
            setSubmission(res.data);
            if (res.data.analysis_report) {
                setAnalysis(res.data.analysis_report);
            }
        } catch (err) {
            console.error('Error loading submission', err);
            setError('Failed to load submission');
        }
    };

    useEffect(() => {
        fetchSubmission();
        return () => {
            if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
            }
        };
    }, [id]);

    const reportHasSourceData = (report) => {
        return Array.isArray(report?.chunks) && report.chunks.some((chunk) => chunk.source !== undefined && chunk.source !== null);
    };

    const reportIsVerified = (report) => {
        return report?.source_verification?.completed === true;
    };

    const pollForVerificationCompletion = async (attempt = 1) => {
        if (attempt > 8) {
            setVerifyStatus('Source lookup is still running in background. Refresh this page later to see the results.');
            return;
        }

        try {
            const res = await API.get(`/api/classroom/submissions/${id}/`);
            const latest = res.data.analysis_report;
            if (latest && reportIsVerified(latest) && !reportIsVerified(analysis)) {
                setAnalysis(latest);
                setVerifyStatus(reportHasSourceData(latest)
                    ? 'Source verification completed. Source results are now available.'
                    : 'Source verification completed. No matching source was found.');
                return;
            }
        } catch (err) {
            console.warn('Verification poll failed', err);
        }

        pollTimeoutRef.current = setTimeout(() => pollForVerificationCompletion(attempt + 1), 3000);
    };

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        setVerifyStatus(null);
        setSourceError(null);
        try {
            const res = await API.post('/api/analyze/', {
                submission_id: id
            });
            const report = res.data.report || res.data;
            setAnalysis(report);
            setVerifyStatus('Analysis complete. Click Verify Sources to run source lookup.');
            console.debug('Submission analysis report loaded', report);
        } catch (err) {
            console.error('Report generation failed', err);
            setError('Report generation failed. Try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySources = async (reportToVerify = null) => {
        const report = reportToVerify || analysis;
        if (!report) {
            setVerifyStatus('Run analysis first before verifying sources.');
            return;
        }
        if (sourceLoading) return;

        setSourceLoading(true);
        setSourceError(null);
        setVerifyStatus('Source verification started...');

        try {
            const res = await API.post('/api/verify-sources/', {
                submission_id: id,
            });
            const latestReport = res.data.report || res.data;
            setAnalysis(latestReport);
            setVerifyStatus('Source verification started in the background. Checking for results...');
            pollForVerificationCompletion();
        } catch (err) {
            console.error('Source verification failed', err);
            setSourceError('Source lookup failed. It may still complete in the background.');
            setVerifyStatus('Source verification failed.');
        } finally {
            setSourceLoading(false);
        }
    };

    const openSource = (url) => {
        if (!url) return;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (!submission && !error) return <div className="p-6">Loading submission...</div>;

    return (
        <div className="px-8 py-8 min-h-screen">
            <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{submission?.title || 'Submission'}</h2>
                        <p className="text-sm text-gray-500">Student: <strong>{submission?.student_name}</strong></p>
                        <p className="text-sm text-gray-500">Submitted: {submission?.submitted_at}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex flex-row items-center gap-3 flex-wrap justify-end">
                            <button
                                type="button"
                                onClick={handleGenerateReport}
                                disabled={loading || sourceLoading}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-150 ${loading ? 'bg-sky-300 text-white cursor-wait opacity-70' : 'bg-sky-600 text-white hover:bg-sky-500 active:scale-[0.98]'} ${!loading ? 'cursor-pointer' : ''}`}
                            >
                                {loading ? 'Generating report...' : 'Generate Report'}
                            </button>
                            <button
                                type="button"
                                onClick={handleVerifySources}
                                disabled={sourceLoading}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-150 ${sourceLoading ? 'bg-sky-300 text-white cursor-wait opacity-70' : 'bg-sky-600 text-white hover:bg-sky-500 active:scale-[0.98]'} ${!sourceLoading ? 'cursor-pointer' : ''}`}
                            >
                                {sourceLoading ? 'Verifying sources...' : 'Verify Sources'}
                            </button>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            {error && <div className="text-sm text-red-600">{error}</div>}
                            {sourceError && <div className="text-sm text-amber-600">{sourceError}</div>}
                            {verifyStatus && <div className="text-sm text-slate-600">{verifyStatus}</div>}
                        </div>
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
                                            {chunk.source?.search_debug && (
                                                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                                                    <p className="font-semibold text-slate-700">Search debug</p>
                                                    {chunk.source.search_debug.slice(0, 3).map((debug, debugIdx) => (
                                                        <div key={debugIdx} className="mt-2">
                                                            <div className="text-slate-500">Engine: {debug.engine}</div>
                                                            <div className="text-slate-500">Query: {debug.query}</div>
                                                            <div className="text-slate-500">URLs: {debug.urls.length > 0 ? debug.urls.join(', ') : 'none'}</div>
                                                            {debug.error && <div className="text-rose-600">Error: {debug.error}</div>}
                                                        </div>
                                                    ))}
                                                </div>
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
                    {analysis && sourceLoading && (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            Source lookup is running in the background. The report will update when complete.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionDetail;