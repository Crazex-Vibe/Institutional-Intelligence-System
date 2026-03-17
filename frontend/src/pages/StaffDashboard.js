import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function StaffDashboard() {
  const { user } = useAuth();
  const p = user?.staffProfile;
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalStudents: 0,
    ciaRecords: 0,
    publishedCIA: 0,
    draftCIA: 0,
  });
  const [recentCIA, setRecentCIA] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch students in staff's department
      const params = {};
      if (p?.department) params.department = p.department;

      const [studentsRes, ciaRes] = await Promise.all([
        API.get('/profile/students', { params }),
        API.get('/cia/staff/records'),
      ]);

      const students = studentsRes.data.students || [];
      const ciaRecords = ciaRes.data.records || [];

      setStats({
        totalStudents: students.length,
        ciaRecords: ciaRecords.length,
        publishedCIA: ciaRecords.filter(r => r.isPublished).length,
        draftCIA: ciaRecords.filter(r => !r.isPublished).length,
      });

      setRecentCIA(ciaRecords.slice(0, 5));
    } catch (err) {
      console.error('Staff dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: '👥', label: 'My Students',
      value: loading ? '...' : stats.totalStudents,
      color: '#2563eb', bg: '#eff6ff',
      path: '/staff/students',
    },
    {
      icon: '📝', label: 'CIA Records',
      value: loading ? '...' : stats.ciaRecords,
      color: '#7c3aed', bg: '#f5f3ff',
      path: '/staff/marks',
    },
    {
      icon: '📢', label: 'Published',
      value: loading ? '...' : stats.publishedCIA,
      color: '#15803d', bg: '#dcfce7',
      path: '/staff/marks',
    },
    {
      icon: '📋', label: 'Drafts',
      value: loading ? '...' : stats.draftCIA,
      color: '#d97706', bg: '#fef9c3',
      path: '/staff/marks',
    },
  ];

  return (
    <DashboardLayout>
      {/* Staff profile card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--accent)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700, flexShrink: 0,
          }}>
            {user?.name?.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, fontFamily: 'Sora', color: 'var(--gray-800)', marginBottom: 4 }}>
              {user?.name}
            </h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
              {[
                ['Staff ID', p?.staffId],
                ['Dept', p?.department],
                ['Designation', p?.designation],
                ['Email', user?.email],
              ].map(([k, v]) => v && (
                <span key={k} style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                  <strong>{k}:</strong> {v}
                </span>
              ))}
            </div>
            {p?.subjects?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {p.subjects.map(s => (
                  <span key={s} style={{
                    fontSize: 11, background: 'var(--accent-light)',
                    color: 'var(--accent)', padding: '3px 10px',
                    borderRadius: 20, fontWeight: 600,
                  }}>{s}</span>
                ))}
              </div>
            )}
          </div>
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

      {/* Stats grid */}
      <div className="dash-grid" style={{ marginBottom: 24 }}>
        {statCards.map(s => (
          <div
            className="stat-card" key={s.label}
            style={{ borderTop: `3px solid ${s.color}`, cursor: 'pointer' }}
            onClick={() => navigate(s.path)}
          >
            <div className="stat-card-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent CIA records */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>
          📝 Recent CIA Records
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>⏳ Loading...</div>
        ) : recentCIA.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📝</div>
            <p>No CIA records yet.</p>
            <button
              onClick={() => navigate('/staff/marks')}
              style={{ marginTop: 12, padding: '9px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Enter Marks →
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                {['Subject', 'Type', 'Class', 'Avg', 'Pass', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentCIA.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '11px 12px', fontWeight: 600, color: '#1e293b' }}>{r.subject}</td>
                  <td style={{ padding: '11px 12px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#dbeafe', color: '#1d4ed8' }}>
                      {r.assessmentType}
                    </span>
                  </td>
                  <td style={{ padding: '11px 12px', fontSize: 12, color: '#64748b' }}>
                    Sem {r.semester} | Sec {r.section}
                  </td>
                  <td style={{ padding: '11px 12px', fontWeight: 700, color: '#2563eb' }}>
                    {r.classAverage}/{r.maxMarks}
                  </td>
                  <td style={{ padding: '11px 12px', color: '#64748b' }}>{r.passCount} students</td>
                  <td style={{ padding: '11px 12px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: r.isPublished ? '#dcfce7' : '#fef9c3',
                      color: r.isPublished ? '#15803d' : '#d97706',
                    }}>
                      {r.isPublished ? '✅ Published' : '📝 Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="section-title" style={{ marginBottom: 16 }}>⚡ Quick Actions</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { icon: '✅', label: 'Mark Attendance', path: '/staff/attendance', color: '#15803d', bg: '#dcfce7' },
            { icon: '📝', label: 'Enter Marks', path: '/staff/marks', color: '#2563eb', bg: '#eff6ff' },
            { icon: '👥', label: 'My Students', path: '/staff/students', color: '#7c3aed', bg: '#f5f3ff' },
            { icon: '📊', label: 'Reports', path: '/staff/reports', color: '#d97706', bg: '#fef9c3' },
            { icon: '👩‍🏫', label: 'Staff Directory', path: '/staff/directory', color: '#0369a1', bg: '#e0f2fe' },
          ].map(q => (
            <button
              key={q.label}
              onClick={() => navigate(q.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 18px', borderRadius: 12,
                background: q.bg, color: q.color,
                fontWeight: 600, fontSize: 13, border: 'none',
                cursor: 'pointer', transition: 'transform 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: 18 }}>{q.icon}</span>
              {q.label}
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}