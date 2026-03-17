import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function ManagementDashboard() {
  const { user } = useAuth();
  const p = user?.managementProfile;

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalStaff: 0,
    lowAttendance: 0,
    activeStudents: 0,
    activeStaff: 0,
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [studentsRes, staffRes] = await Promise.all([
        API.get('/users', { params: { role: 'student' } }),
        API.get('/users', { params: { role: 'staff' } }),
      ]);

      const students = studentsRes.data.users || [];
      const staff = staffRes.data.users || [];

      setStats({
        totalStudents: students.length,
        totalStaff: staff.length,
        activeStudents: students.filter(s => s.isActive).length,
        activeStaff: staff.filter(s => s.isActive).length,
        lowAttendance: 0, // populated from analytics if needed
      });

      // Show 5 most recently added students
      setRecentStudents(students.slice(0, 5));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: '🎓', label: 'Total Students', value: loading ? '...' : stats.totalStudents, color: '#2563eb', bg: '#eff6ff' },
    { icon: '👩‍🏫', label: 'Teaching Staff', value: loading ? '...' : stats.totalStaff, color: '#7c3aed', bg: '#f5f3ff' },
    { icon: '✅', label: 'Active Students', value: loading ? '...' : stats.activeStudents, color: '#15803d', bg: '#dcfce7' },
    { icon: '✅', label: 'Active Staff', value: loading ? '...' : stats.activeStaff, color: '#15803d', bg: '#dcfce7' },
  ];

  return (
    <DashboardLayout>
      {/* Profile card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--accent)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700,
          }}>
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontFamily: 'Sora', color: 'var(--gray-800)', marginBottom: 4 }}>
              {user?.name}
            </h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                ['Role', 'Management'],
                ['Email', user?.email],
              ].map(([k, v]) => v && (
                <span key={k} style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                  <strong>{k}:</strong> {v}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={fetchDashboardData}
              style={{
                padding: '8px 16px', background: '#f1f5f9', border: 'none',
                borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', color: '#475569',
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="dash-grid" style={{ marginBottom: 24 }}>
        {statCards.map(s => (
          <div className="stat-card" key={s.label} style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="stat-card-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recently added students */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>
          🎓 Recently Added Students
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>⏳ Loading...</div>
        ) : recentStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
            No students added yet. Go to <strong>Manage Users</strong> to add students.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['Name', 'Email', 'Department', 'Sem', 'Section', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentStudents.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '11px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {s.name?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 12px', color: '#64748b', fontSize: 12 }}>{s.email}</td>
                  <td style={{ padding: '11px 12px', color: '#64748b' }}>{s.studentProfile?.department || '—'}</td>
                  <td style={{ padding: '11px 12px', color: '#64748b', textAlign: 'center' }}>{s.studentProfile?.semester || '—'}</td>
                  <td style={{ padding: '11px 12px', color: '#64748b', textAlign: 'center' }}>{s.studentProfile?.section || '—'}</td>
                  <td style={{ padding: '11px 12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.isActive ? '#dcfce7' : '#fef2f2', color: s.isActive ? '#15803d' : '#dc2626' }}>
                      {s.isActive ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick links */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 16 }}>⚡ Quick Actions</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { icon: '👥', label: 'Manage Users', path: '/management/users', color: '#2563eb', bg: '#eff6ff' },
            { icon: '🎓', label: 'View Students', path: '/management/students', color: '#7c3aed', bg: '#f5f3ff' },
            { icon: '👩‍🏫', label: 'View Staff', path: '/management/staff', color: '#15803d', bg: '#dcfce7' },
            { icon: '📊', label: 'Analytics', path: '/management/analytics', color: '#d97706', bg: '#fef9c3' },
            { icon: '📅', label: 'Attendance', path: '/management/attendance', color: '#dc2626', bg: '#fef2f2' },
          ].map(q => (
            <a key={q.label} href={q.path}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 18px', borderRadius: 12, textDecoration: 'none',
                background: q.bg, color: q.color, fontWeight: 600, fontSize: 13,
                transition: 'transform 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: 18 }}>{q.icon}</span>
              {q.label}
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}