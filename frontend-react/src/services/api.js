import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
    headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor: Attach token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Response Interceptor: Handle expired tokens
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refresh = localStorage.getItem('refresh_token');
                const response = await axios.post(`${API.defaults.baseURL}/api/token/refresh/`, { refresh });
                localStorage.setItem('access_token', response.data.access);
                API.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
                return API(originalRequest);
            } catch (refreshError) {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default API;