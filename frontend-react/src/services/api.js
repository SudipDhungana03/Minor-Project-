import axios from 'axios';

// Allow overriding the backend URL via Vite env var `VITE_API_URL`.
// Falls back to the localhost Django server used in development.
const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/',
    headers: {
        'Content-Type': 'application/json',
    },
});

// This interceptor automatically attaches the access token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default API;