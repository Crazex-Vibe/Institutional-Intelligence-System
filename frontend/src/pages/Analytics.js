import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';
import './Analytics.css';

const SUBJECTS = ['Data Structures', 'Algorithms', 'DBMS', 'Networks', 'OS', 'Software Engineering', 'Web Technology', 'Project'];
const CIA_TYPES = ['CIA-1', 'CIA-2', 'MODEL'];

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [filters, setFilters] = useState({ department: 'Computer Science', semester: '5', section: 'A' });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Email states
  const [emailType, setEmailType] = useState('cia-class');
  const [emailConfig, setEmailConfig] = useState({ subject: '', assessmentType: 'CIA-1', semesterNumber: '5', studentId: '' });
  const [sending, setSending] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [students, setStudents] = useState([]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await API.get('/reports/analytics', { params: { ...filters, semester: Number(filters.semester) } });
      setAnalytics(res.data);
      setSearched(true);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    try {
      const res = await API.get('/profile/students', { params: filters });
      setStudents(res.data.students);
    } catch (err) { console.error(err); }
  };

  const handleSendEmail = async () => {
    setSending(true); setEmailResult(null); setEmailError('');
    try {
      let res;
      if (emailType === 'cia-class') {
        res = await API.post('/reports/send-cia-class', {
          ...filters, semester: Number(filters.semester),
          subject: emailConfig.subject, assessmentType: emailConfig.assessmentType,
        });
      } else if (emailType === 'attendance-alerts') {
        res = await API.post('/reports/send-attendance-alerts', {
          ...filters, semester: Number(filters.semester),
        });
      } else if (emailType === 'semester-report') {
        res = await API.post('/reports/send-semester-report', {
          studentId: emailConfig.studentId,
          semesterNumber: Number(emailConfig.semesterNumber),
        });
      }
      setEmailResult(res.data);
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const pctColor = (pct) => pct >= 75 ? '#15803d' : pct >= 50 ? '#d97706' : '#dc2626';
  const pctBg = (pct) => pct >= 75 ? '#dcfce7' : pct >= 50 ? '#fef9c3' : '#fef2f2';

  return (
    <DashboardLayout>
      <div className="analytics-root">
        <div className="analytics-header">
          <div>
            <h1>Analytics & Reports</h1>
            <p>Attendance analytics and automated email communications</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="analytics-filter">
          <div className="filter-row">
            <div className="fg"><label>Department</label><input value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})} /></div>
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
            <button className="filter-btn" onClick={() => { fetchAnalytics(); fetchStudents(); }} disabled={loading}>
              {loading ? '⏳' : '🔍'} Load
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="analytics-tabs">
          <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>📊 Attendance Analytics</button>
          <button className={activeTab === 'emails' ? 'active' : ''} onClick={() => setActiveTab('emails')}>📧 Send Email Reports</button>
        </div>

        {/* ── Analytics Tab ── */}
        {activeTab === 'analytics' && (
          <>
            {!searched ? (
              <div className="analytics-empty">
                <div style={{ fontSize: 52, marginBottom: 14 }}>📊</div>
                <p>Select filters and click Load to view analytics.</p>
              </div>
            ) : analytics && (
              <>
                {/* Summary cards */}
                <div className="analytics-grid">
                  {[
                    { icon: '🎓', label: 'Total Students', val: analytics.summary.totalStudents, color: '#2563eb' },
                    { icon: '📅', label: 'Classes Conducted', val: analytics.summary.totalClassesConducted, color: '#7c3aed' },
                    { icon: '📊', label: 'Class Avg Attendance', val: `${analytics.summary.classAvgAttendance}%`, color: analytics.summary.classAvgAttendance >= 75 ? '#15803d' : '#dc2626' },
                    { icon: '⚠️', label: 'Low Attendance', val: analytics.summary.lowAttendanceCount, color: analytics.summary.lowAttendanceCount > 0 ? '#dc2626' : '#15803d' },
                  ].map(s => (
                    <div key={s.label} className="analytics-stat-card">
                      <span className="asc-icon">{s.icon}</span>
                      <span className="asc-val" style={{ color: s.color }}>{s.val}</span>
                      <span className="asc-label">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Attendance trend */}
                {analytics.attendanceTrend?.length > 0 && (
                  <div className="analytics-card">
                    <h3 className="ac-title">📈 Attendance Trend (Last 30 Days)</h3>
                    <div className="trend-chart">
                      {analytics.attendanceTrend.map((d, i) => {
                        const h = Math.max(4, (d.percentage / 100) * 100);
                        const color = d.percentage >= 75 ? '#22c55e' : d.percentage >= 50 ? '#f59e0b' : '#ef4444';
                        return (
                          <div key={i} className="trend-col" title={`${d.date}: ${d.percentage}%`}>
                            <div className="trend-pct">{d.percentage}%</div>
                            <div className="trend-bar-item" style={{ height: h, background: color }} />
                            <div className="trend-date">{new Date(d.date).getDate()}/{new Date(d.date).getMonth()+1}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="trend-legend">
                      <span className="legend-dot" style={{ background: '#22c55e' }} />≥75%
                      <span className="legend-dot" style={{ background: '#f59e0b', marginLeft: 12 }} />50-74%
                      <span className="legend-dot" style={{ background: '#ef4444', marginLeft: 12 }} />&lt;50%
                    </div>
                  </div>
                )}

                <div className="analytics-two-col">
                  {/* Subject-wise */}
                  <div className="analytics-card">
                    <h3 className="ac-title">📚 Subject-wise Attendance</h3>
                    {analytics.subjectStats?.map((s, i) => (
                      <div key={i} className="subject-att-row">
                        <div className="sar-info">
                          <div className="sar-name">{s.subject}</div>
                          <div className="sar-classes">{s.totalClasses} classes</div>
                        </div>
                        <div className="sar-bar-wrap">
                          <div className="sar-bar-track">
                            <div className="sar-bar-fill" style={{ width: `${s.avgAttendance}%`, background: pctColor(s.avgAttendance) }} />
                            <div className="sar-marker" />
                          </div>
                        </div>
                        <span className="sar-pct" style={{ background: pctBg(s.avgAttendance), color: pctColor(s.avgAttendance) }}>
                          {s.avgAttendance}%
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Low attendance students */}
                  <div className="analytics-card">
                    <h3 className="ac-title">🚨 Low Attendance Students</h3>
                    {analytics.studentStats?.filter(s => s.isLow).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 30, color: '#15803d' }}>
                        <div style={{ fontSize: 32 }}>✅</div>
                        <p style={{ marginTop: 8, fontWeight: 600 }}>All students above 75%!</p>
                      </div>
                    ) : (
                      analytics.studentStats?.filter(s => s.isLow).sort((a, b) => a.percentage - b.percentage).map((s, i) => (
                        <div key={i} className="low-student-row">
                          <div className="lsr-avatar">{s.name.charAt(0)}</div>
                          <div className="lsr-info">
                            <div className="lsr-name">{s.name}</div>
                            <div className="lsr-roll">{s.rollNumber} • {s.attendedHours}/{s.totalHours} hrs</div>
                          </div>
                          <span className="lsr-pct" style={{ background: '#fef2f2', color: '#dc2626' }}>{s.percentage}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* All students table */}
                <div className="analytics-card">
                  <h3 className="ac-title">👥 All Students Attendance Summary</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="att-summary-table">
                      <thead>
                        <tr><th>#</th><th>Roll No</th><th>Student</th><th>Attended</th><th>Total</th><th>Attendance %</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {analytics.studentStats?.sort((a, b) => b.percentage - a.percentage).map((s, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{s.rollNumber}</td>
                            <td style={{ fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                            <td style={{ textAlign: 'center' }}>{s.attendedHours}</td>
                            <td style={{ textAlign: 'center' }}>{s.totalHours}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="mini-bar-track">
                                  <div className="mini-bar-fill" style={{ width: `${s.percentage}%`, background: pctColor(s.percentage) }} />
                                </div>
                                <span style={{ fontWeight: 700, color: pctColor(s.percentage), minWidth: 40 }}>{s.percentage}%</span>
                              </div>
                            </td>
                            <td>
                              <span className="att-status-badge" style={{ background: pctBg(s.percentage), color: pctColor(s.percentage) }}>
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
          </>
        )}

        {/* ── Email Reports Tab ── */}
        {activeTab === 'emails' && (
          <div className="email-panel">
            <div className="email-type-selector">
              {[
                { key: 'cia-class', icon: '📝', label: 'CIA Results to Class', desc: 'Send CIA marks to all students & parents' },
                { key: 'attendance-alerts', icon: '🚨', label: 'Low Attendance Alerts', desc: 'Alert students & parents with <75% attendance' },
                { key: 'semester-report', icon: '🎓', label: 'Semester Report', desc: 'Send semester results to individual student' },
              ].map(t => (
                <div key={t.key} className={`email-type-card ${emailType === t.key ? 'active' : ''}`} onClick={() => { setEmailType(t.key); setEmailResult(null); setEmailError(''); }}>
                  <span className="etc-icon">{t.icon}</span>
                  <div>
                    <div className="etc-label">{t.label}</div>
                    <div className="etc-desc">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="email-config-card">
              <h3 className="ec-title">
                {emailType === 'cia-class' ? '📝 Send CIA Results to Class' :
                 emailType === 'attendance-alerts' ? '🚨 Send Low Attendance Alerts' :
                 '🎓 Send Semester Report'}
              </h3>

              {/* Class filters already set above */}
              <div className="ec-info">
                <span>📍 Class: {filters.department} | Sem {filters.semester} | Sec {filters.section}</span>
                <button className="ec-change-btn" onClick={() => setActiveTab('analytics')}>Change filters ↗</button>
              </div>

              {/* CIA-specific config */}
              {emailType === 'cia-class' && (
                <div className="ec-extra">
                  <div className="fg"><label>Subject</label>
                    <select value={emailConfig.subject} onChange={e => setEmailConfig({...emailConfig, subject: e.target.value})}>
                      <option value="">Select Subject</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="fg"><label>Assessment Type</label>
                    <select value={emailConfig.assessmentType} onChange={e => setEmailConfig({...emailConfig, assessmentType: e.target.value})}>
                      {CIA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Semester report config */}
              {emailType === 'semester-report' && (
                <div className="ec-extra">
                  <div className="fg"><label>Student</label>
                    <select value={emailConfig.studentId} onChange={e => setEmailConfig({...emailConfig, studentId: e.target.value})}>
                      <option value="">Select Student</option>
                      {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.studentProfile?.rollNumber})</option>)}
                    </select>
                  </div>
                  <div className="fg"><label>Semester</label>
                    <select value={emailConfig.semesterNumber} onChange={e => setEmailConfig({...emailConfig, semesterNumber: e.target.value})}>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* What will be sent */}
              <div className="ec-preview">
                <div className="ec-preview-title">📨 What will be sent:</div>
                {emailType === 'cia-class' && <p>CIA marks email to every student in the class + their parent email (if on file). Includes marks, percentage, class average comparison.</p>}
                {emailType === 'attendance-alerts' && <p>Alert emails only to students below 75% attendance + their parents. Shows which subjects are low and how many classes needed to recover.</p>}
                {emailType === 'semester-report' && <p>Full semester result report with SGPA, CGPA, subject-wise grades, credits and arrear status to selected student + parent.</p>}
              </div>

              {emailResult && (
                <div className="ec-success">
                  ✅ {emailResult.message}
                  <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                    {emailResult.sent > 0 && <span className="ec-stat sent">📧 {emailResult.sent} sent</span>}
                    {emailResult.failed > 0 && <span className="ec-stat failed">❌ {emailResult.failed} failed</span>}
                    {emailResult.skipped > 0 && <span className="ec-stat skipped">⏭️ {emailResult.skipped} skipped</span>}
                  </div>
                </div>
              )}

              {emailError && <div className="ec-error">⚠️ {emailError}</div>}

              <button className="send-email-btn" onClick={handleSendEmail} disabled={sending}>
                {sending ? '⏳ Sending emails...' : `📧 Send ${emailType === 'cia-class' ? 'CIA Results' : emailType === 'attendance-alerts' ? 'Attendance Alerts' : 'Semester Report'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
