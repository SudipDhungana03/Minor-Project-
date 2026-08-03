import React, { useState } from 'react';
import API from '../services/api';
import { Card, Input, Button } from './ui';

const AssignmentForm = ({ classroomId, onAssignmentCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const formData = new FormData();
    formData.append('classroom', classroomId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('due_date', dueDate);
    if (file) formData.append('file', file);

    try {
      await API.post('/api/classroom/assignments/', formData);
      setTitle('');
      setDescription('');
      setDueDate('');
      setFile(null);
      onAssignmentCreated?.();
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.due_date?.[0] ||
        err.response?.data?.file?.[0] ||
        err.response?.data?.title?.[0] ||
        'Failed to publish. Please check the form.';
      console.error('Assignment publish error', err.response || err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padded={false} className="overflow-hidden">
      <div
        className="flex items-center gap-3 px-6 py-5 text-white"
        style={{ background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)' }}
      >

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg">
          📝
        </div>
        <div>
          <h3 className="text-lg font-bold leading-tight">New assignment</h3>
          <p className="text-sm text-white/80">Publish a task for your students</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <Input
          label="Title"
          name="title"
          placeholder="e.g. Chapter 5 essay"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="w-full">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-ink-muted mb-1.5"
          >
            Description
          </label>
          <textarea
            id="description"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-ink placeholder:text-slate-400
              h-32 resize-y transition-all duration-200 outline-none focus:border-brand-500 focus:shadow-ring"
            placeholder="Describe what students need to do..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <Input
          label="Due date"
          name="due_date"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-ink-muted mb-1.5">
            Attachment
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-sm text-ink-soft file:mr-4 file:py-2 file:px-4 file:rounded-full
              file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold hover:file:bg-brand-100
              cursor-pointer"
          />
          {file && (
            <p className="mt-2 text-sm text-ink-soft">Selected file: {file.name}</p>
          )}
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button type="submit" fullWidth size="lg" disabled={loading}>
          {loading ? 'Publishing...' : 'Publish assignment'}
        </Button>
      </form>
    </Card>
  );
};

export default AssignmentForm;
