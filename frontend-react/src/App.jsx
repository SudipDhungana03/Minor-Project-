import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import Home from './pages/Home.jsx';
import CompleteProfile from './components/CompleteProfile.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import Sidebar from './components/Sidebar.jsx';

// Import all existing feature components
import ClassroomDetail from './components/ClassroomDetail.jsx';
import AssignmentDetail from './components/AssignmentDetail.jsx';
import CreateClassroom from './pages/CreateClassroom.jsx';
import ManageClasses from './pages/ManageClasses.jsx';
import Assignments from './pages/Assignments.jsx';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
  
  // Helper to determine role and path
  const role = localStorage.getItem('role');
  
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
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
              
              {/* Dashboard Routes */}
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
              
              {/* Classroom & Assignment Routes */}
              <Route path="/create-classroom" element={<CreateClassroom />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/manage-classes" element={<ManageClasses />} />
              <Route path="/classroom/:id" element={<ClassroomDetail />} />
              <Route path="/assignment/:id" element={<AssignmentDetail />} />
              
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