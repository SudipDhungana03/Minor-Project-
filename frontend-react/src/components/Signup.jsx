import React, { useState } from 'react';
import API from '../services/api';
import styles from '../styles/login-signup.module.css';

const Signup = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/register/', formData);
            setMessage("Registration successful! You can now login.");
        } catch (error) {
            setMessage(error.response?.data?.message || 'Registration failed.');
        }
    };

    return (
        <div className={styles.authContainer}>
            <form className={styles.authCard} onSubmit={handleSubmit}>
                <h2>Sign Up</h2>
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
                    type="email" 
                    name="email" 
                    placeholder="Email" 
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
                <button className={styles.submitBtn} type="submit">Register</button>
                {message && <p className={styles.message}>{message}</p>}
            </form>
        </div>
    );
};

export default Signup;