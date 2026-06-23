import React, { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/login-signup.module.css';

const CompleteProfile = () => {
    const [profile, setProfile] = useState({ role: 'student', name: '', organization: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access_token');

        if (!token) {
            setMessage('Please log in before completing your profile.');
            navigate('/login');
            return;
        }

        try {
            await API.patch('/api/user/profile/', profile, {
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
        }
    };

    return (
        <div className={styles.authContainer}>
            <form className={styles.authCard} onSubmit={handleSubmit}>
                <h2>Complete Profile</h2>
                
                {/* Role selection */}
                <select
                    className={styles.inputField}
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                </select>

                {/* Name Input */}
                <input
                    className={styles.inputField}
                    type="text"
                    placeholder="Full Name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                />

                {/* Organization Input */}
                <input
                    className={styles.inputField}
                    type="text"
                    placeholder="University/Organization"
                    value={profile.organization}
                    onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                    required
                />

                <button className={styles.submitBtn} type="submit">Complete</button>
                {message && <p className={styles.message}>{message}</p>}
            </form>
        </div>
    );
};

export default CompleteProfile;