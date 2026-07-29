import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';

// Lightweight inline SVG icons (no extra dependency)
const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {path}
  </svg>
);

const icons = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  assignments: (
    <>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </>
  ),
  manage: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
};

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
    {
      label: 'Dashboard',
      path: role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard',
      icon: icons.dashboard,
    },
    { label: 'Assignments', path: '/assignments', icon: icons.assignments },
    ...(role === 'teacher'
      ? [
          {
            label: 'Manage Classes',
            path: '/manage-classes',
            icon: icons.manage,
            badge: pendingCount,
          },
        ]
      : []),
    { label: 'Settings', path: '/settings', icon: icons.settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div
      className="w-64 h-screen fixed left-0 top-0 z-50 flex flex-col text-white shadow-2xl"
      style={{ background: 'linear-gradient(to bottom, #312e81, #3730a3)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 py-6 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg">
          🛡️
        </div>
        <span className="text-lg font-extrabold tracking-tight text-white">
          OriginalityGuard
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-white text-brand-800 shadow-lg'
                  : 'text-brand-100/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span
                className={`transition-colors ${
                  active ? 'text-brand-700' : 'text-brand-200 group-hover:text-white'
                }`}
              >
                <Icon path={item.icon} />
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge > 0 && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-brand-100/80 hover:bg-rose-500/20 hover:text-white transition-all duration-200"
        >
          <Icon path={icons.logout} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
