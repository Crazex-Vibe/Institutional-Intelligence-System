import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import './MarkAttendance.css';

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8];
const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: '#16a34a', bg: '#dcfce7' },
  { value: 'absent', label: 'Absent', color: '#dc2626', bg: '#fef2f2' },
  { value: 'od', label: 'OD', color: '#d97706', bg: '#fef3c7' },
  { value: 'leave', label: 'Leave', color: '#7c3aed', bg: '#f3e8ff' },
];

export default function MarkAttendance() {
  const { user } = useAuth();
  const sp = user?.staffProfile;

  const [step, setStep] = useState(1); // 1=select session, 2=mark attendance
  const [session, setSession] = useState({
    date: new Date().toISOString().split('T')[0],
    department: sp?.department || '',
    semester: '',
    section: '',
    hour: '',
    subject: '',
  });

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: status }
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const subjects = sp?.subjects || [];

  const fetchStudents = async () => {
    if (!session.department || !session.semester || !session.section) return;
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/attendance/class-students', {
        params: { department: session.department, semester: session.semester, section: session.section },
      });
      const studentList = res.data.students;
      setStudents(studentList);
      // Default all to present
      const defaults = {};
      studentList.forEach(s => { defaults[s._id] = 'present'; });
      setAttendance(defaults);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s._id] = status; });
    setAttendance(updated);
  };

  const handleSubmit = async () => {
    if (!session.hour || !session.subject) {
      setError('Please select hour and subject before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const records = students.map(s => ({ studentId: s._id, status: attendance[s._id] || 'absent' }));
      await API.post('/attendance/mark', {
        date: session.date,
        department: session.department,
        semester: session.semester,
        section: session.section,
        hour: Number(session.hour),
        subject: session.subject,
        records,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setStudents([]);
    setAttendance({});
    setSubmitted(false);
    setError('');
    setSession(prev => ({ ...prev, hour: '', subject: '' }));
  };

  const counts = {
    present: Object.values(attendance).filter(v => v === 'present').length,
    absent: Object.values(attendance).filter(v => v === 'absent').length,
    od: Object.values(attendance).filter(v => v === 'od').length,
    leave: Object.values(attendance).filter(v => v === 'leave').length,
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="success-screen">
          <div className="success-icon">✅</div>
          <h2>Attendance Submitted!</h2>
          <p>Hour {session.hour} — {session.subject}</p>
          <div className="success-stats">
            {STATUS_OPTIONS.map(s => (
              <div key={s.value} className="success-stat" style={{ background: s.bg, color: s.color }}>
                <span className="ss-count">{counts[s.value]}</span>
                <span className="ss-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="success-actions">
            <button className="btn-primary" onClick={resetForm}>Mark Next Hour</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mark-attendance">
        {/* Header */}
        <div className="ma-header">
          <div>
            <h2 className="ma-title">Mark Attendance</h2>
            <p className="ma-subtitle">Record hour-wise student attendance</p>
          </div>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <span className="step-num">1</span>
              <span className="step-label">Session</span>
            </div>
            <div className="step-line" />
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <span className="step-num">2</span>
              <span className="step-label">Mark</span>
            </div>
          </div>
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* Step 1: Session setup */}
        {step === 1 && (
          <div className="session-card">
            <h3 className="card-title">📋 Setup Session</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={session.date}
                  onChange={e => setSession({ ...session, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input type="text" placeholder="e.g. Computer Science"
                  value={session.department}
                  onChange={e => setSession({ ...session, department: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select value={session.semester}
                  onChange={e => setSession({ ...session, semester: e.target.value })}>
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Section</label>
                <select value={session.section}
                  onChange={e => setSession({ ...session, section: e.target.value })}>
                  <option value="">Select</option>
                  {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>
            <button className="btn-primary" onClick={fetchStudents} disabled={loading || !session.department || !session.semester || !session.section}>
              {loading ? 'Loading Students...' : 'Load Students →'}
            </button>
          </div>
        )}

        {/* Step 2: Mark attendance */}
        {step === 2 && (
          <div className="marking-section">
            {/* Hour & Subject selector */}
            <div className="session-card" style={{ marginBottom: 20 }}>
              <h3 className="card-title">🕐 Select Hour & Subject</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Hour / Period</label>
                  <div className="hour-selector">
                    {HOURS.map(h => (
                      <button key={h}
                        className={`hour-btn ${session.hour == h ? 'active' : ''}`}
                        onClick={() => setSession({ ...session, hour: h })}>
                        H{h}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <select value={session.subject}
                    onChange={e => setSession({ ...session, subject: e.target.value })}>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="stats-bar">
              {STATUS_OPTIONS.map(s => (
                <div key={s.value} className="stat-pill" style={{ background: s.bg, color: s.color }}>
                  <span className="sp-count">{counts[s.value]}</span>
                  <span className="sp-label">{s.label}</span>
                </div>
              ))}
              <div className="mark-all-btns">
                <span style={{ fontSize: 12, color: '#94a3b8', marginRight: 6 }}>Mark all:</span>
                <button className="mini-btn present" onClick={() => markAll('present')}>Present</button>
                <button className="mini-btn absent" onClick={() => markAll('absent')}>Absent</button>
              </div>
            </div>

            {/* Student list */}
            <div className="student-list">
              {students.map((student, idx) => {
                const currentStatus = attendance[student._id] || 'absent';
                const statusInfo = STATUS_OPTIONS.find(s => s.value === currentStatus);
                return (
                  <div key={student._id} className="student-row"
                    style={{ borderLeft: `4px solid ${statusInfo.color}` }}>
                    <div className="student-info">
                      <span className="student-num">{idx + 1}</span>
                      <div className="student-avatar" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="student-name">{student.name}</div>
                        <div className="student-roll">{student.studentProfile?.rollNumber}</div>
                      </div>
                    </div>
                    <div className="status-buttons">
                      {STATUS_OPTIONS.map(s => (
                        <button key={s.value}
                          className={`status-btn ${currentStatus === s.value ? 'selected' : ''}`}
                          style={currentStatus === s.value ? { background: s.bg, color: s.color, borderColor: s.color } : {}}
                          onClick={() => toggleStatus(student._id, s.value)}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="ma-actions">
              <button className="btn-secondary" onClick={resetForm}>← Back</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={submitting || !session.hour || !session.subject}>
                {submitting ? 'Submitting...' : `Submit Attendance (${students.length} students)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
