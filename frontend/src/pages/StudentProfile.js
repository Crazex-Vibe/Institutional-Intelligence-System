import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import './StudentProfile.css';

const GRADE_COLORS = {
  O: { bg: '#dcfce7', color: '#15803d' },
  'A+': { bg: '#dbeafe', color: '#1d4ed8' },
  A: { bg: '#eff6ff', color: '#2563eb' },
  'B+': { bg: '#fef9c3', color: '#a16207' },
  B: { bg: '#fef3c7', color: '#b45309' },
  C: { bg: '#fff7ed', color: '#c2410c' },
  U: { bg: '#fef2f2', color: '#dc2626' },
  RA: { bg: '#fef2f2', color: '#dc2626' },
  '--': { bg: '#f1f5f9', color: '#94a3b8' },
};

const CATEGORY_ICONS = {
  academic: '📚', sports: '🏆', cultural: '🎭',
  technical: '💻', placement: '💼', other: '🏅',
};

const LEVEL_BADGE = {
  college: { bg: '#eff6ff', color: '#1d4ed8', label: 'College' },
  university: { bg: '#f3e8ff', color: '#7c3aed', label: 'University' },
  state: { bg: '#fef9c3', color: '#a16207', label: 'State' },
  national: { bg: '#dcfce7', color: '#15803d', label: 'National' },
  international: { bg: '#fef2f2', color: '#dc2626', label: 'International 🌍' },
};

