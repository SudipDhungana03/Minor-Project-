import React, { useState, useEffect } from 'react';
import API from '../services/api';

const ManageClasses = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await API.get('/api/classroom/classrooms/pending_requests/');
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching join requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (classroomId, studentId, action) => {
    try {
      await API.post(`/api/classroom/classrooms/${classroomId}/process_join_request/`, {
        student_id: studentId,
        action,
      });
      fetchRequests();
      alert(`Request ${action}ed successfully.`);
    } catch (err) {
      console.error('Error processing request:', err);
      alert(err.response?.data?.error || 'Failed to process request.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900 mb-4">Manage Join Requests</h1>
        <p className="text-slate-500 mb-8">Approve or reject pending classroom join requests from students.</p>

        {loading ? (
          <div className="text-slate-500">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-slate-500">
            No pending join requests at the moment.
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((request) => (
              <div key={request.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{request.student_username}</h2>
                    <p className="text-slate-500">wants to join <strong>{request.classroom_name}</strong> ({request.classroom_subject})</p>
                    <p className="text-sm text-slate-400">Requested on {new Date(request.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleAction(request.classroom, request.student, 'accept')}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(request.classroom, request.student, 'reject')}
                      className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageClasses;
