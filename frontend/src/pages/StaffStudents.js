import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { DEPARTMENTS } from '../utils/departments';
import './StudentsList.css';

export default function StaffStudents() {
  const { user } = useAuth();
  const dept = user?.staffProfile?.department || '';

  const [filters, setFilters] = useState({ department: dept, semester: '', section: '' });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [search, setSearch] = useState('');
  const [fetched, setFetched] = useState(false);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setSelected(null);
    setOverview(null);
    try {
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.semester) params.semester = filters.semester;
      if (filters.section) params.section = filters.section;
      const res = await API.get('/profile/students', { params });
      setStudents(res.data.students || []);
      setFetched(true);
    } catch (err) {
      console.error(err);
      setStudents([]);
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
      setOverview(res.data.student || res.data.overview || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const filtered = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.studentProfile?.rollNumber?.toLowerCase().includes(q)
    );
  });

  const feeColor = { paid: '#15803d', pending: '#dc2626', partial: '#d97706' };
  const feeBg   = { paid: '#dcfce7', pending: '#fef2f2', partial: '#fef3c7' };

  return (
    <DashboardLayout>
      <div className="students-root">
        <div className="students-header">
          <div>
            <h1 className="students-title">My Students</h1>
            <p className="students-sub">View student overviews for your class</p>
          </div>
        </div>

        <div className="filters-card">
          <div className="filters-row">
            <div className="filter-group">
              <label>Department</label>
              <select value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
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
          <input className="search-input" placeholder="🔎 Search by name or roll number..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="students-layout">
          <div className="students-list-panel">
            <div className="list-count">{filtered.length} student{filtered.length !== 1 ? 's' : ''} found</div>
            {loading ? (
              <div className="list-loading">⏳ Loading students...</div>
            ) : filtered.length === 0 ? (
              <div className="list-empty">
                <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
                <p>No students found.</p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Try clearing semester/section filters.</p>
              </div>
            ) : (
              filtered.map(s => (
                <div key={s._id}
                  className={`student-item ${selected?._id === s._id ? 'active' : ''}`}
                  onClick={() => viewOverview(s)}>
                  <div className="si-avatar">{s.name?.charAt(0)}</div>
                  <div className="si-info">
                    <div className="si-name">{s.name}</div>
                    <div className="si-roll">
                      {s.studentProfile?.rollNumber || 'No Roll No'}
                      {s.studentProfile?.section && ` • Sec ${s.studentProfile.section}`}
                      {s.studentProfile?.semester && ` • Sem ${s.studentProfile.semester}`}
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
                <div className="ov-hero">
                  <div className="ov-avatar">{(overview.name || selected.name)?.charAt(0)}</div>
                  <div>
                    <h2 className="ov-name">{overview.name || selected.name}</h2>
                    <div className="ov-chips">
                      <span className="ov-chip">{overview.rollNumber || selected.studentProfile?.rollNumber}</span>
                      <span className="ov-chip">{overview.department || selected.studentProfile?.department}</span>
                      <span className="ov-chip">Sem {overview.semester || selected.studentProfile?.semester} | Sec {overview.section || selected.studentProfile?.section}</span>
                    </div>
                  </div>
                </div>
                <div className="staff-notice">
                  👁️ You are viewing a <strong>staff overview</strong>. Full profile is visible to management only.
                </div>
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
                <div className="ov-section">
                  <div className="ov-row">
                    <span className="ov-key">Fee Status</span>
                    <span className="grade-badge" style={{ background: feeBg[overview.feeStatus] || '#f1f5f9', color: feeColor[overview.feeStatus] || '#64748b', textTransform: 'capitalize' }}>
                      {overview.feeStatus || '—'}
                    </span>
                  </div>
                  <div className="ov-row">
                    <span className="ov-key">Email</span>
                    <span className="ov-val">{selected.email}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overview-empty">
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                <p>Could not load profile. Try again.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
