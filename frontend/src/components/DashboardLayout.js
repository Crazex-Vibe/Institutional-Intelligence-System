import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';

const NAV_ITEMS = {
  student: [
    { path: '/student/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/student/profile', icon: '👤', label: 'My Profile' },
    { path: '/student/attendance', icon: '📅', label: 'Attendance' },
    { path: '/student/marks', icon: '📝', label: 'Internal Marks' },
    { path: '/student/results', icon: '📊', label: 'Results & GPA' },
    { path: '/student/timetable', icon: '🕐', label: 'Timetable' },
    { path: '/student/fees', icon: '💳', label: 'Fee Status' },
  ],
  staff: [
    { path: '/staff/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/staff/attendance', icon: '✅', label: 'Mark Attendance' },
    { path: '/staff/students', icon: '👥', label: 'My Students' },
    { path: '/staff/marks', icon: '📝', label: 'Enter Marks' },
    { path: '/staff/timetable', icon: '🕐', label: 'My Timetable' },
    { path: '/staff/reports', icon: '📊', label: 'Reports' },
  ],
  management: [
    { path: '/management/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/management/students', icon: '🎓', label: 'Students' },
    { path: '/management/staff', icon: '👩‍🏫', label: 'Staff' },
    { path: '/management/attendance', icon: '📅', label: 'Attendance Overview' },
    { path: '/management/classes', icon: '🏫', label: 'Class Tracking' },
    { path: '/management/reports', icon: '📊', label: 'Reports' },
    { path: '/management/users', icon: '⚙️', label: 'Manage Users' },
  ],
};

const ROLE_COLORS = {
  student: { bg: '#eff6ff', accent: '#2563eb', light: '#dbeafe' },
  staff: { bg: '#f0fdf4', accent: '#16a34a', light: '#dcfce7' },
  management: { bg: '#fdf4ff', accent: '#7c3aed', light: '#f3e8ff' },
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = NAV_ITEMS[user?.role] || [];
  const colors = ROLE_COLORS[user?.role] || ROLE_COLORS.student;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = {
    student: 'Student Portal',
    staff: 'Staff Portal',
    management: 'Management Portal',
  }[user?.role];

  return (
    <div className="layout-root" style={{ '--accent': colors.accent, '--accent-light': colors.light, '--accent-bg': colors.bg }}>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-logo">🏛️</span>
            {sidebarOpen && (
              <div>
                <div className="brand-name">EduManage</div>
                <div className="brand-role">{roleLabel}</div>
              </div>
            )}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className={`user-info ${!sidebarOpen ? 'compact' : ''}`}>
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <h2 className="page-title">Welcome, {user?.name?.split(' ')[0]}!</h2>
          </div>
          <div className="topbar-right">
            <div className="role-badge" style={{ background: colors.light, color: colors.accent }}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </div>
            <div className="topbar-date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
