import React from 'react';

const AuthHeader = ({ title }) => (
    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛡️</div>
        <h1 style={{ margin: 0, color: '#333' }}>OriginalityGuard</h1>
        <p style={{ color: '#666' }}>{title}</p>
    </div>
);

export default AuthHeader;