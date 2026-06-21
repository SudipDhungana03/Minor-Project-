import React, { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // Hook to redirect after login

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Updated to ensure it hits /api/login/ correctly
            const response = await API.post('/api/login/', formData);
            
            // Store tokens in browser storage
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            
            setMessage('Login successful! Redirecting...');
            
            // Optional: Redirect to home after 1 second
            setTimeout(() => {
                navigate('/'); 
            }, 1000);
            
        } catch (error) {
            console.error("Login Error:", error.response?.data);
            setMessage('Invalid username or password.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto' }}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="username" placeholder="Username" onChange={handleChange} required style={{ display: 'block', width: '100%', margin: '10px 0', padding: '8px' }} />
                <input type="password" name="password" placeholder="Password" onChange={handleChange} required style={{ display: 'block', width: '100%', margin: '10px 0', padding: '8px' }} />
                <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>Login</button>
            </form>
            {message && <p style={{ marginTop: '20px' }}>{message}</p>}
        </div>
    );
};

export default Login;