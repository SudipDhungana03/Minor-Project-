import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Card, PageHeader, Skeleton } from '../components/ui';

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
                const res = await API.get('/api/dashboard-data/');
                setData(res.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
                if (err.response?.status === 401) {
                    setError('Session expired. Please login again.');
                    navigate('/login');
                } else {
                    setError('Could not load dashboard. Is the backend endpoint set up?');
                }
            }
        };
        fetchData();
    }, [navigate]);

    return (
        <div className="mx-auto max-w-4xl">
            <PageHeader
                title="Dashboard"
                subtitle="A quick overview of your account and activity."
            />

            {error && (
                <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                    {error}
                </div>
            )}

            {data ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Object.entries(data).map(([key, value]) => (
                        <Card key={key}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                                {key.replace(/_/g, ' ')}
                            </p>
                            <p className="mt-2 break-words text-lg font-bold text-ink">
                                {typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)}
                            </p>
                        </Card>
                    ))}
                </div>
            ) : (
                !error && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Card>
                            <Skeleton className="h-4 w-1/3 mb-3" />
                            <Skeleton className="h-6 w-2/3" />
                        </Card>
                        <Card>
                            <Skeleton className="h-4 w-1/3 mb-3" />
                            <Skeleton className="h-6 w-2/3" />
                        </Card>
                    </div>
                )
            )}
        </div>
    );
};

export default Home;
