import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';
import './StudentsList.css';

const GRADE_COLORS = {
  O: { bg: '#dcfce7', color: '#15803d' }, 'A+': { bg: '#dbeafe', color: '#1d4ed8' },
  A: { bg: '#eff6ff', color: '#2563eb' }, 'B+': { bg: '#fef9c3', color: '#a16207' },
  B: { bg: '#fef3c7', color: '#b45309' }, C: { bg: '#fff7ed', color: '#c2410c' },
  U: { bg: '#fef2f2', color: '#dc2626' }, RA: { bg: '#fef2f2', color: '#dc2626' },
  '--': { bg: '#f1f5f9', color: '#94a3b8' },
};

const TABS = ['Overview', 'Results', 'Fees', 'Achievements'];

export default function ManagementStudents() {
  const [filters, setFilters] = useState({ department: 'Computer Science', semester: '', section: '' });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [studentUser, setStudentUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [expandedSem, setExpandedSem] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.semester) params.semester = filters.semester;
      if (filters.section) params.section = filters.section;
      const res = await API.get('/profile/students', { params });
      setStudents(res.data.students);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const viewProfile = async (student) => {
    setSelected(student);
    setProfile(null);
    setStudentUser(null);
    setActiveTab('Overview');
    setExpandedSem(null);
    setLoadingProfile(true);
    try {
      const res = await API.get(`/profile/student/${student._id}`);
      setProfile(res.data.profile);
      setStudentUser(res.data.student);
    } catch (err) { console.error(err); }
    finally { setLoadingProfile(false); }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentProfile?.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentProfile?.section?.toLowerCase().includes(search.toLowerCase())
  );

  const feeColor = { paid: '#15803d', pending: '#dc2626', partial: '#d97706' };
  const feeBg = { paid: '#dcfce7', pending: '#fef2f2', partial: '#fef3c7' };
  const publishedSems = profile?.semesters?.filter(s => s.isResultPublished) || [];

  return (
    <DashboardLayout>
      <div className="students-root">
        <div className="students-header">
          <div>
            <h1 className="students-title">Student Management</h1>
            <p className="students-sub">View and manage all student academic profiles</p>
          </div>
          <div className="total-badge">{students.length} Total Students</div>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-row">
            <div className="filter-group">
              <label>Department</label>
              <input value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})} placeholder="All departments" />
            </div>
            <div className="filter-group">
              <label>Semester</label>
              <select value={filters.semester} onChange={e => setFilters({...filters, semester: e.target.value})}>
                <option value="">All Semesters</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Section</label>
              <select value={filters.section} onChange={e => setFilters({...filters, section: e.target.value})}>
                <option value="">All Sections</option>
                {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <button className="filter-btn" onClick={fetchStudents} disabled={loading}>
              {loading ? 'Loading...' : '🔍 Search'}
            </button>
          </div>
          <input
            className="search-input"
            placeholder="🔎 Search by name, roll number or section..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="students-layout">
          {/* Left: student list */}
          <div className="students-list-panel">
            <div className="list-count">{filtered.length} student{filtered.length !== 1 ? 's' : ''} found</div>
            {loading ? (
              <div className="list-loading">⏳ Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="list-empty">
                <div style={{ fontSize: 40, marginBottom: 10 }}>🎓</div>
                <p>No students found.</p>
              </div>
            ) : (
              filtered.map(s => (
                <div
                  key={s._id}
                  className={`student-item ${selected?._id === s._id ? 'active' : ''}`}
                  onClick={() => viewProfile(s)}
                >
                  <div className="si-avatar">{s.name.charAt(0)}</div>
                  <div className="si-info">
                    <div className="si-name">{s.name}</div>
                    <div className="si-roll">
                      {s.studentProfile?.rollNumber} • Sem {s.studentProfile?.semester} | Sec {s.studentProfile?.section}
                    </div>
                  </div>
                  <div className="si-cgpa">
                    <span>{s.studentProfile?.cgpa?.toFixed(1) || '—'}</span>
                    <label>CGPA</label>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: full profile */}
          <div className="overview-panel">
            {!selected ? (
              <div className="overview-empty">
                <div style={{ fontSize: 48, marginBottom: 12 }}>👈</div>
                <p>Select a student to view their full profile</p>
              </div>
            ) : loadingProfile ? (
              <div className="overview-empty">⏳ Loading profile...</div>
            ) : profile && studentUser ? (
              <div className="overview-content">
                {/* Hero */}
                <div className="ov-hero">
                  <div className="ov-avatar">{studentUser.name?.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <h2 className="ov-name">{studentUser.name}</h2>
                    <div className="ov-chips">
                      {[
                        studentUser.studentProfile?.rollNumber,
                        studentUser.studentProfile?.department,
                        `Sem ${studentUser.studentProfile?.semester} | Sec ${studentUser.studentProfile?.section}`,
                        studentUser.studentProfile?.batch,
                      ].filter(Boolean).map((c, i) => <span key={i} className="ov-chip">{c}</span>)}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      {studentUser.studentProfile?.umisId && <span className="id-badge umis">UMIS: {studentUser.studentProfile.umisId}</span>}
                      {studentUser.studentProfile?.emisId && <span className="id-badge emis">EMIS: {studentUser.studentProfile.emisId}</span>}
                    </div>
                  </div>
                  <div className="ov-hero-stats">
                    <div className="ov-hs"><span>{profile.cgpa?.toFixed(2) || '—'}</span><label>CGPA</label></div>
                    <div className="ov-hs"><span>{profile.totalCreditsEarned || 0}</span><label>Credits</label></div>
                    <div className="ov-hs" style={{ color: profile.totalArrears > 0 ? '#dc2626' : '#15803d' }}>
                      <span>{profile.totalArrears || 0}</span><label>Arrears</label>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="ov-tabs">
                  {TABS.map(t => (
                    <button key={t} className={`ov-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
                  ))}
                </div>

                {/* Overview tab */}
                {activeTab === 'Overview' && (
                  <div className="ov-tab-content">
                    {[
                      ['Email', studentUser.email],
                      ['Parent Email', studentUser.studentProfile?.parentEmail || '—'],
                      ['Fee Status', studentUser.studentProfile?.feeStatus || '—'],
                      ['Scholarship', profile.scholarship?.status || 'none'],
                      ['Scholarship Type', profile.scholarship?.scholarshipType || '—'],
                      ['Scholarship Amount', profile.scholarship?.amount ? `₹${profile.scholarship.amount.toLocaleString()}` : '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="ov-row">
                        <span className="ov-key">{k}</span>
                        <span className="ov-val" style={{ textTransform: 'capitalize' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Results tab */}
                {activeTab === 'Results' && (
                  <div className="ov-tab-content">
                    {profile.semesters?.length === 0 && <p style={{ color: '#94a3b8', fontSize: 14 }}>No results yet.</p>}
                    {profile.semesters?.sort((a,b) => a.semesterNumber - b.semesterNumber).map(sem => (
                      <div key={sem.semesterNumber} className="mini-sem-card">
                        <div className="mini-sem-header" onClick={() => setExpandedSem(expandedSem === sem.semesterNumber ? null : sem.semesterNumber)}>
                          <div>
                            <span className="mini-sem-title">Semester {sem.semesterNumber}</span>
                            {!sem.isResultPublished && <span className="sem-badge ongoing" style={{ marginLeft: 8 }}>In Progress</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            {sem.isResultPublished && <span style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: '#1e293b' }}>SGPA: {sem.sgpa?.toFixed(2)}</span>}
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>{expandedSem === sem.semesterNumber ? '▲' : '▼'}</span>
                          </div>
                        </div>
                        {expandedSem === sem.semesterNumber && (
                          <table className="results-table" style={{ marginTop: 10 }}>
                            <thead><tr><th>Subject</th><th>Credits</th><th>Grade</th></tr></thead>
                            <tbody>
                              {sem.subjects.map((subj, i) => {
                                const gc = GRADE_COLORS[subj.grade] || GRADE_COLORS['--'];
                                return (
                                  <tr key={i}>
                                    <td>{subj.name}</td>
                                    <td style={{ textAlign: 'center' }}>{subj.credits}</td>
                                    <td><span className="grade-badge" style={{ background: gc.bg, color: gc.color }}>{subj.grade}</span></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Fees tab */}
                {activeTab === 'Fees' && (
                  <div className="ov-tab-content">
                    {profile.fees?.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 14 }}>No fee records.</p> : (
                      profile.fees?.sort((a,b) => a.semesterNumber - b.semesterNumber).map((fee, i) => (
                        <div key={i} className="ov-row">
                          <span className="ov-key">Sem {fee.semesterNumber} ({fee.academicYear})</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>₹{fee.totalAmount?.toLocaleString()}</span>
                            <span className="grade-badge" style={{ background: feeBg[fee.status] || '#f1f5f9', color: feeColor[fee.status] || '#64748b', textTransform: 'capitalize' }}>{fee.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                    {profile.fees?.length > 0 && (
                      <div className="ov-row" style={{ marginTop: 8, borderTop: '2px solid #f1f5f9', paddingTop: 12 }}>
                        <span className="ov-key">Total Due</span>
                        <span style={{ fontWeight: 700, color: profile.fees.reduce((s,f) => s+f.dueAmount,0) > 0 ? '#dc2626' : '#15803d' }}>
                          ₹{profile.fees.reduce((s,f) => s+f.dueAmount,0).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Achievements tab */}
                {activeTab === 'Achievements' && (
                  <div className="ov-tab-content">
                    {profile.achievements?.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 14 }}>No achievements recorded.</p> : (
                      profile.achievements?.map((ach, i) => (
                        <div key={i} className="ov-row" style={{ alignItems: 'flex-start', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>🏅</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{ach.title}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{ach.issuedBy} • {ach.level}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
