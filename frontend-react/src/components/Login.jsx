import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import styles from '../styles/login-signup.module.css';
import AuthHeader from './AuthHeader';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post('/api/login/', formData);
            
            // Store tokens and role
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('role', data.role);
            
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
        }
    };

    return (
        <div className={styles.authContainer}>
            <form className={styles.authCard} onSubmit={handleSubmit}>
                <AuthHeader />
                <h3 style={{ textAlign: 'center', color: '#444', marginBottom: '20px' }}>
                    Welcome back
                </h3>
                
                <input 
                    className={styles.inputField} 
                    type="text" name="username" placeholder="Username" 
                    onChange={handleChange} required 
                />
                <input 
                    className={styles.inputField} 
                    type="password" name="password" placeholder="Password" 
                    onChange={handleChange} required 
                />
                
                <button className={styles.submitBtn} type="submit">Login</button>
                {message && <p className={styles.message}>{message}</p>}
            </form>
        </div>
    );
};

export default Login;