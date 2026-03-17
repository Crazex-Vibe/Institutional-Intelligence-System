import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';
import './ManagementStaff.css';

const DEPARTMENTS = ['', 'AI&DS', 'Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical', 'Civil'];

export default function ManagementStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchStaff(); }, [filterDept]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = { role: 'staff' };
      if (filterDept) params.department = filterDept;
      const res = await API.get('/users', { params });
      setStaff(res.data.users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleToggleStatus = async (s) => {
    if (!window.confirm(`${s.isActive ? 'Deactivate' : 'Activate'} ${s.name}?`)) return;
    try {
      await API.put(`/users/${s._id}/toggle-status`);
      await fetchStaff();
      if (selected?._id === s._id) setSelected(null);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.staffProfile?.staffId?.toLowerCase().includes(search.toLowerCase()) ||
    s.staffProfile?.department?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = staff.filter(s => s.isActive).length;

  return (
    <DashboardLayout>
      <div className="ms-root">
        {/* Header */}
        <div className="ms-header">
          <div>
            <h1>Staff Management</h1>
            <p>View and manage all staff members</p>
          </div>
          <div className="ms-summary">
            <div className="ms-pill" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <span>{staff.length}</span><label>Total</label>
            </div>
            <div className="ms-pill" style={{ background: '#dcfce7', color: '#15803d' }}>
              <span>{activeCount}</span><label>Active</label>
            </div>
            <div className="ms-pill" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <span>{staff.length - activeCount}</span><label>Inactive</label>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="ms-filters">
          <input
            className="ms-search"
            placeholder="🔎 Search by name, email, staff ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="ms-dept" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="ms-layout">
          {/* Left: staff list */}
          <div className="ms-list-panel">
            <div className="ms-list-count">{filtered.length} staff member{filtered.length !== 1 ? 's' : ''}</div>
            {loading ? (
              <div className="ms-empty">⏳ Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="ms-empty">
                <div style={{ fontSize: 40, marginBottom: 10 }}>👩‍🏫</div>
                <p>No staff found.</p>
              </div>
            ) : filtered.map(s => (
              <div
                key={s._id}
                className={`ms-staff-item ${selected?._id === s._id ? 'active' : ''} ${!s.isActive ? 'inactive' : ''}`}
                onClick={() => setSelected(selected?._id === s._id ? null : s)}
              >
                <div className="msi-avatar" style={{ background: s.isActive ? '#7c3aed' : '#94a3b8' }}>
                  {s.name.charAt(0)}
                </div>
                <div className="msi-info">
                  <div className="msi-name">{s.name}</div>
                  <div className="msi-meta">{s.staffProfile?.staffId} • {s.staffProfile?.department}</div>
                </div>
                <div className="msi-right">
                  <span className="msi-desig">{s.staffProfile?.designation?.replace('Assistant ', 'Asst. ').replace('Associate ', 'Assoc. ')}</span>
                  {!s.isActive && <span className="msi-inactive-dot">●</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Right: detail panel */}
          <div className="ms-detail-panel">
            {!selected ? (
              <div className="ms-detail-empty">
                <div style={{ fontSize: 48, marginBottom: 12 }}>👈</div>
                <p>Select a staff member to view details</p>
              </div>
            ) : (
              <div className="ms-detail-content">
                {/* Hero */}
                <div className="msd-hero">
                  <div className="msd-avatar">{selected.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <h2 className="msd-name">{selected.name}</h2>
                    <div className="msd-desig">{selected.staffProfile?.designation}</div>
                    <div className="msd-chips">
                      <span className="msd-chip">{selected.staffProfile?.staffId}</span>
                      <span className="msd-chip">{selected.staffProfile?.department}</span>
                      <span
                        className="msd-chip"
                        style={{
                          background: selected.isActive ? '#dcfce7' : '#fef2f2',
                          color: selected.isActive ? '#15803d' : '#dc2626'
                        }}
                      >
                        {selected.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="msd-section">
                  {[
                    ['📧', 'Email', selected.email],
                    ['🏢', 'Department', selected.staffProfile?.department || '—'],
                    ['🪪', 'Staff ID', selected.staffProfile?.staffId || '—'],
                    ['🎓', 'Designation', selected.staffProfile?.designation || '—'],
                    ['📅', 'Joined', selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                    ['🕐', 'Last Login', selected.lastLogin ? new Date(selected.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'],
                  ].map(([icon, label, val]) => (
                    <div key={label} className="msd-row">
                      <span className="msd-icon">{icon}</span>
                      <span className="msd-label">{label}</span>
                      <span className="msd-val">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Subjects */}
                {selected.staffProfile?.subjects?.length > 0 && (
                  <div className="msd-subjects">
                    <div className="msd-subjects-title">📚 Subjects</div>
                    <div className="msd-subjects-list">
                      {selected.staffProfile.subjects.map((subj, i) => (
                        <span key={i} className="subj-chip">{subj}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="msd-actions">
                  <button
                    className={`msd-toggle-btn ${selected.isActive ? 'deactivate' : 'activate'}`}
                    onClick={() => handleToggleStatus(selected)}
                  >
                    {selected.isActive ? '🚫 Deactivate Account' : '✅ Activate Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
