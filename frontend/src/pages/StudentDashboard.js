import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const p = user?.studentProfile;
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [ciaMarks, setCiaMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [profileRes, attendanceRes, ciaRes] = await Promise.all([
        API.get('/profile/me').catch(() => null),
        API.get('/attendance/my').catch(() => null),
        API.get('/cia/my-marks').catch(() => null),
      ]);

      if (profileRes?.data?.profile) setProfile(profileRes.data.profile);
      if (attendanceRes?.data) setAttendance(attendanceRes.data);
      if (ciaRes?.data?.marks) setCiaMarks(ciaRes.data.marks.slice(0, 4));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Use CGPA from AcademicProfile if available, else fall back to User model
  const cgpa = profile?.cgpa ?? p?.cgpa ?? 0;
  const overallAttendance = attendance?.overall?.overallPercentage ?? '—';
  const feeStatus = p?.feeStatus || '—';

  // CIA average
  const publishedMarks = ciaMarks.filter(m => !m.isAbsent && m.marksObtained !== null);
  const ciaAvg = publishedMarks.length > 0
    ? Math.round(publishedMarks.reduce((s, m) => s + m.percentage, 0) / publishedMarks.length)
    : null;

  const statCards = [
    {
      icon: '📊', label: 'CGPA',
      value: loading ? '...' : cgpa?.toFixed(2) || '—',
      color: '#2563eb', bg: '#eff6ff',
      path: '/student/results',
    },
    {
      icon: '📅', label: 'Attendance',
      value: loading ? '...' : overallAttendance !== '—' ? `${overallAttendance}%` : '—',
      color: overallAttendance >= 75 ? '#15803d' : overallAttendance !== '—' ? '#dc2626' : '#64748b',
      bg: overallAttendance >= 75 ? '#dcfce7' : overallAttendance !== '—' ? '#fef2f2' : '#f1f5f9',
      path: '/student/attendance',
    },
    {
      icon: '📝', label: 'CIA Average',
      value: loading ? '...' : ciaAvg !== null ? `${ciaAvg}%` : '—',
      color: '#7c3aed', bg: '#f5f3ff',
      path: '/student/marks',
    },
    {
      icon: '💳', label: 'Fee Status',
      value: loading ? '...' : feeStatus,
      color: feeStatus === 'paid' ? '#15803d' : feeStatus === 'pending' ? '#dc2626' : '#d97706',
      bg: feeStatus === 'paid' ? '#dcfce7' : feeStatus === 'pending' ? '#fef2f2' : '#fef9c3',
      path: '/student/fees',
    },
  ];

  return (
    <DashboardLayout>
      {/* Profile summary */}
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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {p?.umisId && <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>UMIS: {p.umisId}</span>}
              {p?.emisId && <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>EMIS: {p.emisId}</span>}
              {p?.scholarshipStatus && p.scholarshipStatus !== 'none' && (
                <span style={{ fontSize: 11, background: '#fef3c7', color: '#d97706', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                  🏅 Scholarship: {p.scholarshipStatus}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#475569' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="dash-grid" style={{ marginBottom: 24 }}>
        {statCards.map(s => (
          <div
            className="stat-card" key={s.label}
            style={{ borderTop: `3px solid ${s.color}`, cursor: 'pointer' }}
            onClick={() => navigate(s.path)}
          >
            <div className="stat-card-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="stat-card-value" style={{ color: s.color, textTransform: 'capitalize' }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Attendance summary */}
        <div className="card">
          <div className="section-title">📅 Attendance Summary</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>⏳ Loading...</div>
          ) : !attendance ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No attendance data yet.</div>
          ) : (
            <>
              {[
                ['Present Days', attendance.overall?.presentDays ?? '—', '#dcfce7', '#15803d'],
                ['Absent Days', attendance.overall?.absentDays ?? '—', '#fef2f2', '#dc2626'],
                ['Total Days', attendance.overall?.totalDays ?? '—', '#eff6ff', '#2563eb'],
                ['Overall %', attendance.overall?.overallPercentage !== undefined ? `${attendance.overall.overallPercentage}%` : '—', attendance.overall?.overallPercentage >= 75 ? '#dcfce7' : '#fef2f2', attendance.overall?.overallPercentage >= 75 ? '#15803d' : '#dc2626'],
              ].map(([label, val, bg, color]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, background: bg, color, padding: '3px 12px', borderRadius: 20 }}>{val}</span>
                </div>
              ))}
              <button
                onClick={() => navigate('/student/attendance')}
                style={{ marginTop: 12, width: '100%', padding: '9px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                View Details →
              </button>
            </>
          )}
        </div>

        {/* Recent CIA marks */}
        <div className="card">
          <div className="section-title">📝 Recent CIA Marks</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>⏳ Loading...</div>
          ) : ciaMarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No published CIA marks yet.</div>
          ) : (
            <>
              {ciaMarks.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{m.subject}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{m.assessmentType}</div>
                  </div>
                  {m.isAbsent ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', background: '#fef2f2', padding: '3px 10px', borderRadius: 20 }}>Absent</span>
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 700, color: m.percentage >= 60 ? '#15803d' : '#dc2626' }}>
                      {m.marksObtained}/{m.maxMarks}
                    </span>
                  )}
                </div>
              ))}
              <button
                onClick={() => navigate('/student/marks')}
                style={{ marginTop: 12, width: '100%', padding: '9px', background: '#f5f3ff', color: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                View All Marks →
              </button>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}