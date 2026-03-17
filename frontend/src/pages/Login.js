import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const ROLE_ICONS = {
  student: '🎓',
  staff: '👩‍🏫',
  management: '🏛️',
};

const DEMO_CREDS = {
  student: { email: 'student@college.edu', password: 'student123' },
  staff: { email: 'staff@college.edu', password: 'staff123' },
  management: { email: 'management@college.edu', password: 'admin123' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname;

  // Only fills demo credentials — does NOT block new users from typing their own
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setFormData(DEMO_CREDS[role]);
    setError('');
  };

  const handleChange = (e) => {
    // When user types manually, deselect the role highlight
    setSelectedRole(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await login(formData.email.trim().toLowerCase(), formData.password);
      const dashboardMap = {
        student: '/student/dashboard',
        staff: '/staff/dashboard',
        management: '/management/dashboard',
      };
      navigate(from || dashboardMap[user.role], { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Background decoration */}
      <div className="login-bg">
        <div className="bg-circle bg-circle-1" />
        <div className="bg-circle bg-circle-2" />
        <div className="bg-grid" />
      </div>

      <div className="login-container">
        {/* Left Panel */}
        <div className="login-left">
          <div className="college-brand">
            <div className="brand-icon">🏛️</div>
            <h1>Campusflow</h1>
            <p className="brand-tagline">Institutional Intelligence System</p>
          </div>

          <div className="features-list">
            {[
              { icon: '📊', text: '360° Student Academic Profile' },
              { icon: '✅', text: 'Hour-wise Attendance Automation' },
              { icon: '📝', text: 'Internal Assessment Records' },
              { icon: '📧', text: 'Automated Parent Communication' },
              { icon: '📈', text: 'Academic Analytics Dashboard' },
            ].map((f, i) => (
              <div className="feature-item" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="feature-icon">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          <div className="left-footer">
            <span>Secure • Private • Transparent</span>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account to continue</p>
            </div>

            {/* Quick role selector — only for demo accounts */}
            <div className="role-selector">
              <p className="role-label">Demo Quick Login:</p>
              <div className="role-buttons">
                {['student', 'staff', 'management'].map((role) => (
                  <button
                    key={role}
                    className={`role-btn ${selectedRole === role ? 'active' : ''}`}
                    onClick={() => handleRoleSelect(role)}
                    type="button"
                  >
                    <span className="role-icon-sm">{ROLE_ICONS[role]}</span>
                    <span className="role-name">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@college.edu"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password
                  <span className="password-hint">
                    (New users: password = roll number / employee ID)
                  </span>
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-banner">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <span className="btn-loading">
                    <span className="btn-spinner" /> Signing in...
                  </span>
                ) : (
                  'Sign In →'
                )}
              </button>
            </form>

            <div className="demo-hint">
              <span>💡</span> New users: use your college email and roll number as password
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
