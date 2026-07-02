import React, { useState } from 'react';
import API from '../services/api';

const AssignmentForm = ({ classroomId, onAssignmentCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('classroom', classroomId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('due_date', dueDate);
    if (file) formData.append('file', file);

    try {
      await API.post('/api/classroom/assignments/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setFile(null);
      alert('Assignment published!');
      onAssignmentCreated?.();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.response?.data?.due_date?.[0] || err.response?.data?.file?.[0] || err.response?.data?.title?.[0] || 'Failed to publish. Please check the form.';
      console.error('Assignment publish error', err.response || err);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-6">New Assignment</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Title</label>
          <input 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            value={title} onChange={(e) => setTitle(e.target.value)} required 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
          <textarea
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-32"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Due Date</label>
          <input
            type="datetime-local"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Attachment</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer" />
          {file && <p className="mt-2 text-sm text-gray-500">Selected file: {file.name}</p>}
        </div>

        <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200">
          {loading ? 'Publishing...' : 'Publish Assignment'}
        </button>
      </form>
    </div>
  );
};

export default AssignmentForm;