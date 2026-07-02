import React, { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const CreateClassroom = () => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/classroom/classrooms/', { name, subject });
      alert("Classroom created!");
      navigate('/teacher-dashboard');
    } catch (err) {
      alert("Error creating classroom.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Classroom</h2>
        <p className="text-gray-500 mb-8">Set up your new learning environment.</p>

        <div className="mb-5">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Class Name</label>
          <input 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="e.g. Advanced Calculus"
            value={name} onChange={(e) => setName(e.target.value)} required 
          />
        </div>

        <div className="mb-8">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Subject</label>
          <input 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="e.g. Mathematics"
            value={subject} onChange={(e) => setSubject(e.target.value)} required 
          />
        </div>

        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200">
          Create Classroom
        </button>
      </form>
    </div>
  );
};

export default CreateClassroom;