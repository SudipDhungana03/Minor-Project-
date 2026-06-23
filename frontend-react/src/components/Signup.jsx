import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import styles from '../styles/login-signup.module.css';
import AuthHeader from './AuthHeader';

const Signup = () => {
    // step 1: Registration Form, step 2: Verification Code Input
    const [step, setStep] = useState(1); 
    const [formData, setFormData] = useState({ 
        username: '', email: '', password: '', confirmPassword: '' 
    });
    const [verificationCode, setVerificationCode] = useState('');
    const [message, setMessage] = useState('');
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
        }
    };

    // --- Step 2: Handle Email Verification ---
    const handleVerify = async (e) => {
        e.preventDefault();
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
        }
    };

    return (
        <div className={styles.authContainer}>
            <form className={styles.authCard} onSubmit={step === 1 ? handleSignup : handleVerify}>
                <AuthHeader />
                
                <h3 style={{ textAlign: 'center', color: '#444', marginBottom: '20px' }}>
                    {step === 1 ? "Join our community" : "Confirm your email"}
                </h3>
                
                {step === 1 ? (
                    <>
                        <input className={styles.inputField} type="text" name="username" placeholder="Username" onChange={handleChange} required />
                        <input className={styles.inputField} type="email" name="email" placeholder="Email" onChange={handleChange} required />
                        <input className={styles.inputField} type="password" name="password" placeholder="Password" onChange={handleChange} required />
                        <input className={styles.inputField} type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required />
                        <button className={styles.submitBtn} type="submit">Create Account</button>
                    </>
                ) : (
                    <>
                        <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#666' }}>
                            We've sent a verification code to <b>{formData.email}</b>.
                        </p>
                        <input 
                            className={styles.inputField} 
                            type="text" 
                            placeholder="Enter 6-digit code" 
                            onChange={(e) => setVerificationCode(e.target.value)} 
                            required 
                        />
                        <button className={styles.submitBtn} type="submit">Verify & Continue</button>
                    </>
                )}
                {message && <p className={styles.message}>{message}</p>}
            </form>
        </div>
    );
};

export default Signup;