import { DEPARTMENTS } from './../utils/departments';
import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';
import './ManagementAttendance.css';

export default function ManagementAttendance() {
  const [filters, setFilters] = useState({ department: '', semester: '', section: '' });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/reports/analytics', { params: { ...filters, semester: Number(filters.semester) } });
      setAnalytics(res.data);
      setSearched(true);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const pctColor = (p) => p >= 75 ? '#15803d' : p >= 50 ? '#d97706' : '#dc2626';
  const pctBg = (p) => p >= 75 ? '#dcfce7' : p >= 50 ? '#fef9c3' : '#fef2f2';

  return (
    <DashboardLayout>
      <div className="ma-root">
        <div className="ma-header">
          <h1>Attendance Overview</h1>
          <p>Class-wise attendance monitoring</p>
        </div>

        {/* Filters */}
        <div className="ma-filter">
          <div className="filter-row">
            <div className="fg"><label>Department</label>
              <select value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="fg"><label>Semester</label>
              <select value={filters.semester} onChange={e => setFilters({...filters, semester: e.target.value})}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div className="fg"><label>Section</label>
              <select value={filters.section} onChange={e => setFilters({...filters, section: e.target.value})}>
                {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <button className="ma-btn" onClick={fetchData} disabled={loading}>{loading ? '⏳' : '🔍'} Load</button>
          </div>
        </div>

        {!searched ? (
          <div className="ma-empty"><div style={{ fontSize: 52 }}>📅</div><p>Select class filters and click Load.</p></div>
        ) : analytics && (
          <>
            {/* Summary */}
            <div className="ma-summary-grid">
              {[
                { icon: '🎓', label: 'Total Students', val: analytics.summary.totalStudents, color: '#2563eb' },
                { icon: '📅', label: 'Classes Conducted', val: analytics.summary.totalClassesConducted, color: '#7c3aed' },
                { icon: '📊', label: 'Class Average', val: `${analytics.summary.classAvgAttendance}%`, color: pctColor(analytics.summary.classAvgAttendance) },
                { icon: '⚠️', label: 'Below 75%', val: analytics.summary.lowAttendanceCount, color: analytics.summary.lowAttendanceCount > 0 ? '#dc2626' : '#15803d' },
              ].map(s => (
                <div key={s.label} className="ma-stat-card">
                  <span>{s.icon}</span>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 30, fontWeight: 700, color: s.color }}>{s.val}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Subject-wise */}
            <div className="ma-card">
              <h3 className="ma-card-title">📚 Subject-wise Attendance</h3>
              {analytics.subjectStats?.map((s, i) => (
                <div key={i} className="ma-subject-row">
                  <div className="msr-info">
                    <div className="msr-name">{s.subject}</div>
                    <div className="msr-classes">{s.totalClasses} classes</div>
                  </div>
                  <div className="msr-bar-wrap">
                    <div className="msr-bar-track">
                      <div className="msr-bar-fill" style={{ width: `${s.avgAttendance}%`, background: pctColor(s.avgAttendance) }} />
                      <div className="msr-75-marker" />
                    </div>
                  </div>
                  <span className="msr-pct" style={{ background: pctBg(s.avgAttendance), color: pctColor(s.avgAttendance) }}>{s.avgAttendance}%</span>
                </div>
              ))}
            </div>

            {/* Student table */}
            <div className="ma-card">
              <h3 className="ma-card-title">👥 Student-wise Attendance</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="ma-table">
                  <thead>
                    <tr><th>#</th><th>Roll No</th><th>Student</th><th>Attended</th><th>Total</th><th>Attendance</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {analytics.studentStats?.sort((a, b) => b.percentage - a.percentage).map((s, i) => (
                      <tr key={i}>
                        <td style={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                        <td style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{s.rollNumber}</td>
                        <td style={{ fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                        <td style={{ textAlign: 'center' }}>{s.attendedHours}</td>
                        <td style={{ textAlign: 'center' }}>{s.totalHours}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="ma-mini-track"><div style={{ width: `${s.percentage}%`, height: '100%', background: pctColor(s.percentage), borderRadius: 4 }} /></div>
                            <span style={{ fontWeight: 700, color: pctColor(s.percentage), minWidth: 40 }}>{s.percentage}%</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: pctBg(s.percentage), color: pctColor(s.percentage) }}>
                            {s.isLow ? '⚠️ Low' : '✅ Good'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
