import React, { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout.jsx';
import { Input, Button } from './ui';
import { ORGANIZATIONS } from '../data/organizations';

const CompleteProfile = () => {
    const [profile, setProfile] = useState({ role: 'student', name: '' });
    const [selectedOrganization, setSelectedOrganization] = useState('');
    const [customOrganization, setCustomOrganization] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');

        if (!token) {
            setMessage('Please log in before completing your profile.');
            navigate('/login');
            return;
        }

        const organization = selectedOrganization === 'Other' ? customOrganization : selectedOrganization;

        setLoading(true);
        try {
            await API.patch('/api/user/profile/', { ...profile, organization }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            localStorage.setItem('role', profile.role);

            if (profile.role === 'teacher') {
                navigate('/teacher-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } catch (error) {
            const errData = error.response?.data;
            console.error('Profile update error:', errData);

            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('role');
                setMessage('Unauthorized or expired session. Please log in again.');
                navigate('/login');
                return;
            }

            setMessage(errData?.detail || errData?.error || 'Could not update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Complete your profile"
            subtitle="Tell us a little about you so we can tailor your workspace."
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="w-full">
                    <label
                        htmlFor="role"
                        className="block text-sm font-medium text-ink-muted mb-1.5"
                    >
                        I am a
                    </label>
                    <select
                        id="role"
                        value={profile.role}
                        onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-ink
                            transition-all duration-200 outline-none focus:border-brand-500 focus:shadow-ring"
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                </div>

                <Input
                    label="Full name"
                    name="name"
                    type="text"
                    placeholder="Jane Doe"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                />

                <div className="w-full">
                    <label htmlFor="organization" className="block text-sm font-medium text-ink-muted mb-1.5">
                        University / School / College
                    </label>
                    <select
                        id="organization"
                        value={selectedOrganization}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSelectedOrganization(value);
                            if (value !== 'Other') {
                                setCustomOrganization('');
                            }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-ink transition-all duration-200 outline-none focus:border-brand-500 focus:shadow-ring"
                        required
                    >
                        {ORGANIZATIONS.map((org) => (
                            <option key={org.value} value={org.value}>
                                {org.label}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedOrganization === 'Other' && (
                    <Input
                        label="Enter your institution"
                        name="customOrganization"
                        type="text"
                        placeholder="Type your university, school, or college"
                        value={customOrganization}
                        onChange={(e) => setCustomOrganization(e.target.value)}
                        required
                    />
                )}

                <Button type="submit" fullWidth size="lg" disabled={loading}>
                    {loading ? 'Saving...' : 'Complete profile'}
                </Button>

                {message && (
                    <p className="text-sm text-rose-600 text-center">{message}</p>
                )}
            </form>
        </AuthLayout>
    );
};

export default CompleteProfile;
