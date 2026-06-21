import React, { useState } from 'react';
import API from '../services/api';

const Signup = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Adding a log to confirm the button click is working
        console.log("Submitting to /register/ with data:", formData); 
        
        try {
            // Ensure this matches the path in your Django urls.py
            const response = await API.post('/api/register/', formData);
            setMessage("Registration successful! You can now login.");
        } catch (error) {
            console.error("Error response:", error.response?.data);
            setMessage(error.response?.data?.message || 'Registration failed. Check console.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto' }}>
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="username" placeholder="Username" onChange={handleChange} required style={{ display: 'block', width: '100%', margin: '10px 0', padding: '8px' }} />
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required style={{ display: 'block', width: '100%', margin: '10px 0', padding: '8px' }} />
                <input type="password" name="password" placeholder="Password" onChange={handleChange} required style={{ display: 'block', width: '100%', margin: '10px 0', padding: '8px' }} />
                <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>Register</button>
            </form>
            {message && <p style={{ marginTop: '20px', color: 'blue' }}>{message}</p>}
        </div>
    );
};

export default Signup;