const TABS = ['Overview', 'Results', 'Fees', 'Exam Timetable', 'Achievements'];

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [expandedSem, setExpandedSem] = useState(null);
  const [showAddAchievement, setShowAddAchievement] = useState(false);
  const [newAchievement, setNewAchievement] = useState({ title: '', category: 'technical', description: '', issuedBy: '', level: 'college', date: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get('/profile/my');
      setProfile(res.data.profile);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAchievement = async () => {
    setSaving(true);
    try {
      await API.post('/profile/achievement', newAchievement);
      await fetchProfile();
      setShowAddAchievement(false);
      setNewAchievement({ title: '', category: 'technical', description: '', issuedBy: '', level: 'college', date: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAchievement = async (id) => {
    if (!window.confirm('Delete this achievement?')) return;
    try {
      await API.delete(`/profile/achievement/${id}`);
      await fetchProfile();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const p = user?.studentProfile;
  const publishedSems = profile?.semesters?.filter(s => s.isResultPublished) || [];
  const currentSem = profile?.semesters?.find(s => !s.isResultPublished);

  if (loading) return (
    <DashboardLayout>
      <div className="profile-loading">⏳ Loading your profile...</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="profile-root">

        {/* ── Hero Card ── */}
        <div className="profile-hero">
          <div className="hero-left">
            <div className="hero-avatar">{user?.name?.charAt(0)}</div>
            <div className="hero-info">
              <h1 className="hero-name">{user?.name}</h1>
              <div className="hero-chips">
                {[
                  p?.rollNumber && `🎓 ${p.rollNumber}`,
                  p?.department && `🏛️ ${p.department}`,
                  p?.batch && `📅 ${p.batch}`,
                  p?.section && `Sec ${p.section}`,
                ].filter(Boolean).map((chip, i) => (
                  <span key={i} className="hero-chip">{chip}</span>
                ))}
              </div>
              <div className="hero-ids">
                {p?.umisId && <span className="id-badge umis">UMIS: {p.umisId}</span>}
                {p?.emisId && <span className="id-badge emis">EMIS: {p.emisId}</span>}
              </div>
            </div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hs-val">{profile?.cgpa?.toFixed(2) || '—'}</span>
              <span className="hs-label">CGPA</span>
            </div>
            <div className="hero-stat">
              <span className="hs-val">{profile?.totalCreditsEarned || 0}</span>
              <span className="hs-label">Credits</span>
            </div>
            <div className="hero-stat">
              <span className="hs-val" style={{ color: profile?.totalArrears > 0 ? '#dc2626' : '#15803d' }}>
                {profile?.totalArrears || 0}
              </span>
              <span className="hs-label">Arrears</span>
            </div>
            <div className="hero-stat">
              <span className="hs-val">{profile?.achievements?.length || 0}</span>
              <span className="hs-label">Awards</span>
            </div>
          </div>
        </div>

        {/* Scholarship banner */}
        {profile?.scholarship?.status === 'approved' && (
          <div className="scholarship-banner">
            🏅 <strong>Merit Scholarship Approved</strong> — ₹{profile.scholarship.amount?.toLocaleString()} for {profile.scholarship.academicYear}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="profile-tabs">
          {TABS.map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'Overview' && (
          <div className="tab-content">
            {/* CGPA Trend */}
            <div className="profile-card">
              <h3 className="card-title">📈 CGPA Progression</h3>
              <div className="cgpa-trend">
                {publishedSems.map((sem, i) => {
                  const maxH = 120;
                  const barH = sem.sgpa > 0 ? (sem.sgpa / 10) * maxH : 4;
                  const color = sem.sgpa >= 8.5 ? '#22c55e' : sem.sgpa >= 7 ? '#3b82f6' : sem.sgpa >= 5 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={i} className="trend-bar-wrap">
                      <div className="trend-bar" style={{ height: barH, background: color }} title={`SGPA: ${sem.sgpa}`} />
                      <div className="trend-val">{sem.sgpa.toFixed(1)}</div>
                      <div className="trend-label">S{sem.semesterNumber}</div>
                    </div>
                  );
                })}
                {publishedSems.length === 0 && <p style={{ color: '#94a3b8', fontSize: 14 }}>No published results yet.</p>}
              </div>
            </div>

            {/* Quick info grid */}
            <div className="overview-grid">
              <div className="profile-card">
                <h3 className="card-title">👤 Personal Info</h3>
                {[
                  ['Email', user?.email],
                  ['Department', p?.department],
                  ['Semester', `Semester ${p?.semester}`],
                  ['Section', `Section ${p?.section}`],
                  ['Batch', p?.batch],
                  ['Parent Email', p?.parentEmail || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="info-row">
                    <span className="info-key">{k}</span>
                    <span className="info-val">{v}</span>
                  </div>
                ))}
              </div>
              <div className="profile-card">
                <h3 className="card-title">📊 Academic Summary</h3>
                {[
                  ['CGPA', profile?.cgpa?.toFixed(2) || '—'],
                  ['Total Credits', profile?.totalCreditsEarned || 0],
                  ['Active Arrears', profile?.totalArrears || 0],
                  ['Semesters Completed', publishedSems.length],
                  ['Fee Status', p?.feeStatus || '—'],
                  ['Scholarship', profile?.scholarship?.status || 'none'],
                ].map(([k, v]) => (
                  <div key={k} className="info-row">
                    <span className="info-key">{k}</span>
                    <span className="info-val" style={{ textTransform: 'capitalize' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Results Tab ── */}
        {activeTab === 'Results' && (
          <div className="tab-content">
            {profile?.semesters?.length === 0 && (
              <div className="empty-state">📋 No results available yet.</div>
            )}
            {profile?.semesters?.sort((a, b) => a.semesterNumber - b.semesterNumber).map(sem => (
              <div key={sem.semesterNumber} className="sem-card">
                <div className="sem-header" onClick={() => setExpandedSem(expandedSem === sem.semesterNumber ? null : sem.semesterNumber)}>
                  <div className="sem-left">
                    <span className="sem-num">Semester {sem.semesterNumber}</span>
                    <span className="sem-year">{sem.academicYear}</span>
                    {!sem.isResultPublished && <span className="sem-badge ongoing">In Progress</span>}
                  </div>
                  <div className="sem-right">
                    {sem.isResultPublished ? (
                      <>
                        <div className="sem-stat"><span>{sem.sgpa.toFixed(2)}</span><label>SGPA</label></div>
                        <div className="sem-stat"><span>{sem.earnedCredits}/{sem.totalCredits}</span><label>Credits</label></div>
                        <div className="sem-stat"><span style={{ color: sem.subjects.some(s => s.isArrear) ? '#dc2626' : '#15803d' }}>
                          {sem.subjects.filter(s => s.isArrear).length === 0 ? 'Clear ✅' : `${sem.subjects.filter(s => s.isArrear).length} Arrear`}
                        </span><label>Status</label></div>
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>Results awaited</span>
                    )}
                    <span className="expand-icon">{expandedSem === sem.semesterNumber ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedSem === sem.semesterNumber && (
                  <div className="sem-subjects">
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>Code</th><th>Subject</th><th>Credits</th><th>Grade</th><th>Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.subjects.map((subj, i) => {
                          const gc = GRADE_COLORS[subj.grade] || GRADE_COLORS['--'];
                          return (
                            <tr key={i} className={subj.isArrear ? 'arrear-row' : ''}>
                              <td className="code-cell">{subj.code || '—'}</td>
                              <td>{subj.name}</td>
                              <td style={{ textAlign: 'center' }}>{subj.credits}</td>
                              <td>
                                <span className="grade-badge" style={{ background: gc.bg, color: gc.color }}>{subj.grade}</span>
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{subj.gradePoint || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Fees Tab ── */}
        {activeTab === 'Fees' && (
          <div className="tab-content">
            <div className="profile-card">
              <h3 className="card-title">💳 Fee Payment History</h3>
              {profile?.fees?.length === 0 ? (
                <div className="empty-state">No fee records found.</div>
              ) : (
                <table className="results-table">
                  <thead>
                    <tr><th>Semester</th><th>Year</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th>Receipt</th></tr>
                  </thead>
                  <tbody>
                    {profile?.fees?.sort((a, b) => a.semesterNumber - b.semesterNumber).map((fee, i) => {
                      const statusColor = { paid: '#15803d', pending: '#dc2626', partial: '#d97706', waived: '#7c3aed' };
                      return (
                        <tr key={i}>
                          <td>Sem {fee.semesterNumber}</td>
                          <td>{fee.academicYear}</td>
                          <td>₹{fee.totalAmount?.toLocaleString()}</td>
                          <td style={{ color: '#15803d', fontWeight: 600 }}>₹{fee.paidAmount?.toLocaleString()}</td>
                          <td style={{ color: fee.dueAmount > 0 ? '#dc2626' : '#15803d', fontWeight: 600 }}>
                            ₹{fee.dueAmount?.toLocaleString()}
                          </td>
                          <td>
                            <span className="grade-badge" style={{ background: fee.status === 'paid' ? '#dcfce7' : '#fef2f2', color: statusColor[fee.status] || '#64748b', textTransform: 'capitalize' }}>
                              {fee.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: '#94a3b8' }}>{fee.receiptNumber || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Fee summary */}
              {profile?.fees?.length > 0 && (
                <div className="fee-summary">
                  <div className="fee-sum-item"><span>Total Paid</span><strong style={{ color: '#15803d' }}>₹{profile.fees.reduce((s, f) => s + f.paidAmount, 0).toLocaleString()}</strong></div>
                  <div className="fee-sum-item"><span>Total Due</span><strong style={{ color: profile.fees.reduce((s, f) => s + f.dueAmount, 0) > 0 ? '#dc2626' : '#15803d' }}>₹{profile.fees.reduce((s, f) => s + f.dueAmount, 0).toLocaleString()}</strong></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Exam Timetable Tab ── */}
        {activeTab === 'Exam Timetable' && (
          <div className="tab-content">
            <div className="profile-card">
              <h3 className="card-title">📅 Upcoming Examinations</h3>
              {profile?.examTimetable?.length === 0 ? (
                <div className="empty-state">📋 No exam timetable published yet.</div>
              ) : (
                <div className="exam-list">
                  {profile?.examTimetable?.sort((a, b) => new Date(a.examDate) - new Date(b.examDate)).map((exam, i) => {
                    const isPast = new Date(exam.examDate) < new Date();
                    return (
                      <div key={i} className={`exam-card ${isPast ? 'past' : ''}`}>
                        <div className="exam-date-block">
                          <span className="exam-day">{new Date(exam.examDate).toLocaleDateString('en-IN', { day: '2-digit' })}</span>
                          <span className="exam-month">{new Date(exam.examDate).toLocaleDateString('en-IN', { month: 'short' })}</span>
                          <span className="exam-session-badge" style={{ background: exam.session === 'FN' ? '#dbeafe' : '#fef3c7', color: exam.session === 'FN' ? '#1d4ed8' : '#a16207' }}>
                            {exam.session === 'FN' ? '🌅 FN' : '🌇 AN'}
                          </span>
                        </div>
                        <div className="exam-details">
                          <div className="exam-subject">{exam.subjectName}</div>
                          <div className="exam-meta">{exam.subjectCode} • {exam.startTime} – {exam.endTime}</div>
                          {exam.venue && <div className="exam-venue">📍 {exam.venue}</div>}
                        </div>
                        {isPast && <span className="past-badge">Completed</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Achievements Tab ── */}
        {activeTab === 'Achievements' && (
          <div className="tab-content">
            <div className="ach-header">
              <h3 className="card-title" style={{ margin: 0 }}>🏅 Achievements & Certificates</h3>
              <button className="add-ach-btn" onClick={() => setShowAddAchievement(!showAddAchievement)}>
                {showAddAchievement ? '✕ Cancel' : '+ Add Achievement'}
              </button>
            </div>

            {/* Add achievement form */}
            {showAddAchievement && (
              <div className="profile-card" style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 16, fontFamily: 'Sora', color: '#1e293b' }}>Add New Achievement</h4>
                <div className="ach-form-grid">
                  <input placeholder="Title *" value={newAchievement.title} onChange={e => setNewAchievement({...newAchievement, title: e.target.value})} />
                  <select value={newAchievement.category} onChange={e => setNewAchievement({...newAchievement, category: e.target.value})}>
                    {['academic','sports','cultural','technical','placement','other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                  <input placeholder="Issued by (organization)" value={newAchievement.issuedBy} onChange={e => setNewAchievement({...newAchievement, issuedBy: e.target.value})} />
                  <select value={newAchievement.level} onChange={e => setNewAchievement({...newAchievement, level: e.target.value})}>
                    {['college','university','state','national','international'].map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase()+l.slice(1)}</option>)}
                  </select>
                  <input type="date" value={newAchievement.date} onChange={e => setNewAchievement({...newAchievement, date: e.target.value})} />
                  <textarea placeholder="Description" value={newAchievement.description} onChange={e => setNewAchievement({...newAchievement, description: e.target.value})} rows={2} style={{ gridColumn: '1 / -1' }} />
                </div>
                <button className="att-btn-primary" onClick={handleAddAchievement} disabled={saving} style={{ marginTop: 14 }}>
                  {saving ? 'Saving...' : 'Save Achievement'}
                </button>
              </div>
            )}

            <div className="ach-grid">
              {profile?.achievements?.length === 0 ? (
                <div className="empty-state">No achievements yet. Add your first one!</div>
              ) : (
                profile?.achievements?.map((ach, i) => {
                  const lvl = LEVEL_BADGE[ach.level] || LEVEL_BADGE.college;
                  return (
                    <div key={i} className="ach-card">
                      <div className="ach-card-top">
                        <span className="ach-cat-icon">{CATEGORY_ICONS[ach.category] || '🏅'}</span>
                        <div style={{ flex: 1 }}>
                          <div className="ach-title">{ach.title}</div>
                          <div className="ach-issuer">{ach.issuedBy}</div>
                        </div>
                        <button className="ach-delete" onClick={() => handleDeleteAchievement(ach._id)} title="Delete">✕</button>
                      </div>
                      {ach.description && <p className="ach-desc">{ach.description}</p>}
                      <div className="ach-footer">
                        <span className="ach-level-badge" style={{ background: lvl.bg, color: lvl.color }}>{lvl.label}</span>
                        {ach.date && <span className="ach-date">{new Date(ach.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
