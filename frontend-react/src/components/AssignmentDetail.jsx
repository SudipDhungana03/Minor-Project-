import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import SubmissionForm from './SubmissionForm.jsx';
import SubmissionList from './SubmissionList.jsx';
import { Card, Badge, Skeleton } from './ui';

const getMediaUrl = (path) =>
  path?.startsWith('http') ? path : `${API.defaults.baseURL}${path}`;

const AssignmentDetail = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await API.get(`/api/classroom/assignments/${id}/`);
        setAssignment(res.data);
      } catch (err) {
        console.error('Error fetching assignment:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [id]);

  const role = localStorage.getItem('role');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {loading ? (
        <Card className="mb-6">
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-4 w-1/3 mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </Card>
      ) : !assignment ? (
        <Card>
          <p className="text-ink-soft">Assignment not found.</p>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="brand">{assignment.classroom_name}</Badge>
              {assignment.classroom_subject && (
                <Badge variant="neutral">{assignment.classroom_subject}</Badge>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-ink mb-4">
              {assignment.title}
            </h1>
            <p className="text-ink-soft leading-relaxed whitespace-pre-line">
              {assignment.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-5 text-sm">
              <span className="text-ink-soft">
                <span className="font-semibold text-ink-muted">Due:</span>{' '}
                {assignment.due_date
                  ? new Date(assignment.due_date).toLocaleString()
                  : 'Not set'}
              </span>
              {assignment.file && (
                <a
                  href={getMediaUrl(assignment.file)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Download attachment
                </a>
              )}
            </div>
          </Card>

          {role === 'student' && (
            <div className="mb-6">
              <SubmissionForm assignmentId={id} assignment={assignment} />
            </div>
          )}

          {role === 'teacher' && <SubmissionList assignmentId={id} />}
        </>
      )}
    </div>
  );
};

export default AssignmentDetail;
