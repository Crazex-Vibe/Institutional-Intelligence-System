import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';
import './StudentMarks.css';

const TYPE_COLOR = {
  'CIA-1': { bg: '#dbeafe', color: '#1d4ed8' },
  'CIA-2': { bg: '#f3e8ff', color: '#7c3aed' },
  'MODEL': { bg: '#fef9c3', color: '#a16207' },
};

export default function StudentMarks() {
  const [marksData, setMarksData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('marks');
  const [uploading, setUploading] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState({});
  const fileRefs = useRef({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [marksRes, assignRes] = await Promise.all([
        API.get('/cia/my-marks'),
        API.get('/cia/assignments/my'),
      ]);
      setMarksData(marksRes.data);
      setAssignments(assignRes.data.assignments);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFileUpload = async (assignmentId, file) => {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) { alert('File size must be under 5MB'); return; }

    setUploading(prev => ({ ...prev, [assignmentId]: true }));
    try {
      // Convert to base64
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      await API.post('/cia/assignment/submit', {
        assignmentId,
        fileUrl: base64,
        fileName: file.name,
        fileType: file.type,
      });

      setUploadSuccess(prev => ({ ...prev, [assignmentId]: true }));
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const getMarkColor = (pct) => {
    if (pct >= 80) return { bg: '#dcfce7', color: '#15803d', label: 'Excellent' };
    if (pct >= 60) return { bg: '#dbeafe', color: '#1d4ed8', label: 'Good' };
    if (pct >= 40) return { bg: '#fef9c3', color: '#a16207', label: 'Average' };
    return { bg: '#fef2f2', color: '#dc2626', label: 'Below Average' };
  };

  if (loading) return (
    <DashboardLayout>
      <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>⏳ Loading marks...</div>
    </DashboardLayout>
  );

  const subjects = Object.keys(marksData?.bySubject || {});

  return (
    <DashboardLayout>
      <div className="std-marks-root">
        <div className="std-marks-header">
          <h1>Internal Assessment</h1>
          <p>Your CIA marks and assignment submissions</p>
        </div>

        {/* Tabs */}
        <div className="std-marks-tabs">
          <button className={activeTab === 'marks' ? 'active' : ''} onClick={() => setActiveTab('marks')}>📊 CIA Marks</button>
          <button className={activeTab === 'assignments' ? 'active' : ''} onClick={() => setActiveTab('assignments')}>📁 Assignments ({assignments.length})</button>
        </div>

        {/* ── CIA Marks Tab ── */}
        {activeTab === 'marks' && (
          <div>
            {marksData?.marks?.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 48 }}>📝</div>
                <p>No CIA marks published yet. Check back after your assessments.</p>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="marks-summary-grid">
                  {['CIA-1', 'CIA-2', 'MODEL'].map(type => {
                    const typeMarks = marksData?.marks?.filter(m => m.assessmentType === type && !m.isAbsent && m.marksObtained !== null);
                    if (typeMarks?.length === 0) return null;
                    const avg = typeMarks?.length > 0
                      ? (typeMarks.reduce((s, m) => s + m.percentage, 0) / typeMarks.length).toFixed(0)
                      : '—';
                    const tc = TYPE_COLOR[type];
                    return (
                      <div key={type} className="type-summary-card" style={{ borderTop: `4px solid ${tc.color}` }}>
                        <span className="type-badge" style={{ background: tc.bg, color: tc.color }}>{type}</span>
                        <div className="type-avg">{avg}%</div>
                        <div className="type-label">Average Score</div>
                        <div className="type-count">{typeMarks?.length} subject{typeMarks?.length !== 1 ? 's' : ''}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Subject-wise marks */}
                {subjects.map(subject => (
                  <div key={subject} className="subject-marks-card">
                    <div className="smk-header">
                      <h3>{subject}</h3>
                    </div>
                    <div className="smk-assessments">
                      {marksData?.bySubject[subject]?.map((m, i) => {
                        const tc = TYPE_COLOR[m.assessmentType] || TYPE_COLOR['CIA-1'];
                        const mc = m.isAbsent ? null : getMarkColor(m.percentage);
                        return (
                          <div key={i} className="assessment-row">
                            <div className="ar-left">
                              <span className="ar-type" style={{ background: tc.bg, color: tc.color }}>{m.assessmentType}</span>
                              <div>
                                <div className="ar-staff">{m.staffName}</div>
                                {m.conductedDate && <div className="ar-date">{new Date(m.conductedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                              </div>
                            </div>

                            {m.isAbsent ? (
                              <div className="ar-absent">Absent</div>
                            ) : m.marksObtained === null ? (
                              <div className="ar-pending">Pending</div>
                            ) : (
                              <div className="ar-right">
                                <div className="ar-marks-display">
                                  <span className="ar-marks-val">{m.marksObtained}</span>
                                  <span className="ar-marks-max">/{m.maxMarks}</span>
                                </div>
                                <span className="ar-pct-badge" style={{ background: mc?.bg, color: mc?.color }}>
                                  {m.percentage}% — {mc?.label}
                                </span>
                                <div className="ar-compare">
                                  Class avg: <strong>{m.classAverage}</strong>
                                  {m.marksObtained > m.classAverage
                                    ? <span style={{ color: '#15803d' }}> ↑ Above avg</span>
                                    : <span style={{ color: '#dc2626' }}> ↓ Below avg</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Assignments Tab ── */}
        {activeTab === 'assignments' && (
          <div>
            {assignments.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 48 }}>📁</div>
                <p>No assignments posted yet.</p>
              </div>
            ) : (
              <div className="assignments-list">
                {assignments.map(a => {
                  const isSubmitted = !!a.submission;
                  const isGraded = a.submission?.status === 'graded';
                  const isLate = a.submission?.status === 'late';
                  const isOverdue = a.isOverdue;

                  return (
                    <div key={a._id} className={`assignment-card ${isOverdue ? 'overdue' : ''} ${isSubmitted ? 'submitted' : ''}`}>
                      <div className="asgn-top">
                        <div className="asgn-info">
                          <h3 className="asgn-title">{a.title}</h3>
                          <div className="asgn-meta">
                            <span className="asgn-subject">📚 {a.subject}</span>
                            {a.staffName && <span>👩‍🏫 {a.staffName}</span>}
                            {a.dueDate && (
                              <span style={{ color: isOverdue ? '#dc2626' : '#64748b' }}>
                                📅 Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                {isOverdue && ' — Overdue!'}
                              </span>
                            )}
                            <span>🏆 Max: {a.maxMarks} marks</span>
                          </div>
                          {a.description && <p className="asgn-desc">{a.description}</p>}
                        </div>

                        {/* Status badge */}
                        <div className="asgn-status">
                          {isGraded ? (
                            <div className="status-badge graded">
                              ✅ Graded
                              <span className="grade-mark">{a.submission?.marksAwarded}/{a.maxMarks}</span>
                            </div>
                          ) : isLate ? (
                            <div className="status-badge late">⏰ Submitted Late</div>
                          ) : isSubmitted ? (
                            <div className="status-badge submitted-ok">✅ Submitted</div>
                          ) : isOverdue ? (
                            <div className="status-badge overdue-badge">❌ Overdue</div>
                          ) : (
                            <div className="status-badge pending-badge">⏳ Pending</div>
                          )}
                        </div>
                      </div>

                      {/* Submission info */}
                      {isSubmitted && a.submission && (
                        <div className="submission-info">
                          <span>📎 {a.submission.fileName}</span>
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>
                            Submitted: {new Date(a.submission.submittedAt).toLocaleDateString('en-IN')}
                          </span>
                          {a.submission.feedback && <span style={{ color: '#64748b', fontSize: 12 }}>💬 {a.submission.feedback}</span>}
                        </div>
                      )}

                      {/* Upload section */}
                      {!isGraded && (
                        <div className="upload-section">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            style={{ display: 'none' }}
                            ref={el => fileRefs.current[a._id] = el}
                            onChange={e => handleFileUpload(a._id, e.target.files[0])}
                          />
                          <button
                            className={`upload-btn ${isSubmitted ? 'reupload' : ''}`}
                            onClick={() => fileRefs.current[a._id]?.click()}
                            disabled={uploading[a._id]}
                          >
                            {uploading[a._id] ? '⏳ Uploading...' :
                              isSubmitted ? '🔄 Re-upload' : '📤 Upload Assignment'}
                          </button>
                          <span className="upload-hint">Accepts images (JPG, PNG) or PDF • Max 5MB</span>
                          {uploadSuccess[a._id] && <span style={{ color: '#15803d', fontSize: 13 }}>✅ Uploaded!</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
