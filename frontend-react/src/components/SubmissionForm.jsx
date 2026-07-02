import React, { useState } from 'react';
import API from '../services/api';

const SubmissionForm = ({ assignmentId }) => {
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // FormData is required for file uploads
        const formData = new FormData();
        formData.append('assignment', assignmentId);
        formData.append('content', content);
        if (file) {
            formData.append('file', file);
        }

        try {
            await API.post('/api/classroom/submissions/', formData);
            alert('Assignment submitted successfully!');
            setContent('');
            setFile(null);
        } catch (err) {
            console.error("Submission error:", err);
            alert('Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '18px', backgroundColor: '#ffffff' }}>
            <h4 style={{ marginBottom: '16px', color: '#111827', fontSize: '1.1rem' }}>Submit Assignment</h4>
            <div style={{ marginBottom: '16px' }}>
                <textarea 
                    placeholder="Add a comment or note..." 
                    value={content}
                    onChange={(e) => setContent(e.target.value)} 
                    style={{ width: '100%', minHeight: '120px', marginBottom: '10px', borderRadius: '14px', border: '1px solid #d1d5db', padding: '14px', resize: 'vertical' }}
                />
            </div>
            <div style={{ marginBottom: '18px' }}>
                <input 
                    type="file" 
                    onChange={(e) => setFile(e.target.files[0])} 
                    required 
                    style={{ borderRadius: '12px', border: '1px solid #d1d5db', padding: '10px', width: '100%' }}
                />
            </div>
            <button type="submit" disabled={loading} style={{ marginTop: '10px', width: '100%', borderRadius: '14px', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: 700, padding: '14px 18px', border: 'none', cursor: 'pointer' }}>
                {loading ? 'Submitting...' : 'Turn In'}
            </button>
        </form>
    );
};

export default SubmissionForm;