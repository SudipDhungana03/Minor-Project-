import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { Card, Button } from './ui';

const buildFileUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API.defaults.baseURL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const SubmissionForm = ({ assignmentId, assignment }) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);
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
      let response;
      if (existingSubmission) {
        response = await API.patch(
          `/api/classroom/submissions/${existingSubmission.id}/`,
          formData
        );
      } else {
        response = await API.post('/api/classroom/submissions/', formData);
      }

      const saved = response.data;
      setExistingSubmission(saved);
      setContent(saved.content || '');
      setFile(null);
      setSubmitted(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Submission error:', err);
      const message = err.response?.data?.error || err.response?.data?.detail || 'Failed to submit. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const dueDate = assignment?.due_date ? new Date(assignment.due_date) : null;
  const now = new Date();
  const deadlinePassed = dueDate ? now > dueDate : false;
  const canSubmit = !deadlinePassed;
  const submitLabel = existingSubmission
    ? deadlinePassed
      ? 'Deadline passed'
      : 'Update submission'
    : 'Turn in';

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
            disabled={loading || deadlinePassed}
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-ink-muted mb-1.5">
            Your file
          </label>
          {existingSubmission?.file_url && (
            <p className="mb-2 text-sm text-slate-600">
              Current file:{' '}
              <a
                href={buildFileUrl(existingSubmission.file_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                {existingSubmission.file_url.split('/').pop()}
              </a>
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            required={!existingSubmission}
            onChange={(e) => {
              setFile(e.target.files[0]);
              if (submitted) setSubmitted(false);
            }}
            disabled={loading || deadlinePassed}
            className="w-full text-sm text-ink-soft file:mr-4 file:py-2 file:px-4 file:rounded-full
              file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold hover:file:bg-brand-100
              cursor-pointer"
          />
        </div>

        {assignment?.due_date && (
          <p className={`text-sm ${deadlinePassed ? 'text-rose-600' : 'text-slate-500'}`}>
            Deadline: {new Date(assignment.due_date).toLocaleString()}
          </p>
        )}
        {deadlinePassed && (
          <p className="text-sm text-rose-600">The submission deadline has passed. You can no longer submit or edit.</p>
        )}
        {existingSubmission && !deadlinePassed && (
          <p className="text-sm text-emerald-700">You have already submitted. Edit your submission before the deadline.</p>
        )}
        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button
          type="submit"
          fullWidth
          size="lg"
          variant={submitted ? 'success' : 'primary'}
          disabled={loading || deadlinePassed}
        >
          {loading ? 'Submitting...' : submitLabel}
        </Button>
      </form>
    </Card>
  );
};

export default SubmissionForm;
