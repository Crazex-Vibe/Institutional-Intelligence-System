import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';
import './StaffDirectory.css';

const DEPARTMENTS = ['','AI&DS', 'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'IT'];

export default function StaffDirectory() {
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

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.staffProfile?.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    s.staffProfile?.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="dir-root">
        <div className="dir-header">
          <h1>Staff Directory</h1>
          <p>View all staff members across departments</p>
        </div>

        <div className="dir-filters">
          <input className="dir-search" placeholder="🔎 Search by name, employee ID..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="dir-dept" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="dir-layout">
          {/* Grid of staff cards */}
          <div className="dir-grid">
            {loading ? (
              <div className="dir-loading">⏳ Loading staff...</div>
            ) : filtered.length === 0 ? (
              <div className="dir-empty">
                <div style={{ fontSize: 44 }}>👩‍🏫</div>
                <p>No staff found.</p>
              </div>
            ) : filtered.map(s => (
              <div
                key={s._id}
                className={`staff-card ${selected?._id === s._id ? 'active' : ''} ${!s.isActive ? 'inactive' : ''}`}
                onClick={() => setSelected(selected?._id === s._id ? null : s)}
              >
                <div className="sc-avatar">{s.name.charAt(0)}</div>
                <div className="sc-name">{s.name}</div>
                <div className="sc-desig">{s.staffProfile?.designation}</div>
                <div className="sc-dept">{s.staffProfile?.department}</div>
                <div className="sc-id">{s.staffProfile?.employeeId}</div>
                {!s.isActive && <span className="sc-inactive">Inactive</span>}
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="dir-detail">
              <button className="dir-close" onClick={() => setSelected(null)}>✕</button>
              <div className="dd-avatar">{selected.name.charAt(0)}</div>
              <h2 className="dd-name">{selected.name}</h2>
              <div className="dd-desig">{selected.staffProfile?.designation}</div>

              <div className="dd-section">
                {[
                  ['📧', 'Email', selected.email],
                  ['🏢', 'Department', selected.staffProfile?.department],
                  ['🪪', 'Employee ID', selected.staffProfile?.employeeId],
                  ['📱', 'Phone', selected.staffProfile?.phone || '—'],
                  ['📚', 'Subjects', selected.staffProfile?.subjects?.join(', ') || '—'],
                  ['●', 'Status', selected.isActive ? 'Active' : 'Inactive'],
                ].map(([icon, label, val]) => (
                  <div key={label} className="dd-row">
                    <span className="dd-icon">{icon}</span>
                    <span className="dd-label">{label}</span>
                    <span className="dd-val">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
