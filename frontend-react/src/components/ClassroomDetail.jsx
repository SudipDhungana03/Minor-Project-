// frontend-react/src/components/ClassroomDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import AssignmentForm from './AssignmentForm.jsx'; // Importing your form

const ClassroomDetail = () => {
    const { id } = useParams();
    const [classroom, setClassroom] = useState(null);
    const [assignments, setAssignments] = useState([]);

    const fetchDetails = async () => {
        try {
            // Fetch classroom details
            const classRes = await API.get(`/api/classroom/classrooms/${id}/`);
            setClassroom(classRes.data);
            
            // Fetch assignments
            const assignRes = await API.get(`/api/classroom/classrooms/${id}/assignments/`);
            setAssignments(assignRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    if (!classroom) return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">Loading...</div>;

    const isTeacher = localStorage.getItem('role') === 'teacher';

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm mb-8 text-center">
                <div className="flex flex-col gap-4 items-center justify-center text-center">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{classroom.name}</h1>
                        <p className="mt-3 text-sm uppercase tracking-[0.24em] text-slate-500">Subject: {classroom.subject}</p>
                    </div>
                    <div className="grid gap-3 justify-center">
                        <div className="mx-auto rounded-3xl bg-indigo-50 px-5 py-3 text-sm font-semibold text-indigo-700 shadow-inner">
                            Classroom ID: {classroom.id}
                        </div>
                        {isTeacher && (
                            <div className="mx-auto rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700 shadow-sm w-full max-w-md">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Invite Code</p>
                                <div className="mt-2 flex items-center justify-center gap-3">
                                    <span className="font-semibold text-slate-900">{classroom.invite_code}</span>
                                    <button
                                        type="button"
                                        onClick={() => navigator.clipboard.writeText(classroom.invite_code)}
                                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Share this code with students once. It is unique per classroom.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid gap-8">
                <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm text-center">
                    <div className="flex flex-col gap-3 items-center justify-center">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Assignments</h2>
                            <p className="mt-1 text-sm text-slate-500">Use the Assignments page in the sidebar to view all classroom tasks.</p>
                        </div>
                        <a
                            href="/assignments"
                            className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                            Open Assignments
                        </a>
                    </div>
                    <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                        {assignments.length > 0
                            ? `This classroom has ${assignments.length} assignment${assignments.length === 1 ? '' : 's'}.`
                            : 'No assignments yet. Use the form below to publish one.'}
                    </div>
                </div>

                <AssignmentForm classroomId={id} onAssignmentCreated={fetchDetails} />
            </section>
        </div>
    );
};

export default ClassroomDetail;