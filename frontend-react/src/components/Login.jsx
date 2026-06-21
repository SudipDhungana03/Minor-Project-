import React, { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/login-signup.module.css'; // Import the shared styles

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
            const response = await API.post('/api/login/', formData);
            
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            
            setMessage('Login successful! Redirecting...');
            
            setTimeout(() => {
                navigate('/'); 
            }, 1000);
            
        } catch (error) {
            console.error("Login Error:", error.response?.data);
            setMessage('Invalid username or password.');
        }
    };

    return (
        <div className={styles.authContainer}>
            <form className={styles.authCard} onSubmit={handleSubmit}>
                <h2>Login</h2>
                <input 
                    className={styles.inputField} 
                    type="text" 
                    name="username" 
                    placeholder="Username" 
                    onChange={handleChange} 
                    required 
                />
                <input 
                    className={styles.inputField} 
                    type="password" 
                    name="password" 
                    placeholder="Password" 
                    onChange={handleChange} 
                    required 
                />
                <button className={styles.submitBtn} type="submit">Login</button>
                {message && <p>{message}</p>}
            </form>
        </div>
    );
};

export default Login;