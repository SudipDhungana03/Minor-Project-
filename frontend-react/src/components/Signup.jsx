import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import AuthLayout from './AuthLayout';
import { Button, Input } from './ui';

const Signup = () => {
    // step 1: Registration Form, step 2: Verification Code Input
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', confirmPassword: ''
    });
    const [verificationCode, setVerificationCode] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- Step 1: Handle User Registration ---
    const handleSignup = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return setMessage("Passwords do not match!");
        }

        setLoading(true);
        setMessage('');
        try {
            // Register the user
            await API.post('/api/register/', {
                username: formData.username,
                email: formData.email,
                password: formData.password
            });

            // Trigger the email verification code
            await API.post('/api/send-code/', { email: formData.email });

            // Move to verification step
            setStep(2);
            setMessage("Registration successful! A 6-digit code has been sent to your email.");
        } catch (error) {
            const errorData = error.response?.data;
            if (errorData) {
                const firstKey = Object.keys(errorData)[0];
                const errorMessage = Array.isArray(errorData[firstKey])
                    ? errorData[firstKey][0]
                    : errorData[firstKey];
                setMessage(errorMessage);
            } else {
                setMessage('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Step 2: Handle Email Verification ---
    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            // Verify the code and expect the access token in response
            const response = await API.post('/api/verify-code/', {
                email: formData.email,
                code: verificationCode
            });

            // Store tokens returned by the backend so CompleteProfile is authorized
            if (response.data.access) {
                localStorage.setItem('access_token', response.data.access);
            }
            if (response.data.refresh) {
                localStorage.setItem('refresh_token', response.data.refresh);
            }

            setMessage(response.data.message || "Success! Redirecting to complete your profile...");
            setTimeout(() => navigate('/complete-profile'), 1500);
        } catch (error) {
            const errData = error.response?.data;
            if (errData) {
                const firstKey = Object.keys(errData)[0];
                const errMsg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey];
                setMessage(errMsg);
            } else {
                setMessage("Invalid verification code. Please check your email and try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={step === 1 ? 'Create your account' : 'Confirm your email'}
            subtitle={
                step === 1
                    ? 'Join educators keeping learning honest.'
                    : 'Enter the code we just sent you.'
            }
        >
            {step === 1 ? (
                <form onSubmit={handleSignup} className="space-y-4">
                    <Input
                        label="Username"
                        type="text"
                        name="username"
                        placeholder="Choose a username"
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        placeholder="Create a password"
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Confirm password"
                        type="password"
                        name="confirmPassword"
                        placeholder="Re-enter your password"
                        onChange={handleChange}
                        required
                    />
                    <Button type="submit" fullWidth size="lg" disabled={loading}>
                        {loading ? 'Creating account…' : 'Create account'}
                    </Button>

                    {message && (
                        <p className="text-center text-sm text-ink-muted">{message}</p>
                    )}
                </form>
            ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                    <p className="text-sm text-ink-soft">
                        {formData.email ? (
                            <>We've sent a verification code to <b className="text-ink">{formData.email}</b>.</>
                        ) : (
                            'Enter the 6-digit code sent to your email.'
                        )}
                    </p>
                    <Input
                        label="Verification code"
                        type="text"
                        placeholder="Enter 6-digit code"
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                    />
                    <Button type="submit" fullWidth size="lg" disabled={loading}>
                        {loading ? 'Verifying…' : 'Verify & continue'}
                    </Button>

                    {message && (
                        <p className="text-center text-sm text-ink-muted">{message}</p>
                    )}
                </form>
            )}

            {step === 1 && (
                <p className="mt-6 text-center text-sm text-ink-soft">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
                        Log in
                    </Link>
                </p>
            )}
        </AuthLayout>
    );
};

export default Signup;
