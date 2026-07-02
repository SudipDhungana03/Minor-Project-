import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await API.get('/api/classroom/assignments/');
        setAssignments(res.data);
      } catch (err) {
        console.error('Error loading assignments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  const role = localStorage.getItem('role');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Assignments</h1>
        <p className="mt-3 text-sm text-slate-500">Browse assignments for your classrooms in one place.</p>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm text-center text-slate-500">Loading assignments...</div>
      ) : (
        <div className="grid gap-6">
          {assignments.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No assignments found yet. Create or join a classroom to publish assignments.
            </div>
          ) : (
            assignments.map((assignment) => (
              <section key={assignment.id} className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{assignment.title}</h2>
                    <p className="text-sm text-slate-500">{assignment.classroom_name} · {assignment.classroom_subject}</p>
                  </div>
                  <Link
                    to={`/assignment/${assignment.id}`}
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    {role === 'teacher' ? 'View Assignment and Submissions' : 'View Assignment'}
                  </Link>
                </div>

                <p className="text-slate-600 whitespace-pre-line" style={{ textAlign: 'left' }}>
                  {assignment.description}
                </p>
                <div className="mt-4 grid gap-2 text-sm text-slate-500">
                  <div>Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'Not set'}</div>
                  {assignment.file && (
                    <a href={`${API.defaults.baseURL}${assignment.file}`} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 hover:text-indigo-900">
                      Download assignment attachment
                    </a>
                  )}
                </div>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Assignments;
