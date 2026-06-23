import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import styles from '../styles/login-signup.module.css';

const VerifyCode = () => {
    const [code, setCode] = useState('');
    const location = useLocation();
    const email = location.state?.email; // Passed from Signup.jsx
    const navigate = useNavigate();

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            await API.post('/api/verify-code/', { email, code });
            alert('Verified! Redirecting to complete profile...');
            navigate('/complete-profile'); // Proceed to role/name/org
        } catch (err) {
            alert('Invalid code.');
        }
    };

    return (
        <form className={styles.authCard} onSubmit={handleVerify}>
            <h3>Enter Verification Code</h3>
            <p>We sent a code to {email}</p>
            <input className={styles.inputField} onChange={(e) => setCode(e.target.value)} placeholder="Enter 6-digit code" />
            <button className={styles.submitBtn}>Verify</button>
        </form>
    );
};