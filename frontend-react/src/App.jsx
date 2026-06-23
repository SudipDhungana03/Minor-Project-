import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import Home from './pages/Home.jsx';
import CompleteProfile from './components/CompleteProfile.jsx';
// Import your dashboard pages
import StudentDashboard from './pages/StudentDashboard.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role'); // Also clear the role
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <Router>
      <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#fafafa' }}>
        <nav style={{ padding: '15px 30px', backgroundColor: '#ffffff', display: 'flex', gap: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          {isAuthenticated ? (
            <>
              <Link to="/" style={{ textDecoration: 'none', color: '#007acc', fontWeight: 'bold' }}>Dashboard</Link>
              <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: '#d9534f', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: 'none', color: '#007acc', fontWeight: 'bold' }}>Login</Link>
              <Link to="/signup" style={{ textDecoration: 'none', color: '#007acc', fontWeight: 'bold' }}>Sign Up</Link>
            </>
          )}
        </nav>

        <div style={{ padding: '40px 20px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            
            {/* Registered Dashboard Routes */}
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
            
            {/* Fallback route */}
            <Route path="*" element={<div style={{ textAlign: 'center' }}><h3>Page not found.</h3></div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;