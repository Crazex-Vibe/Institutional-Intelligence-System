import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import './StudentsList.css';

export default function StaffStudents() {
  const { user } = useAuth();
  const dept = user?.staffProfile?.department || '';

  const [filters, setFilters] = useState({ department: dept, semester: '5', section: 'A' });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/profile/students', { params: filters });
      setStudents(res.data.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewOverview = async (student) => {
    setSelected(student);
    setOverview(null);
    setLoadingProfile(true);
    try {
      const res = await API.get(`/profile/student/${student._id}`);
      setOverview(res.data.student);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentProfile?.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const feeColor = { paid: '#15803d', pending: '#dc2626', partial: '#d97706' };
  const feeBg = { paid: '#dcfce7', pending: '#fef2f2', partial: '#fef3c7' };

  return (
    <DashboardLayout>
      <div className="students-root">
        <div className="students-header">
          <div>
            <h1 className="students-title">My Students</h1>
            <p className="students-sub">View student overviews for your class</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-row">
            <div className="filter-group">
              <label>Department</label>
              <input value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})} placeholder="e.g. Computer Science" />
            </div>
            <div className="filter-group">
              <label>Semester</label>
              <select value={filters.semester} onChange={e => setFilters({...filters, semester: e.target.value})}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Section</label>
              <select value={filters.section} onChange={e => setFilters({...filters, section: e.target.value})}>
                {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <button className="filter-btn" onClick={fetchStudents} disabled={loading}>
              {loading ? 'Loading...' : '🔍 Search'}
            </button>
          </div>
          <input
            className="search-input"
            placeholder="🔎 Search by name or roll number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="students-layout">
          {/* Student list */}
          <div className="students-list-panel">
            <div className="list-count">{filtered.length} student{filtered.length !== 1 ? 's' : ''} found</div>
            {loading ? (
              <div className="list-loading">⏳ Loading students...</div>
            ) : filtered.length === 0 ? (
              <div className="list-empty">
                <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
                <p>No students found. Try adjusting filters.</p>
              </div>
            ) : (
              filtered.map((s, i) => (
                <div
                  key={s._id}
                  className={`student-item ${selected?._id === s._id ? 'active' : ''}`}
                  onClick={() => viewOverview(s)}
                >
                  <div className="si-avatar">{s.name.charAt(0)}</div>
                  <div className="si-info">
                    <div className="si-name">{s.name}</div>
                    <div className="si-roll">{s.studentProfile?.rollNumber} • Sec {s.studentProfile?.section}</div>
                  </div>
                  <div className="si-cgpa">
                    <span>{s.studentProfile?.cgpa?.toFixed(1) || '—'}</span>
                    <label>CGPA</label>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Overview panel */}
          <div className="overview-panel">
            {!selected ? (
              <div className="overview-empty">
                <div style={{ fontSize: 48, marginBottom: 12 }}>👈</div>
                <p>Select a student to view their overview</p>
              </div>
            ) : loadingProfile ? (
              <div className="overview-empty">⏳ Loading overview...</div>
            ) : overview ? (
              <div className="overview-content">
                {/* Student header */}
                <div className="ov-hero">
                  <div className="ov-avatar">{overview.name?.charAt(0)}</div>
                  <div>
                    <h2 className="ov-name">{overview.name}</h2>
                    <div className="ov-chips">
                      <span className="ov-chip">{overview.rollNumber}</span>
                      <span className="ov-chip">{overview.department}</span>
                      <span className="ov-chip">Sem {overview.semester} | Sec {overview.section}</span>
                    </div>
                  </div>
                </div>

                {/* Staff restriction notice */}
                <div className="staff-notice">
                  👁️ You are viewing a <strong>staff overview</strong>. Full profile is visible to management only.
                </div>

                {/* Stats grid */}
                <div className="ov-stats">
                  {[
                    { icon: '📊', label: 'CGPA', val: overview.cgpa?.toFixed(2) || '—', color: '#2563eb' },
                    { icon: '🎓', label: 'Credits Earned', val: overview.totalCreditsEarned || 0, color: '#7c3aed' },
                    { icon: '⚠️', label: 'Arrears', val: overview.totalArrears || 0, color: overview.totalArrears > 0 ? '#dc2626' : '#15803d' },
                  ].map(stat => (
                    <div key={stat.label} className="ov-stat-card">
                      <span className="ov-stat-icon">{stat.icon}</span>
                      <span className="ov-stat-val" style={{ color: stat.color }}>{stat.val}</span>
                      <span className="ov-stat-label">{stat.label}</span>
                    </div>
                  ))}
                </div>

                {/* Fee & scholarship */}
                <div className="ov-section">
                  <div className="ov-row">
                    <span className="ov-key">Fee Status</span>
                    <span className="grade-badge" style={{ background: feeBg[overview.feeStatus] || '#f1f5f9', color: feeColor[overview.feeStatus] || '#64748b', textTransform: 'capitalize' }}>
                      {overview.feeStatus || '—'}
                    </span>
                  </div>
                  <div className="ov-row">
                    <span className="ov-key">Scholarship</span>
                    <span className="ov-val" style={{ textTransform: 'capitalize' }}>{overview.scholarshipStatus || 'none'}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
