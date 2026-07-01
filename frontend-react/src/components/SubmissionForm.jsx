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
            await API.post('/api/classroom/submissions/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
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
        <form onSubmit={handleSubmit} style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px' }}>
            <h4>Submit Assignment</h4>
            <div>
                <textarea 
                    placeholder="Add a comment or note..." 
                    value={content}
                    onChange={(e) => setContent(e.target.value)} 
                    style={{ width: '100%', marginBottom: '10px' }}
                />
            </div>
            <div>
                <input 
                    type="file" 
                    onChange={(e) => setFile(e.target.files[0])} 
                    required 
                />
            </div>
            <button type="submit" disabled={loading} style={{ marginTop: '10px' }}>
                {loading ? 'Submitting...' : 'Turn In'}
            </button>
        </form>
    );
};

export default SubmissionForm;