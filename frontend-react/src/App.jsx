import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import Home from './pages/Home.jsx';
import CompleteProfile from './components/CompleteProfile.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import Sidebar from './components/Sidebar.jsx';
import API from './services/api';
import Settings from './pages/Settings.jsx';

// Import all existing feature components
import ClassroomDetail from './components/ClassroomDetail.jsx';
import AssignmentDetail from './components/AssignmentDetail.jsx';
import SubmissionDetail from './components/SubmissionDetail.jsx';
import CreateClassroom from './pages/CreateClassroom.jsx';
import ManageClasses from './pages/ManageClasses.jsx';
import Assignments from './pages/Assignments.jsx';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [user, setUser] = useState(null);

  // Listen for auth changes so the UI updates without a full page refresh
  useEffect(() => {
    const handler = () => {
      setIsAuthenticated(!!localStorage.getItem('access_token'));
      setRole(localStorage.getItem('role'));
    };
    window.addEventListener('authChanged', handler);
    return () => window.removeEventListener('authChanged', handler);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) return setUser(null);
      try {
        const res = await API.get('/api/user/profile/');
        setUser(res.data);
        if (res.data.username) localStorage.setItem('username', res.data.username);
      } catch (e) {
        setUser(null);
      }
    };
    fetchProfile();
  }, [isAuthenticated]);
  
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    try { window.dispatchEvent(new Event('authChanged')); } catch(e) {}
    window.location.href = '/login';
  };

  return (
    <Router>
      {/* Container holding Sidebar and Content */}
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa', fontFamily: 'Arial, sans-serif' }}>
        
        {/* Render Sidebar ONLY if authenticated */}
        {isAuthenticated && <Sidebar role={role} />}

        {/* Main Content Area */}
        <div style={{ flex: 1, marginLeft: isAuthenticated ? '256px' : '0' }}>
          {/* Top header with profile */}
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px', borderBottom: '1px solid #eef2f7', background: '#fff' }}>
            <div />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right', marginRight: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{user.name || user.username || 'User'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{role || ''}</div>
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: 9999, background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {(user.name || user.username || 'U').slice(0,1).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          </header>
          {!isAuthenticated && (
            <nav style={{ padding: '15px 30px', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'flex-end', gap: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <Link to="/login" style={{ textDecoration: 'none', color: '#007acc', fontWeight: 'bold' }}>Login</Link>
              <Link to="/signup" style={{ textDecoration: 'none', color: '#007acc', fontWeight: 'bold' }}>Sign Up</Link>
            </nav>
          )}

          {/* Page Content */}
          <div style={{ padding: '40px 20px' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/settings" element={<Settings />} />
              
              {/* Dashboard Routes */}
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
              
              {/* Classroom & Assignment Routes */}
              <Route path="/create-classroom" element={<CreateClassroom />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/manage-classes" element={<ManageClasses />} />
              <Route path="/classroom/:id" element={<ClassroomDetail />} />
              <Route path="/assignment/:id" element={<AssignmentDetail />} />
              <Route path="/submission/:id" element={<SubmissionDetail />} />
              
              {/* Fallback */}
              <Route path="*" element={<div style={{ textAlign: 'center' }}><h3>Page not found.</h3></div>} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;