import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import AuthLayout from './AuthLayout';
import { Button, Input } from './ui';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const { data } = await API.post('/api/login/', formData);

            // Store tokens and role
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('role', data.role);

            // Notify the app that auth state changed so UI updates without refresh
            try {
                window.dispatchEvent(new Event('authChanged'));
            } catch (e) {
                // ignore in older browsers
            }
            setMessage('Login successful! Redirecting...');

            // Role-based redirection
            setTimeout(() => {
                if (data.role === 'student') {
                    navigate('/student-dashboard');
                } else if (data.role === 'teacher') {
                    navigate('/teacher-dashboard');
                } else {
                    navigate('/');
                }
            }, 1000);
        } catch (error) {
            console.error('Login error:', error);
            const serverMsg = error.response?.data?.detail || 'Invalid username or password.';
            setMessage(serverMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Welcome back" subtitle="Log in to continue to your dashboard.">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Username"
                    type="text"
                    name="username"
                    placeholder="Enter your username"
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    onChange={handleChange}
                    required
                />

                <Button type="submit" fullWidth size="lg" disabled={loading}>
                    {loading ? 'Signing in…' : 'Log in'}
                </Button>

                {message && (
                    <p className="text-center text-sm text-ink-muted">{message}</p>
                )}
            </form>

            <p className="mt-6 text-center text-sm text-ink-soft">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-brand-700 hover:text-brand-800">
                    Sign up
                </Link>
            </p>
        </AuthLayout>
    );
};

export default Login;
