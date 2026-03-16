import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

export default function StaffDashboard() {
  const { user } = useAuth();
  const p = user?.staffProfile;

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long' });

  const todayClasses = [
    { time: '09:00 AM', subject: 'Data Structures', class: 'CS-III-A', room: 'Room 301', status: 'completed' },
    { time: '11:00 AM', subject: 'Algorithms', class: 'CS-III-B', room: 'Room 204', status: 'upcoming' },
    { time: '02:00 PM', subject: 'DBMS Lab', class: 'CS-III-A', room: 'Lab 102', status: 'upcoming' },
  ];

  return (
    <DashboardLayout>
      {/* Staff info */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--accent)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700
          }}>
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontFamily: 'Sora', color: 'var(--gray-800)', marginBottom: 4 }}>{user?.name}</h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[['Staff ID', p?.staffId], ['Dept', p?.department], ['Designation', p?.designation]].map(([k, v]) => v && (
                <span key={k} style={{ fontSize: 13, color: 'var(--gray-600)' }}><strong>{k}:</strong> {v}</span>
              ))}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {p?.subjects?.map(s => (
                <span key={s} style={{ fontSize: 11, background: 'var(--accent-light)', color: 'var(--accent)', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {[
          { icon: '🏫', label: "Today's Classes", value: '3' },
          { icon: '👥', label: 'Total Students', value: '120' },
          { icon: '✅', label: 'Attendance Marked', value: '1/3' },
          { icon: '📝', label: 'CIA Pending', value: '2' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-card-icon">{s.icon}</div>
            <div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-title">📅 Today's Schedule — {today}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {todayClasses.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 10, background: c.status === 'completed' ? '#f0fdf4' : '#eff6ff', border: `1px solid ${c.status === 'completed' ? '#bbf7d0' : '#bfdbfe'}` }}>
              <div style={{ minWidth: 80, fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>{c.time}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-800)' }}>{c.subject}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{c.class} • {c.room}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: c.status === 'completed' ? '#dcfce7' : '#dbeafe', color: c.status === 'completed' ? '#15803d' : '#1d4ed8' }}>
                {c.status === 'completed' ? '✅ Done' : '⏳ Upcoming'}
              </span>
              {c.status === 'upcoming' && (
                <button style={{ padding: '7px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Mark Attendance
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
