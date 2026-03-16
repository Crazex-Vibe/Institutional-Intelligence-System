import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';

export default function AttendanceOverview() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [overview, setOverview] = useState(null);
  const [lowStudents, setLowStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchOverview(); }, [date]);
  useEffect(() => { fetchLowAttendance(); }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await API.get('/attendance/overview', { params: { date } });
      setOverview(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchLowAttendance = async () => {
    try {
      const res = await API.get('/attendance/low-attendance');
      setLowStudents(res.data.students || []);
    } catch (err) { console.error(err); }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Sora', fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Attendance Overview</h2>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>Monitor student attendance across all classes</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[{ id: 'daily', label: '📅 Daily Report' }, { id: 'low', label: `⚠️ Low Attendance (${lowStudents.length})` }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '9px 20px', borderRadius: 10, border: '2px solid', borderColor: activeTab === t.id ? 'var(--accent, #7c3aed)' : '#e2e8f0', background: activeTab === t.id ? 'var(--accent, #7c3aed)' : 'white', color: activeTab === t.id ? 'white' : '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'daily' && (
          <>
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Select Date:</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ padding: '9px 14px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
            </div>

            {overview && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
                  {[
                    { label: 'Total Students', value: overview.summary.totalStudents, color: '#1e293b', bg: '#f1f5f9' },
                    { label: 'Present', value: overview.summary.presentCount, color: '#16a34a', bg: '#dcfce7' },
                    { label: 'Absent', value: overview.summary.absentCount, color: '#dc2626', bg: '#fef2f2' },
                    { label: 'Partial', value: overview.summary.partialCount, color: '#d97706', bg: '#fef3c7' },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'Sora' }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: '#475569', fontWeight: 500, marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                        {['Student', 'Roll No', 'Present Hrs', 'Absent Hrs', 'Day Status'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {overview.records.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No records for this date</td></tr>
                      ) : overview.records.map(r => {
                        const statusCfg = { present: { bg: '#dcfce7', color: '#16a34a' }, absent: { bg: '#fef2f2', color: '#dc2626' }, partial: { bg: '#fef3c7', color: '#d97706' } }[r.dayStatus] || { bg: '#f1f5f9', color: '#94a3b8' };
                        return (
                          <tr key={r._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{r.student?.name}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{r.student?.studentProfile?.rollNumber}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#16a34a', fontWeight: 600 }}>{r.presentHours}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#dc2626', fontWeight: 600 }}>{r.absentHours}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: statusCfg.bg, color: statusCfg.color, textTransform: 'capitalize' }}>{r.dayStatus}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'low' && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {lowStudents.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <h3 style={{ color: '#475569' }}>All students above 75%!</h3>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {['Student', 'Roll No', 'Subject', 'Attendance %', 'Classes Needed'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lowStudents.map(s => (
                    <tr key={s._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{s.student?.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{s.student?.studentProfile?.rollNumber}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{s.subject}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '3px 10px', borderRadius: 20 }}>{s.attendancePercentage}%</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#d97706', fontWeight: 600 }}>{s.classesNeededFor75} classes</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
