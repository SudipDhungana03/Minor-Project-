import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge, PageHeader, EmptyState, SkeletonCard } from '../components/ui';

const TeacherDashboard = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClassrooms = async () => {
            try {
                const res = await API.get('/api/classroom/classrooms/');
                setClassrooms(res.data);
            } catch (err) {
                console.error('Error loading classrooms:', err);
            }
        };

        const fetchAssignments = async () => {
            try {
                const res = await API.get('/api/classroom/assignments/');
                setAssignments(res.data);
            } catch (err) {
                console.error('Error loading assignments:', err);
            }
        };

        const fetchPending = async () => {
            try {
                const res = await API.get('/api/classroom/classrooms/pending_requests/');
                setPendingCount(res.data?.length || 0);
            } catch (err) {
                console.error('Error loading pending requests:', err);
            }
        };

        const load = async () => {
            await Promise.all([fetchClassrooms(), fetchAssignments(), fetchPending()]);
            setLoading(false);
        };
        load();
    }, []);

    // Inline gradients guarantee the colored header renders regardless of how
    // Tailwind resolves dynamic gradient utility classes.
    const gradients = [
        'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
        'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
        'linear-gradient(135deg, #ec4899 0%, #e11d48 100%)',
        'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)',
    ];


    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader
                title="Teacher Dashboard"
                subtitle="Manage your classrooms, publish assignments, and review student submissions."
                actions={
                    <>
                        <Button variant="warning" to="/manage-classes">
                            Manage Requests
                            {pendingCount > 0 && (
                                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-950/20 px-1.5 text-xs font-bold">
                                    {pendingCount}
                                </span>
                            )}
                        </Button>
                        <Button variant="success" to="/create-classroom">
                            + Create Classroom
                        </Button>
                    </>
                }
            />

            {pendingCount > 0 && (
                <div className="mb-8 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                    <span className="text-xl" aria-hidden>🔔</span>
                    <p className="text-sm text-amber-800">
                        You have <strong>{pendingCount}</strong> pending join request{pendingCount === 1 ? '' : 's'} waiting for review.
                    </p>
                </div>
            )}

            {/* Classrooms */}
            <h2 className="mb-4 text-lg font-bold text-ink">Your Classrooms</h2>
            {loading ? (
                <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : classrooms.length === 0 ? (
                <EmptyState
                    className="mb-10"
                    icon="🏫"
                    title="No classrooms yet"
                    description="Create your first classroom to start publishing assignments."
                    action={<Button to="/create-classroom">+ Create Classroom</Button>}
                />
            ) : (
                <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {classrooms.map((c, i) => (
                        <Card key={c.id} hover padded={false} className="overflow-hidden">
                            <div className="h-24" style={{ background: gradients[i % gradients.length] }} />

                            <div className="p-6">
                                <h3 className="text-lg font-bold text-ink">{c.name}</h3>
                                <p className="mt-1 text-sm text-ink-soft">{c.subject}</p>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    className="mt-5"
                                    onClick={() => navigate(`/classroom/${c.id}`)}
                                >
                                    Add Assignment
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Published Assignments */}
            <h2 className="mb-4 text-lg font-bold text-ink">Published Assignments</h2>
            {loading ? (
                <Card>
                    <div className="animate-pulse space-y-3">
                        <div className="h-5 w-1/3 rounded bg-slate-200/70" />
                        <div className="h-4 w-1/4 rounded bg-slate-200/70" />
                    </div>
                </Card>
            ) : assignments.length === 0 ? (
                <EmptyState
                    icon="📄"
                    title="No published assignments yet"
                    description="Publish assignments from your classrooms to see them here."
                />
            ) : (
                <div className="space-y-4">
                    {assignments.map((assignment) => (
                        <Card
                            key={assignment.id}
                            hover
                            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div>
                                <h3 className="text-base font-bold text-ink">{assignment.title}</h3>
                                <p className="mt-1 flex items-center gap-2 text-sm text-ink-soft">
                                    <Badge variant="brand">{assignment.classroom_name}</Badge>
                                    <span>{assignment.classroom_subject}</span>
                                </p>
                            </div>
                            <Button variant="primary" to={`/assignment/${assignment.id}`}>
                                View submissions →
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
