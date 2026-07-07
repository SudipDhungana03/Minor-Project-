import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const SubmissionDetail = () => {
    const { id } = useParams(); // Gets the submission ID from the URL
    const [submission, setSubmission] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch the submission content
    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/api/submissions/${id}/`)
            .then(res => setSubmission(res.data))
            .catch(err => console.error("Error loading submission", err));
    }, [id]);

    // Handle AI Analysis
    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/analyze/`, { 
                submission_id: id 
            });
            setAnalysis(res.data.report); // Expects { chunks: [{text, ai_probability}, ...] }
        } catch (err) {
            console.error("Analysis failed", err);
        } finally {
            setLoading(false);
        }
    };

    if (!submission) return <div>Loading...</div>;

    return (
        <div className="submission-container">
            <h1>Submission Details</h1>
            <p>{submission.student_name}</p>

            <button onClick={handleAnalyze} disabled={loading}>
                {loading ? "Analyzing..." : "Analyze for AI Content"}
            </button>

            <div className="content-box" style={{ marginTop: '20px', lineHeight: '1.6' }}>
                {analysis ? (
                    // Render highlighted text
                    analysis.chunks.map((chunk, index) => (
                        <span 
                            key={index} 
                            style={{ 
                                backgroundColor: chunk.ai_probability > 0.7 ? '#ffcccc' : 'transparent',
                                borderBottom: chunk.ai_probability > 0.7 ? '2px solid red' : 'none'
                            }}
                        >
                            {chunk.text}{' '}
                        </span>
                    ))
                ) : (
                    <p>{submission.content}</p>
                )}
            </div>
        </div>
    );
};

export default SubmissionDetail;