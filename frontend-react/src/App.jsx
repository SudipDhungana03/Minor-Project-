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
    const handler = async () => {
      const auth = !!localStorage.getItem('access_token');
      setIsAuthenticated(auth);
      setRole(localStorage.getItem('role'));
      if (!auth) {
        setUser(null);
        return;
      }
      try {
        const res = await API.get('/api/user/profile/');
        setUser(res.data);
        if (res.data.username) localStorage.setItem('username', res.data.username);
      } catch (e) {
        setUser(null);
      }
    };

    const profileUpdatedHandler = (ev) => {
      // When Settings emits a profileUpdated event include the new data immediately
      if (ev?.detail) {
        setUser(ev.detail);
        if (ev.detail.username) localStorage.setItem('username', ev.detail.username);
      } else {
        // fallback: run the normal authChanged flow
        handler();
      }
    };

    window.addEventListener('authChanged', handler);
    window.addEventListener('profileUpdated', profileUpdatedHandler);
    return () => {
      window.removeEventListener('authChanged', handler);
      window.removeEventListener('profileUpdated', profileUpdatedHandler);
    };
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
      <div className="flex min-h-screen bg-[#f6f7fb] font-sans text-ink">
        {/* Render Sidebar ONLY if authenticated */}
        {isAuthenticated && <Sidebar role={role} />}

        {/* Main Content Area */}
        <div className="flex-1" style={{ marginLeft: isAuthenticated ? '256px' : '0' }}>
          {/* Top header with profile (only when authenticated) */}
          {isAuthenticated && (
            <header className="sticky top-0 z-40 flex items-center justify-end gap-3 border-b border-slate-200/80 bg-white/80 px-7 py-3.5 backdrop-blur">
              {user && (
                <div className="flex items-center gap-3">
                  <div className="text-right leading-tight">
                    <div className="text-sm font-semibold text-ink">
                      {user.name || user.username || 'User'}
                    </div>
                    <div className="text-xs capitalize text-ink-soft">{role || ''}</div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-brand-500 to-brand-700 bg-brand-600 font-bold text-white shadow-soft">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (user.name || user.username || 'U').slice(0, 1).toUpperCase()
                    )}
                  </div>
                </div>
              )}
            </header>
          )}

          {!isAuthenticated && (
            <nav className="flex items-center justify-between border-b border-slate-200/80 bg-white px-8 py-4">
              <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-ink">
                <span>🛡️</span> OriginalityGuard
              </Link>
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-all hover:bg-brand-700"
                >
                  Sign Up
                </Link>
              </div>
            </nav>
          )}

          {/* Page Content */}
          <div className={isAuthenticated ? 'px-6 py-8 md:px-10' : 'px-4 py-8'}>
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