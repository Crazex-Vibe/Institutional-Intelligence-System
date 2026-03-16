import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

export default function ManagementDashboard() {
  const { user } = useAuth();
  const p = user?.managementProfile;

  const classStatus = [
    { time: '09:00', subject: 'Data Structures', staff: 'Dr. Priya', class: 'CS-III-A', status: 'conducted' },
    { time: '09:00', subject: 'Networks', staff: 'Prof. Rajan', class: 'CS-IV-A', status: 'conducted' },
    { time: '11:00', subject: 'Algorithms', staff: 'Dr. Priya', class: 'CS-III-B', status: 'ongoing' },
    { time: '11:00', subject: 'OS', staff: 'Dr. Meena', class: 'CS-IV-B', status: 'not_started' },
    { time: '02:00', subject: 'DBMS Lab', staff: 'Dr. Priya', class: 'CS-III-A', status: 'scheduled' },
  ];

  const statusStyle = {
    conducted: { bg: '#dcfce7', color: '#15803d', label: '✅ Conducted' },
    ongoing: { bg: '#dbeafe', color: '#1d4ed8', label: '🔵 Ongoing' },
    not_started: { bg: '#fef2f2', color: '#dc2626', label: '❌ Not Started' },
    scheduled: { bg: '#fef3c7', color: '#d97706', label: '⏳ Scheduled' },
  };

  return (
    <DashboardLayout>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700 }}>
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontFamily: 'Sora', color: 'var(--gray-800)', marginBottom: 4 }}>{user?.name}</h2>
            <div style={{ display: 'flex', gap: 16 }}>
              {[['ID', p?.employeeId], ['Designation', p?.designation], ['Department', p?.department]].map(([k, v]) => v && (
                <span key={k} style={{ fontSize: 13, color: 'var(--gray-600)' }}><strong>{k}:</strong> {v}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        {[
          { icon: '🎓', label: 'Total Students', value: '480' },
          { icon: '👩‍🏫', label: 'Teaching Staff', value: '32' },
          { icon: '🏫', label: "Classes Today", value: '24' },
          { icon: '⚠️', label: 'Low Attendance', value: '12' },
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

      {/* Class tracking */}
      <div className="card">
        <div className="section-title">🏫 Live Class Tracking — Today</div>
        <div style={{ marginBottom: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(statusStyle).map(([k, v]) => (
            <span key={k} style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: v.bg, color: v.color }}>{v.label}</span>
          ))}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
              {['Time', 'Subject', 'Staff', 'Class', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classStatus.map((c, i) => {
              const s = statusStyle[c.status];
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '12px', fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>{c.time}</td>
                  <td style={{ padding: '12px', fontSize: 13, color: 'var(--gray-800)', fontWeight: 500 }}>{c.subject}</td>
                  <td style={{ padding: '12px', fontSize: 13, color: 'var(--gray-600)' }}>{c.staff}</td>
                  <td style={{ padding: '12px', fontSize: 13, color: 'var(--gray-600)' }}>{c.class}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
