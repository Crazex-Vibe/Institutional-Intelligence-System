import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';
import './StudentAttendance.css';

export default function StudentAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get('/attendance/my');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="loading-state">
        <div className="load-spinner" />
        <p>Loading attendance data...</p>
      </div>
    </DashboardLayout>
  );

  if (!data) return (
    <DashboardLayout>
      <div className="empty-state">
        <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
        <h3>No attendance records yet</h3>
        <p>Your attendance will appear here once your staff starts marking it.</p>
      </div>
    </DashboardLayout>
  );

  const { overall, subjectStats, lowAttendanceSubjects, recentDays } = data;
  const overallColor = overall.overallPercentage >= 75 ? '#16a34a' : overall.overallPercentage >= 65 ? '#d97706' : '#dc2626';
  const overallBg = overall.overallPercentage >= 75 ? '#dcfce7' : overall.overallPercentage >= 65 ? '#fef3c7' : '#fef2f2';

  return (
    <DashboardLayout>
      <div className="student-attendance">
        <div className="sa-header">
          <h2 className="sa-title">My Attendance</h2>
          <p className="sa-subtitle">Track your attendance across all subjects</p>
        </div>

        {/* Low attendance alert */}
        {lowAttendanceSubjects.length > 0 && (
          <div className="low-alert">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Low Attendance Warning!</strong>
              <span> You are below 75% in {lowAttendanceSubjects.length} subject(s): </span>
              {lowAttendanceSubjects.map(s => (
                <span key={s._id} className="alert-subject">{s.subject} ({s.attendancePercentage}%)</span>
              ))}
            </div>
          </div>
        )}

        {/* Overall stats */}
        <div className="overall-card">
          <div className="overall-percentage" style={{ background: overallBg, color: overallColor }}>
            <span className="pct-value">{overall.overallPercentage}%</span>
            <span className="pct-label">Overall</span>
          </div>
          <div className="overall-stats">
            {[
              { label: 'Total Days', value: overall.totalDays, icon: '📅' },
              { label: 'Present', value: overall.presentDays, icon: '✅', color: '#16a34a' },
              { label: 'Absent', value: overall.absentDays, icon: '❌', color: '#dc2626' },
              { label: 'Partial', value: overall.partialDays, icon: '⚡', color: '#d97706' },
            ].map(s => (
              <div key={s.label} className="overall-stat">
                <span className="os-icon">{s.icon}</span>
                <span className="os-value" style={{ color: s.color || '#1e293b' }}>{s.value}</span>
                <span className="os-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { id: 'overview', label: '📊 Subject-wise' },
            { id: 'calendar', label: '📅 Recent Days' },
          ].map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Subject-wise */}
        {activeTab === 'overview' && (
          <div className="subject-grid">
            {subjectStats.length === 0 ? (
              <div className="empty-state">No subject data yet.</div>
            ) : subjectStats.map(s => {
              const pct = s.attendancePercentage;
              const isLow = s.isLowAttendance;
              const barColor = pct >= 75 ? '#16a34a' : pct >= 65 ? '#d97706' : '#dc2626';
              return (
                <div key={s._id} className={`subject-card ${isLow ? 'low' : ''}`}>
                  <div className="sc-header">
                    <div className="sc-subject">{s.subject}</div>
                    {isLow && <span className="low-badge">⚠️ Low</span>}
                  </div>
                  <div className="sc-bar-wrap">
                    <div className="sc-bar-bg">
                      <div className="sc-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                      <div className="sc-bar-threshold" style={{ left: '75%' }} />
                    </div>
                    <span className="sc-pct" style={{ color: barColor }}>{pct}%</span>
                  </div>
                  <div className="sc-stats">
                    <span>✅ {s.attendedClasses}/{s.totalClasses} classes</span>
                    <span>❌ {s.absentClasses} absent</span>
                    {s.odClasses > 0 && <span>🟡 {s.odClasses} OD</span>}
                  </div>
                  {isLow && s.classesNeededFor75 > 0 && (
                    <div className="sc-warning">
                      Need <strong>{s.classesNeededFor75}</strong> more consecutive classes to reach 75%
                    </div>
                  )}
                  {!isLow && s.permissibleLeaves > 0 && (
                    <div className="sc-safe">
                      Can afford <strong>{s.permissibleLeaves}</strong> more absence(s)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Recent days */}
        {activeTab === 'calendar' && (
          <div className="recent-days">
            {recentDays.length === 0 ? (
              <div className="empty-state">No records yet.</div>
            ) : recentDays.map(day => {
              const statusConfig = {
                present: { color: '#16a34a', bg: '#dcfce7', label: 'Present' },
                absent: { color: '#dc2626', bg: '#fef2f2', label: 'Absent' },
                partial: { color: '#d97706', bg: '#fef3c7', label: 'Partial' },
                holiday: { color: '#7c3aed', bg: '#f3e8ff', label: 'Holiday' },
              }[day.dayStatus] || { color: '#94a3b8', bg: '#f1f5f9', label: 'Unknown' };

              return (
                <div key={day._id} className="day-row">
                  <div className="day-date">
                    <span className="day-num">{new Date(day.date).getDate()}</span>
                    <span className="day-month">{new Date(day.date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                  </div>
                  <div className="day-hours">
                    {Array.from({ length: 8 }, (_, i) => {
                      const h = day.hours.find(hr => hr.hour === i + 1);
                      const hColor = !h ? '#e2e8f0' : h.status === 'present' ? '#16a34a' : h.status === 'od' ? '#d97706' : h.status === 'leave' ? '#7c3aed' : '#dc2626';
                      return (
                        <div key={i} className="hour-dot" style={{ background: hColor }} title={h ? `H${i+1}: ${h.subject} — ${h.status}` : `H${i+1}: not marked`} />
                      );
                    })}
                  </div>
                  <div className="day-summary">
                    <span style={{ color: '#1e293b', fontWeight: 600, fontSize: 13 }}>{day.presentHours}/{day.totalHours} hrs</span>
                  </div>
                  <span className="day-status" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                    {statusConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
