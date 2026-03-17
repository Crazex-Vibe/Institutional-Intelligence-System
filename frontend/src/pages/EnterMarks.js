import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { DEPARTMENTS } from '../utils/departments';
import './EnterMarks.css';

const CIA_TYPES = ['CIA-1', 'CIA-2', 'MODEL'];

const DEFAULT_SUBJECTS = [
  'Data Structures', 'Algorithms', 'DBMS', 'Networks', 'OS',
  'Software Engineering', 'Web Technology', 'Mathematics',
  'Deep Learning', 'Machine Learning', 'NLP', 'Computer Vision',
  'Big Data Analytics', 'Cloud Computing', 'IoT', 'Project',
];

export default function EnterMarks() {
  const { user } = useAuth();
  const sp = user?.staffProfile;

  // Use staff's own subjects if available, else show defaults
  const staffSubjects = sp?.subjects?.length > 0 ? sp.subjects : DEFAULT_SUBJECTS;

  const [config, setConfig] = useState({
    department: sp?.department || '',
    semester: '',
    section: 'A',
    subject: '',
    customSubject: '',
    assessmentType: 'CIA-1',
    maxMarks: '50',
    conductedDate: new Date().toISOString().split('T')[0],
    academicYear: '2025-2026',
  });

  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [absents, setAbsents] = useState({});
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [activeView, setActiveView] = useState('enter');

  // Assignment state
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '', subject: '', department: sp?.department || '',
    semester: '', section: 'A', dueDate: '', maxMarks: '10', description: '',
  });
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignmentMsg, setAssignmentMsg] = useState('');

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    setLoadingRecords(true);
    try {
      const res = await API.get('/cia/staff/records');
      setRecords(res.data.records || []);
    } catch (err) { console.error(err); }
    finally { setLoadingRecords(false); }
  };

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const res = await API.get('/cia/staff/assignments');
      setAssignments(res.data.assignments || []);
    } catch (err) { console.error(err); }
    finally { setLoadingAssignments(false); }
  };

  const handleTabChange = (view) => {
    setActiveView(view);
    if (view === 'records') fetchRecords();
    if (view === 'assignments') fetchAssignments();
  };

  const getFinalSubject = () =>
    config.subject === '__custom__' ? config.customSubject : config.subject;

  const loadStudents = async () => {
    const subject = getFinalSubject();
    if (!subject || !config.assessmentType) { setError('Select subject and assessment type.'); return; }
    if (!config.department || !config.semester) { setError('Select department and semester.'); return; }
    setLoading(true); setError('');
    try {
      const res = await API.get('/cia/entry', {
        params: {
          department: config.department,
          semester: Number(config.semester),
          section: config.section,
          subject,
          type: config.assessmentType,
        },
      });
      const studentList = res.data.students || [];
      if (studentList.length === 0) {
        setError(`No students found in ${config.department} Sem ${config.semester} Sec ${config.section}. Add students via User Management first.`);
        setLoading(false);
        return;
      }
      setStudents(studentList);
      if (res.data.cia) {
        setIsPublished(res.data.cia.isPublished);
      } else {
        setIsPublished(false);
      }
      const initMarks = {}, initAbsents = {}, initRemarks = {};
      studentList.forEach(s => {
        initMarks[s.studentId] = s.marksObtained ?? 0;
        initAbsents[s.studentId] = s.isAbsent ?? false;
        initRemarks[s.studentId] = s.remarks ?? '';
      });
      setMarks(initMarks); setAbsents(initAbsents); setRemarks(initRemarks);
      setStep(2);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load students'); }
    finally { setLoading(false); }
  };

  const handleMarkChange = (id, val) => {
    const max = Number(config.maxMarks);
    const v = Math.min(Math.max(0, Number(val)), max);
    setMarks(prev => ({ ...prev, [id]: v }));
  };

  const handleAbsent = (id) => {
    setAbsents(prev => ({ ...prev, [id]: !prev[id] }));
    if (!absents[id]) setMarks(prev => ({ ...prev, [id]: 0 }));
  };

  const handleSave = async (publish = false) => {
    setSaving(true); setMessage(''); setError('');
    const subject = getFinalSubject();
    try {
      const studentMarks = students.map(s => ({
        studentId: s.studentId,
        marksObtained: absents[s.studentId] ? 0 : Number(marks[s.studentId] || 0),
        maxMarks: Number(config.maxMarks),
        isAbsent: absents[s.studentId] || false,
        remarks: remarks[s.studentId] || '',
      }));

      const res = await API.post('/cia/save', {
        ...config,
        subject,
        semester: Number(config.semester),
        maxMarks: Number(config.maxMarks),
        studentMarks,
      });

      setStats(res.data.stats);

      if (publish) {
        const allCIA = await API.get('/cia/staff/records');
        const saved = allCIA.data.records.find(
          r => r.subject === subject && r.assessmentType === config.assessmentType
        );
        if (saved) {
          await API.put(`/cia/${saved._id}/publish`);
          setIsPublished(true);
        }
      }

      setMessage(publish ? '✅ Marks saved and published to students!' : '✅ Marks saved as draft!');
      await fetchRecords();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleCreateAssignment = async () => {
    if (!assignmentForm.title || !assignmentForm.subject || !assignmentForm.department || !assignmentForm.semester) {
      setAssignmentMsg('⚠️ Title, subject, department and semester are required.');
      return;
    }
    setSavingAssignment(true); setAssignmentMsg('');
    try {
      await API.post('/cia/assignment/create', {
        ...assignmentForm,
        semester: Number(assignmentForm.semester),
        maxMarks: Number(assignmentForm.maxMarks),
      });
      setAssignmentMsg('✅ Assignment created successfully!');
      setShowAssignmentForm(false);
      setAssignmentForm({
        title: '', subject: '', department: sp?.department || '',
        semester: '', section: 'A', dueDate: '', maxMarks: '10', description: '',
      });
      fetchAssignments();
    } catch (err) {
      setAssignmentMsg(err.response?.data?.message || '⚠️ Failed to create assignment');
    } finally {
      setSavingAssignment(false);
    }
  };

  const presentCount = students.filter(s => !absents[s.studentId]).length;
  const maxM = Number(config.maxMarks);
  const avgMark = presentCount > 0
    ? (students.filter(s => !absents[s.studentId]).reduce((sum, s) => sum + Number(marks[s.studentId] || 0), 0) / presentCount).toFixed(1)
    : 0;

  return (
    <DashboardLayout>
      <div className="marks-root">
        <div className="marks-top">
          <div>
            <h1 className="marks-title">Internal Assessment</h1>
            <p className="marks-sub">Enter CIA marks and manage assignments</p>
          </div>
          <div className="view-toggle">
            <button className={activeView === 'enter' ? 'active' : ''} onClick={() => handleTabChange('enter')}>📝 Enter Marks</button>
            <button className={activeView === 'records' ? 'active' : ''} onClick={() => handleTabChange('records')}>📋 My Records</button>
            <button className={activeView === 'assignments' ? 'active' : ''} onClick={() => handleTabChange('assignments')}>📁 Assignments</button>
          </div>
        </div>

        {/* ── Enter Marks View ── */}
        {activeView === 'enter' && (
          <>
            <div className="marks-card">
              <h3 className="marks-card-title">⚙️ Assessment Setup</h3>
              <div className="marks-setup-grid">

                {/* Department dropdown */}
                <div className="fg">
                  <label>Department</label>
                  <select value={config.department} onChange={e => setConfig({...config, department: e.target.value})}>
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="fg">
                  <label>Semester</label>
                  <select value={config.semester} onChange={e => setConfig({...config, semester: e.target.value})}>
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>

                <div className="fg">
                  <label>Section</label>
                  <select value={config.section} onChange={e => setConfig({...config, section: e.target.value})}>
                    {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>

                {/* Subject - from staff profile or custom */}
                <div className="fg">
                  <label>Subject</label>
                  <select value={config.subject} onChange={e => setConfig({...config, subject: e.target.value})}>
                    <option value="">Select Subject</option>
                    {staffSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="__custom__">+ Type custom subject...</option>
                  </select>
                  {config.subject === '__custom__' && (
                    <input
                      type="text"
                      placeholder="Type subject name..."
                      value={config.customSubject}
                      onChange={e => setConfig({...config, customSubject: e.target.value})}
                      style={{ marginTop: 8, padding: '9px 12px', border: '2px solid #2563eb', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                    />
                  )}
                </div>

                <div className="fg">
                  <label>Assessment Type</label>
                  <select value={config.assessmentType} onChange={e => setConfig({...config, assessmentType: e.target.value})}>
                    {CIA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="fg">
                  <label>Max Marks</label>
                  <select value={config.maxMarks} onChange={e => setConfig({...config, maxMarks: e.target.value})}>
                    {['25', '50', '100'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="fg">
                  <label>Conducted Date</label>
                  <input type="date" value={config.conductedDate} onChange={e => setConfig({...config, conductedDate: e.target.value})} />
                </div>

                <div className="fg">
                  <label>Academic Year</label>
                  <select value={config.academicYear} onChange={e => setConfig({...config, academicYear: e.target.value})}>
                    {['2023-2024', '2024-2025', '2025-2026', '2026-2027'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

              </div>
              {error && step === 1 && <div className="marks-error">⚠️ {error}</div>}
              {step === 1 && (
                <button className="marks-btn-primary" onClick={loadStudents} disabled={loading}>
                  {loading ? 'Loading...' : 'Load Students →'}
                </button>
              )}
              {step === 2 && (
                <button className="marks-btn-secondary" onClick={() => { setStep(1); setStudents([]); setStats(null); setMessage(''); setError(''); }}>
                  ← Change Setup
                </button>
              )}
            </div>

            {step === 2 && (
              <div className="marks-card">
                <div className="marks-header-row">
                  <div>
                    <h3 className="marks-card-title" style={{ margin: 0 }}>
                      {config.assessmentType} — {getFinalSubject()}
                    </h3>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                      {[
                        { label: `${config.department}`, bg: '#f1f5f9', color: '#475569' },
                        { label: `Sem ${config.semester} | Sec ${config.section}`, bg: '#eff6ff', color: '#1d4ed8' },
                        { label: `Max: ${config.maxMarks}`, bg: '#f3e8ff', color: '#7c3aed' },
                        { label: `Present: ${presentCount}/${students.length}`, bg: '#dcfce7', color: '#15803d' },
                        { label: `Class Avg: ${avgMark}`, bg: '#fef9c3', color: '#a16207' },
                      ].map(chip => (
                        <span key={chip.label} className="chip" style={{ background: chip.bg, color: chip.color }}>{chip.label}</span>
                      ))}
                    </div>
                  </div>
                  {isPublished && <span className="published-badge">✅ Published</span>}
                </div>

                <div className="marks-table-wrap">
                  <table className="marks-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Roll No</th><th>Student Name</th>
                        <th>Marks / {config.maxMarks}</th><th>Absent</th><th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => {
                        const pct = absents[s.studentId] ? null : Math.round((marks[s.studentId] / maxM) * 100);
                        const markColor = pct === null ? '#94a3b8' : pct >= 60 ? '#15803d' : pct >= 40 ? '#d97706' : '#dc2626';
                        return (
                          <tr key={s.studentId} className={absents[s.studentId] ? 'absent-row' : ''}>
                            <td>{i + 1}</td>
                            <td className="roll-cell">{s.rollNumber}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="s-avatar">{s.name.charAt(0)}</div>
                                {s.name}
                              </div>
                            </td>
                            <td>
                              {absents[s.studentId] ? (
                                <span style={{ color: '#94a3b8', fontSize: 13 }}>Absent</span>
                              ) : (
                                <div className="marks-input-wrap">
                                  <input type="number" min="0" max={config.maxMarks}
                                    value={marks[s.studentId] ?? 0}
                                    onChange={e => handleMarkChange(s.studentId, e.target.value)}
                                    className="marks-input" />
                                  <span className="marks-pct" style={{ color: markColor }}>{pct}%</span>
                                </div>
                              )}
                            </td>
                            <td>
                              <button className={`absent-toggle ${absents[s.studentId] ? 'is-absent' : ''}`} onClick={() => handleAbsent(s.studentId)}>
                                {absents[s.studentId] ? '❌ Absent' : '✅ Present'}
                              </button>
                            </td>
                            <td>
                              <input type="text" placeholder="Optional..."
                                value={remarks[s.studentId] || ''}
                                onChange={e => setRemarks(prev => ({ ...prev, [s.studentId]: e.target.value }))}
                                className="remarks-input" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {stats && (
                  <div className="stats-row">
                    {[
                      { label: 'Class Average', val: stats.classAverage, color: '#2563eb' },
                      { label: 'Highest Mark', val: stats.highestMark, color: '#15803d' },
                      { label: 'Lowest Mark', val: stats.lowestMark, color: '#dc2626' },
                      { label: 'Pass Count', val: `${stats.passCount}/${stats.totalStudents}`, color: '#7c3aed' },
                    ].map(s => (
                      <div key={s.label} className="stat-pill">
                        <span style={{ color: s.color, fontWeight: 700 }}>{s.val}</span>
                        <label>{s.label}</label>
                      </div>
                    ))}
                  </div>
                )}

                {message && <div className="marks-success">{message}</div>}
                {error && step === 2 && <div className="marks-error">⚠️ {error}</div>}

                <div className="marks-actions">
                  <button className="marks-btn-secondary" onClick={() => handleSave(false)} disabled={saving}>💾 Save Draft</button>
                  <button className="marks-btn-primary" onClick={() => handleSave(true)} disabled={saving || isPublished}>
                    {isPublished ? '✅ Already Published' : saving ? 'Publishing...' : '📢 Save & Publish to Students'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── My Records View ── */}
        {activeView === 'records' && (
          <div className="marks-card">
            <h3 className="marks-card-title">📋 My CIA Records</h3>
            {loadingRecords ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
            ) : records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
                <p>No CIA records yet. Enter marks to get started.</p>
              </div>
            ) : (
              <table className="marks-table">
                <thead>
                  <tr><th>Subject</th><th>Type</th><th>Dept</th><th>Class</th><th>Avg</th><th>Highest</th><th>Pass</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{r.subject}</td>
                      <td><span className="cia-type-badge">{r.assessmentType}</span></td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{r.department}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>Sem {r.semester} | Sec {r.section}</td>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{r.classAverage}/{r.maxMarks}</td>
                      <td style={{ fontWeight: 700, color: '#15803d' }}>{r.highestMark}</td>
                      <td>{r.passCount} students</td>
                      <td>
                        <span className="grade-badge" style={{ background: r.isPublished ? '#dcfce7' : '#fef3c7', color: r.isPublished ? '#15803d' : '#d97706' }}>
                          {r.isPublished ? '✅ Published' : '📝 Draft'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Assignments View ── */}
        {activeView === 'assignments' && (
          <div className="marks-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 className="marks-card-title" style={{ margin: 0 }}>📁 Assignments</h3>
              <button className="marks-btn-primary" onClick={() => setShowAssignmentForm(!showAssignmentForm)}>
                {showAssignmentForm ? '✕ Cancel' : '+ Create Assignment'}
              </button>
            </div>

            {assignmentMsg && (
              <div className={assignmentMsg.startsWith('✅') ? 'marks-success' : 'marks-error'} style={{ marginBottom: 16 }}>
                {assignmentMsg}
              </div>
            )}

            {/* Create assignment form */}
            {showAssignmentForm && (
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 18, marginBottom: 20, border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontFamily: 'Sora', fontSize: 14, color: '#1e293b', marginBottom: 14 }}>New Assignment</h4>
                <div className="marks-setup-grid">
                  <div className="fg">
                    <label>Title *</label>
                    <input value={assignmentForm.title} onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} placeholder="e.g. Unit 1 Assignment" />
                  </div>
                  <div className="fg">
                    <label>Subject *</label>
                    <select value={assignmentForm.subject} onChange={e => setAssignmentForm({...assignmentForm, subject: e.target.value})}>
                      <option value="">Select Subject</option>
                      {staffSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="fg">
                    <label>Department *</label>
                    <select value={assignmentForm.department} onChange={e => setAssignmentForm({...assignmentForm, department: e.target.value})}>
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="fg">
                    <label>Semester *</label>
                    <select value={assignmentForm.semester} onChange={e => setAssignmentForm({...assignmentForm, semester: e.target.value})}>
                      <option value="">Select</option>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                  <div className="fg">
                    <label>Section</label>
                    <select value={assignmentForm.section} onChange={e => setAssignmentForm({...assignmentForm, section: e.target.value})}>
                      {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                  <div className="fg">
                    <label>Due Date</label>
                    <input type="date" value={assignmentForm.dueDate} onChange={e => setAssignmentForm({...assignmentForm, dueDate: e.target.value})} />
                  </div>
                  <div className="fg">
                    <label>Max Marks</label>
                    <select value={assignmentForm.maxMarks} onChange={e => setAssignmentForm({...assignmentForm, maxMarks: e.target.value})}>
                      {['5', '10', '15', '20', '25'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="fg" style={{ gridColumn: 'span 2' }}>
                    <label>Description</label>
                    <input value={assignmentForm.description} onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})} placeholder="Optional description for students..." />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button className="marks-btn-primary" onClick={handleCreateAssignment} disabled={savingAssignment}>
                    {savingAssignment ? 'Creating...' : '✅ Create Assignment'}
                  </button>
                  <button className="marks-btn-secondary" onClick={() => setShowAssignmentForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Assignments list */}
            {loadingAssignments ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
            ) : assignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📁</div>
                <p>No assignments created yet. Click <strong>+ Create Assignment</strong> to get started.</p>
              </div>
            ) : (
              <table className="marks-table">
                <thead>
                  <tr><th>Title</th><th>Subject</th><th>Class</th><th>Due Date</th><th>Max Marks</th><th>Submissions</th></tr>
                </thead>
                <tbody>
                  {assignments.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>{a.title}</td>
                      <td style={{ color: '#64748b' }}>{a.subject}</td>
                      <td style={{ fontSize: 12, color: '#64748b' }}>{a.department} | Sem {a.semester} Sec {a.section}</td>
                      <td style={{ fontSize: 12, color: a.dueDate && new Date(a.dueDate) < new Date() ? '#dc2626' : '#64748b' }}>
                        {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>{a.maxMarks}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#eff6ff', color: '#2563eb' }}>
                          {a.submissions?.length || 0} submitted
                        </span>
                      </td>
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