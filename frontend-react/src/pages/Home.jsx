import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // Ensure this path matches the URL registered in your Django app's urls.py
                const res = await API.get('/api/dashboard-data/'); 
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
                if (err.response?.status === 401) {
                    setError("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    setError("Could not load dashboard. Is the backend endpoint set up?");
                }
            }
        };
        fetchData();
    }, [navigate]);

    return (
        <div style={{ padding: '20px' }}>
            <h2>Dashboard</h2>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            {data ? (
                <pre>{JSON.stringify(data, null, 2)}</pre>
            ) : (
                !error && <p>Loading secure data...</p>
            )}
        </div>
    );
};

export default Home;