import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';

const Sidebar = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (role === 'teacher') {
      const fetchPending = async () => {
        try {
          const res = await API.get('/api/classroom/classrooms/pending_requests/');
          setPendingCount(res.data?.length || 0);
        } catch (err) {
          console.error('Error loading pending join requests:', err);
        }
      };
      fetchPending();
    }
  }, [role]);

  const menuItems = [
    { label: 'Dashboard', path: role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard' },
    { label: 'Assignments', path: '/assignments' },
    { label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="w-64 h-screen bg-indigo-900 text-white fixed left-0 top-0 shadow-2xl flex flex-col z-50">
      <div className="pl-8 pr-6 py-6 text-2xl font-black tracking-tight text-indigo-100 border-b border-indigo-800 overflow-hidden whitespace-nowrap">
        OriginalityGuard
      </div>
      
      <nav className="flex-1 mt-8 px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-200 font-medium ${
              location.pathname === item.path 
                ? 'bg-indigo-800 text-white shadow-lg' 
                : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
        
        {role === 'teacher' && (
          <button
            onClick={() => navigate('/manage-classes')}
            className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-200 font-medium ${
              location.pathname === '/manage-classes' 
                ? 'bg-indigo-800 text-white' 
                : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span>Manage Classes</span>
              {pendingCount > 0 && (
                <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-indigo-900">
                  {pendingCount}
                </span>
              )}
            </span>
          </button>
        )}
      </nav>

      <div className="p-6 border-t border-indigo-800">
        <button 
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="w-full text-red-300 hover:text-red-100 font-semibold text-left"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;