import { DEPARTMENTS } from './../utils/departments';
import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';
import './ManagementCIA.css';

const TYPE_COLOR = {
  'CIA-1': { bg: '#dbeafe', color: '#1d4ed8' },
  'CIA-2': { bg: '#f3e8ff', color: '#7c3aed' },
  'MODEL': { bg: '#fef9c3', color: '#a16207' },
};

export default function ManagementCIA() {
  const [filters, setFilters] = useState({ department: 'Computer Science', semester: '5', section: 'A' });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await API.get('/cia/summary', { params: { ...filters, semester: Number(filters.semester) } });
      setRecords(res.data.records);
      setSearched(true);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Group by subject
  const bySubject = {};
  for (const r of records) {
    if (!bySubject[r.subject]) bySubject[r.subject] = [];
    bySubject[r.subject].push(r);
  }

  const overallStats = records.length > 0 ? {
    avgScore: (records.reduce((s, r) => s + r.classAverage, 0) / records.length).toFixed(1),
    totalRecords: records.length,
    published: records.filter(r => r.isPublished).length,
    subjects: Object.keys(bySubject).length,
  } : null;

  return (
    <DashboardLayout>
      <div className="mgmt-cia-root">
        <div className="mgmt-cia-header">
          <h1>CIA Assessment Summary</h1>
          <p>Class-wise internal assessment overview</p>
        </div>

        {/* Filter card */}
        <div className="mgmt-cia-filter">
          <div className="filter-row">
            <div className="fg"><label>Department</label><select value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
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
            <button className="cia-search-btn" onClick={fetchSummary} disabled={loading}>
              {loading ? 'Loading...' : '🔍 Load Summary'}
            </button>
          </div>
        </div>

        {/* Overview stats */}
        {overallStats && (
          <div className="cia-overview-stats">
            {[
              { icon: '📚', label: 'Subjects Assessed', val: overallStats.subjects, color: '#2563eb' },
              { icon: '📋', label: 'Total CIA Records', val: overallStats.totalRecords, color: '#7c3aed' },
              { icon: '📢', label: 'Published', val: overallStats.published, color: '#15803d' },
              { icon: '📊', label: 'Overall Avg Score', val: overallStats.avgScore, color: '#d97706' },
            ].map(s => (
              <div key={s.label} className="cia-stat-card">
                <span className="cia-stat-icon">{s.icon}</span>
                <span className="cia-stat-val" style={{ color: s.color }}>{s.val}</span>
                <span className="cia-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Subject-wise table */}
        {searched && (
          <div className="cia-table-card">
            <h3 className="cia-table-title">
              📊 {filters.department} — Semester {filters.semester} | Section {filters.section}
            </h3>

            {records.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 48, marginBottom: 10 }}>📋</div>
                <p>No CIA records found for this class.</p>
              </div>
            ) : (
              <table className="cia-summary-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Staff</th>
                    <th>Type</th>
                    <th>Max Marks</th>
                    <th>Class Avg</th>
                    <th>Highest</th>
                    <th>Lowest</th>
                    <th>Pass Count</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const tc = TYPE_COLOR[r.assessmentType] || TYPE_COLOR['CIA-1'];
                    const avgPct = Math.round((r.classAverage / r.maxMarks) * 100);
                    const avgColor = avgPct >= 60 ? '#15803d' : avgPct >= 40 ? '#d97706' : '#dc2626';
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: '#1e293b' }}>{r.subject}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{r.staffId?.name || '—'}</td>
                        <td><span className="cia-type-chip" style={{ background: tc.bg, color: tc.color }}>{r.assessmentType}</span></td>
                        <td style={{ textAlign: 'center' }}>{r.maxMarks}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span style={{ fontWeight: 700, color: avgColor }}>{r.classAverage}</span>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{avgPct}%</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#15803d' }}>{r.highestMark}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>{r.lowestMark}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{r.passCount}</span>
                        </td>
                        <td>
                          <span className="status-chip" style={{
                            background: r.isPublished ? '#dcfce7' : '#fef3c7',
                            color: r.isPublished ? '#15803d' : '#d97706',
                          }}>
                            {r.isPublished ? '✅ Published' : '📝 Draft'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!searched && (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🏛️</div>
            <p>Select department, semester and section then click Load Summary.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
