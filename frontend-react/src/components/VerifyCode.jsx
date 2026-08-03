import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import AuthLayout from './AuthLayout.jsx';
import { Input, Button } from './ui';

const VerifyCode = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const email = location.state?.email; // Passed from Signup.jsx
    const navigate = useNavigate();

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await API.post('/api/verify-code/', { email, code });
            navigate('/complete-profile'); // Proceed to role/name/org
        } catch (err) {
            setError('That code is invalid or expired. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Verify your email"
            subtitle={
                email
                    ? `We sent a 6-digit code to ${email}. Enter it below to continue.`
                    : 'Enter the 6-digit code we emailed you to continue.'
            }
        >
            <form onSubmit={handleVerify} className="space-y-5">
                <Input
                    label="Verification code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    error={error}
                    required
                />

                <Button type="submit" fullWidth size="lg" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify'}
                </Button>
            </form>
        </AuthLayout>
    );
};

export default VerifyCode;
