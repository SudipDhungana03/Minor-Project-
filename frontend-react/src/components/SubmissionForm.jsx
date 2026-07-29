import React, { useState, useRef } from 'react';
import API from '../services/api';
import { Card, Button } from './ui';

const SubmissionForm = ({ assignmentId }) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('assignment', assignmentId);
    formData.append('content', content);
    if (file) {
      formData.append('file', file);
    }

    try {
      await API.post('/api/classroom/submissions/', formData);
      setContent('');
      setFile(null);
      setSubmitted(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h4 className="text-xl font-bold text-ink mb-6">Submit assignment</h4>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="w-full">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-ink-muted mb-1.5"
          >
            Comment or note
          </label>
          <textarea
            id="content"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-ink placeholder:text-slate-400
              h-32 resize-y transition-all duration-200 outline-none focus:border-brand-500 focus:shadow-ring"
            placeholder="Add a comment or note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-ink-muted mb-1.5">
            Your file
          </label>
          <input
            ref={fileInputRef}
            type="file"
            required
            onChange={(e) => {
              setFile(e.target.files[0]);
              if (submitted) setSubmitted(false);
            }}
            className="w-full text-sm text-ink-soft file:mr-4 file:py-2 file:px-4 file:rounded-full
              file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold hover:file:bg-brand-100
              cursor-pointer"
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button
          type="submit"
          fullWidth
          size="lg"
          variant={submitted ? 'secondary' : 'primary'}
          disabled={loading}
        >
          {loading ? 'Submitting...' : submitted ? 'Submitted' : 'Turn in'}
        </Button>
      </form>
    </Card>
  );
};

export default SubmissionForm;
