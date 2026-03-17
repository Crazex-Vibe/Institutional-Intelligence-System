import { DEPARTMENTS } from './../utils/departments';
import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';
import './StaffReports.css';

export default function StaffReports() {
  const [ciaRecords, setCiaRecords] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cia');
  const [expandedCia, setExpandedCia] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [ciaRes, asgRes] = await Promise.all([
        API.get('/cia/staff/records'),
        API.get('/cia/staff/assignments'),
      ]);
      setCiaRecords(ciaRes.data.records);
      setAssignments(asgRes.data.assignments);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePublish = async (id) => {
    try {
      await API.put(`/cia/${id}/publish`);
      await fetchData();
    } catch (err) { alert('Failed to publish'); }
  };

  // Group CIA by subject
  const bySubject = {};
  for (const r of ciaRecords) {
    if (!bySubject[r.subject]) bySubject[r.subject] = [];
    bySubject[r.subject].push(r);
  }

  const TYPE_COLOR = {
    'CIA-1': { bg: '#dbeafe', color: '#1d4ed8' },
    'CIA-2': { bg: '#f3e8ff', color: '#7c3aed' },
    'MODEL': { bg: '#fef9c3', color: '#a16207' },
  };

  if (loading) return <DashboardLayout><div className="reports-loading">⏳ Loading reports...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="reports-root">
        <div className="reports-header">
          <h1>My Reports</h1>
          <p>CIA assessment records and assignment submissions</p>
        </div>

        {/* Summary pills */}
        <div className="reports-summary">
          {[
            { label: 'CIA Records', val: ciaRecords.length, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Published', val: ciaRecords.filter(r => r.isPublished).length, color: '#15803d', bg: '#dcfce7' },
            { label: 'Drafts', val: ciaRecords.filter(r => !r.isPublished).length, color: '#d97706', bg: '#fef9c3' },
            { label: 'Assignments', val: assignments.length, color: '#7c3aed', bg: '#f3e8ff' },
          ].map(s => (
            <div key={s.label} className="rsp-pill" style={{ background: s.bg, color: s.color }}>
              <span>{s.val}</span><label>{s.label}</label>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="reports-tabs">
          <button className={activeTab === 'cia' ? 'active' : ''} onClick={() => setActiveTab('cia')}>📝 CIA Records</button>
          <button className={activeTab === 'assignments' ? 'active' : ''} onClick={() => setActiveTab('assignments')}>📁 Assignments</button>
        </div>

        {/* CIA Records Tab */}
        {activeTab === 'cia' && (
          <div>
            {ciaRecords.length === 0 ? (
              <div className="reports-empty"><div style={{ fontSize: 48 }}>📝</div><p>No CIA records yet. Go to Enter Marks to add.</p></div>
            ) : Object.entries(bySubject).map(([subject, records]) => (
              <div key={subject} className="cia-subject-card">
                <div className="csc-header" onClick={() => setExpandedCia(expandedCia === subject ? null : subject)}>
                  <span className="csc-subject">{subject}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{records.length} assessment{records.length !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{expandedCia === subject ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedCia === subject && (
                  <div className="csc-body">
                    {records.map((r, i) => {
                      const tc = TYPE_COLOR[r.assessmentType] || TYPE_COLOR['CIA-1'];
                      const avgPct = Math.round((r.classAverage / r.maxMarks) * 100);
                      return (
                        <div key={i} className="cia-record-row">
                          <div className="crr-left">
                            <span className="crr-type" style={{ background: tc.bg, color: tc.color }}>{r.assessmentType}</span>
                            <div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>Sem {r.semester} | Sec {r.section}</div>
                              {r.conductedDate && <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(r.conductedDate).toLocaleDateString('en-IN')}</div>}
                            </div>
                          </div>
                          <div className="crr-stats">
                            {[
                              { label: 'Avg', val: `${r.classAverage}/${r.maxMarks}`, color: avgPct >= 60 ? '#15803d' : '#dc2626' },
                              { label: 'Highest', val: r.highestMark, color: '#15803d' },
                              { label: 'Pass', val: r.passCount, color: '#2563eb' },
                            ].map(s => (
                              <div key={s.label} className="crr-stat">
                                <span style={{ color: s.color, fontWeight: 700 }}>{s.val}</span>
                                <label>{s.label}</label>
                              </div>
                            ))}
                          </div>
                          <div>
                            {r.isPublished ? (
                              <span className="crr-badge published">✅ Published</span>
                            ) : (
                              <button className="crr-publish-btn" onClick={() => handlePublish(r._id)}>📢 Publish</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div>
            {assignments.length === 0 ? (
              <div className="reports-empty"><div style={{ fontSize: 48 }}>📁</div><p>No assignments created yet.</p></div>
            ) : assignments.map((a, i) => {
              const submittedCount = a.submissions?.length || 0;
              const gradedCount = a.submissions?.filter(s => s.status === 'graded').length || 0;
              const isOverdue = a.dueDate && new Date() > new Date(a.dueDate);
              return (
                <div key={i} className="assignment-report-card">
                  <div className="arc-top">
                    <div>
                      <div className="arc-title">{a.title}</div>
                      <div className="arc-meta">
                        📚 {a.subject} • Sem {a.semester} | Sec {a.section}
                        {a.dueDate && <span style={{ color: isOverdue ? '#dc2626' : '#64748b' }}> • Due: {new Date(a.dueDate).toLocaleDateString('en-IN')}{isOverdue ? ' (Overdue)' : ''}</span>}
                      </div>
                    </div>
                    <div className="arc-counts">
                      <div className="arc-count"><span>{submittedCount}</span><label>Submitted</label></div>
                      <div className="arc-count"><span style={{ color: '#15803d' }}>{gradedCount}</span><label>Graded</label></div>
                      <div className="arc-count"><span style={{ color: '#d97706' }}>{submittedCount - gradedCount}</span><label>Pending</label></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
