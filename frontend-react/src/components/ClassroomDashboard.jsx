import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Card, Input, Button } from './ui';

const ClassroomDashboard = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');
    const [joinCode, setJoinCode] = useState('');

    // Fetch classes on load
    const fetchClassrooms = async () => {
        try {
            const res = await API.get('/api/classroom/classrooms/');
            setClassrooms(res.data);
        } catch (err) {
            console.error("Error fetching:", err);
        }
    };

    useEffect(() => {
        fetchClassrooms();
    }, []);

    // Create a new class
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await API.post('/api/classroom/classrooms/', { name, subject });
            fetchClassrooms(); // Refresh list
            setName('');
            setSubject('');
        } catch (err) {
            console.error("Error creating:", err);
            alert('Failed to create classroom.');
        }
    };

    // Join an existing class
    const handleJoin = async (e) => {
        e.preventDefault();
        try {
            // Using the custom @action defined in your Django views.py
            await API.post('/api/classroom/classrooms/join/', { invite_code: joinCode });
            alert('Joined classroom successfully!');
            fetchClassrooms(); // Refresh list to show the new joined class
            setJoinCode('');
        } catch (err) {
            console.error("Error joining:", err);
            alert('Invalid invite code or already joined.');
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-8 p-6">
            <div>
                <h2 className="text-2xl font-extrabold text-ink">My Classrooms</h2>
                <p className="mt-1 text-ink-soft">Create a new class or join one with an invite code.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Create Form */}
                <Card padded={false} className="overflow-hidden">
                    <div
                        className="flex items-center gap-3 px-6 py-5 text-white"
                        style={{ background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)' }}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg">
                            ➕
                        </div>
                        <div>
                            <h3 className="text-lg font-bold leading-tight">Create a classroom</h3>
                            <p className="text-sm text-white/80">Set up a new class for your students</p>
                        </div>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-5 p-6">
                        <Input
                            label="Class name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Grade 10 English"
                            required
                        />
                        <Input
                            label="Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g. Literature"
                            required
                        />
                        <Button type="submit" fullWidth size="lg">
                            Create classroom
                        </Button>
                    </form>
                </Card>

                {/* Join Form */}
                <Card padded={false} className="overflow-hidden">
                    <div
                        className="flex items-center gap-3 px-6 py-5 text-white"
                        style={{ background: 'linear-gradient(90deg, #6366f1 0%, #7c3aed 100%)' }}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg">
                            🔑
                        </div>
                        <div>
                            <h3 className="text-lg font-bold leading-tight">Join a classroom</h3>
                            <p className="text-sm text-white/80">Enter the invite code from your teacher</p>
                        </div>
                    </div>
                    <form onSubmit={handleJoin} className="space-y-5 p-6">
                        <Input
                            label="Invite code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="Enter invite code"
                            required
                        />
                        <Button type="submit" variant="secondary" fullWidth size="lg">
                            Join class
                        </Button>
                    </form>
                </Card>
            </div>

            {/* Classroom list */}
            <Card>
                <h3 className="mb-4 text-lg font-bold text-ink">Your classes</h3>
                {classrooms.length === 0 ? (
                    <p className="text-ink-soft">You are not part of any classroom yet.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {classrooms.map((c) => (
                            <li key={c.id} className="flex items-center justify-between py-3">
                                <div>
                                    <div className="font-semibold text-ink">{c.name}</div>
                                    <div className="text-sm text-ink-soft">{c.subject}</div>
                                </div>
                                <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                                    Code: {c.invite_code}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
};

export default ClassroomDashboard;
