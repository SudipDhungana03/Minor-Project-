import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, PageHeader, EmptyState, SkeletonCard } from '../components/ui';

const StudentDashboard = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchClassrooms = async () => {
        try {
            const res = await API.get('/api/classroom/classrooms/');
            setClassrooms(res.data);
        } catch (err) {
            console.error('Error loading dashboards:', err);
        }
    };

    useEffect(() => {
        const load = async () => {
            await fetchClassrooms();
            setLoading(false);
        };
        load();
    }, []);

    const handleJoin = async (e) => {
        e.preventDefault();
        setJoining(true);
        setFeedback(null);
        try {
            await API.post('/api/classroom/classrooms/join/', { invite_code: joinCode.trim() });
            setFeedback({ type: 'success', text: 'Join request submitted. Your teacher will approve it soon.' });
            setJoinCode('');
        } catch (err) {
            console.error('Error joining classroom:', err);
            const message = err.response?.data?.error || err.response?.data?.message || 'Invalid invite code or request failed.';
            setFeedback({ type: 'error', text: message });
        } finally {
            setJoining(false);
        }
    };

    const gradients = [
        'from-brand-500 to-brand-700',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-pink-500 to-rose-600',
        'from-sky-500 to-indigo-600',
    ];

    return (
        <div className="mx-auto max-w-6xl">
            <PageHeader
                title="My Classrooms"
                subtitle="Welcome back! Select a classroom to view assignments and submit your work."
            />

            {/* Join a classroom */}
            <Card className="mb-8">
                <h2 className="text-lg font-bold text-ink">Join a classroom</h2>
                <p className="mt-1 text-sm text-ink-soft">
                    Enter the invite code your teacher shared with you.
                </p>
                <form onSubmit={handleJoin} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <Input
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="Enter classroom code"
                            required
                        />
                    </div>
                    <Button type="submit" disabled={joining}>
                        {joining ? 'Sending…' : 'Request Join'}
                    </Button>
                </form>
                {feedback && (
                    <p className={`mt-3 text-sm ${feedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {feedback.text}
                    </p>
                )}
            </Card>

            {/* Classroom grid */}
            {loading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : classrooms.length === 0 ? (
                <EmptyState
                    icon="🎓"
                    title="No classrooms yet"
                    description="Once you join a classroom with an invite code, it will appear here."
                />
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {classrooms.map((c, i) => (
                        <Card key={c.id} hover padded={false} className="overflow-hidden">
                            <div className={`h-24 bg-linear-to-br ${gradients[i % gradients.length]}`} />
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-ink">{c.name}</h3>
                                <p className="mt-1 text-sm text-ink-soft">{c.subject}</p>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    className="mt-5"
                                    onClick={() => navigate('/assignments')}
                                >
                                    View Assignments →
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
