import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const p = user?.studentProfile;

  const stats = [
    { icon: '📊', label: 'CGPA', value: p?.cgpa?.toFixed(2) || '—' },
    { icon: '📅', label: 'Attendance', value: '82%' },
    { icon: '📝', label: 'CIA Average', value: '74/100' },
    { icon: '💳', label: 'Fee Status', value: p?.feeStatus || '—', capitalize: true },
  ];

  return (
    <DashboardLayout>
      {/* Profile summary */}
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
              {[
                ['Roll No', p?.rollNumber],
                ['Dept', p?.department],
                ['Semester', p?.semester],
                ['Section', p?.section],
                ['Batch', p?.batch],
              ].map(([k, v]) => v && (
                <span key={k} style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                  <strong>{k}:</strong> {v}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {p?.umisId && <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>UMIS: {p.umisId}</span>}
              {p?.emisId && <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>EMIS: {p.emisId}</span>}
              {p?.scholarshipStatus !== 'none' && <span style={{ fontSize: 11, background: '#fef3c7', color: '#d97706', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>🏅 Scholarship: {p?.scholarshipStatus}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="dash-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-card-icon">{s.icon}</div>
            <div>
              <div className="stat-card-value" style={{ textTransform: s.capitalize ? 'capitalize' : 'none' }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="card">
          <div className="section-title">📅 Attendance Summary</div>
          {[
            ['Present Days', '82', '#dcfce7', '#15803d'],
            ['Absent Days', '18', '#fef2f2', '#dc2626'],
            ['OD / Leave', '4', '#fef3c7', '#d97706'],
            ['Remaining Leaves', '6', '#eff6ff', '#1d4ed8'],
          ].map(([label, val, bg, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, background: bg, color, padding: '3px 12px', borderRadius: 20 }}>{val}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-title">📝 Recent CIA Marks</div>
          {[
            ['Data Structures', 'CIA-1', '42/50'],
            ['Algorithms', 'CIA-1', '38/50'],
            ['DBMS', 'CIA-2', '45/50'],
            ['Networks', 'CIA-1', '40/50'],
          ].map(([sub, cia, mark]) => (
            <div key={sub} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{sub}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{cia}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{mark}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
